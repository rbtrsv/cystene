"""
Stripe subscription regression tests (cystene).

Adapted from finpy/server/apps/accounts/tests/stripe_webhook_test.py, but cystene
is a SINGLE-app product: the Subscription model has NO `app_name` and `organization_id`
is UNIQUE (one subscription per org), so the cross-app safety tests don't apply here.

What we guard instead — the two bugs that actually bit us:
  1. The webhook must persist a Subscription row (handle_subscription_change end-to-end).
  2. GET /accounts/subscriptions/organizations/{id} must return EVERY field the frontend
     Zod SubscriptionSchema requires. Omitting any (stripe_customer_id /
     stripe_subscription_id / stripe_product_id) made the Zod parse fail, currentSubscription
     stayed null, and the UI fell back to "Free / Current" even with an ACTIVE paid plan.

Run:  cd server && .venv/bin/python -m pytest apps/accounts/tests/stripe_webhook_test.py -v
(pytest-asyncio in auto mode picks up the async tests; Stripe signature + SDK calls are
monkey-patched so no live API/secret is needed.)
"""

import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

from apps.accounts.models import Organization, OrganizationMember, Subscription

pytestmark = pytest.mark.asyncio

# The exact field set the frontend Zod SubscriptionSchema requires (nullable but PRESENT).
# Mirror of client/src/modules/accounts/schemas/subscriptions.schema.ts SubscriptionSchema.
FRONTEND_REQUIRED_FIELDS = {
    "id",
    "stripe_customer_id",
    "stripe_subscription_id",
    "stripe_product_id",
    "plan_name",
    "subscription_status",
    "start_date",
    "end_date",
}


# ==========================================
# Test helpers
# ==========================================

async def _make_test_db(monkeypatch):
    """In-memory SQLite + create ONLY the tables these tests touch, and monkey-patch
    the global session factory the webhook handler uses.

    StaticPool keeps a single underlying connection so every AsyncSession sees the same
    in-memory DB. We create tables explicitly (not Base.metadata.create_all) because
    importing the FastAPI app pulls in cybersecurity models with Postgres-only types
    (ARRAY/JSONB) that SQLite cannot compile.
    """
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
        future=True,
    )
    async with engine.begin() as conn:
        for model in (Organization, OrganizationMember, Subscription):
            await conn.run_sync(
                lambda sync_conn, m=model: m.__table__.create(sync_conn, checkfirst=True)
            )
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    monkeypatch.setattr("apps.accounts.utils.stripe_utils.async_session", factory)
    return factory


def _bypass_stripe(monkeypatch, products, customers):
    """Bypass webhook signature verification + route Product/Customer.retrieve to
    in-memory registries instead of the live Stripe API."""
    monkeypatch.setattr(
        "apps.accounts.utils.stripe_utils.STRIPE_WEBHOOK_SECRET", "whsec_test"
    )
    monkeypatch.setattr("stripe.Webhook.construct_event", lambda p, s, k: json.loads(p))
    monkeypatch.setattr("stripe.Product.retrieve", lambda pid, **_: products[pid])
    monkeypatch.setattr("stripe.Customer.retrieve", lambda cid, **_: customers[cid])


def _make_event(event_type, sub_id, customer_id, status, product_id):
    """Stripe webhook envelope around a subscription object, shaped the way cystene's
    handle_subscription_change reads it (status + items[0].plan.product)."""
    return {
        "id": f"evt_{sub_id}_{event_type}",
        "type": event_type,
        "data": {
            "object": {
                "id": sub_id,
                "customer": customer_id,
                "status": status,
                "items": {"data": [{"plan": {"product": product_id}}]},
            }
        },
    }


def _post_webhook(client, event):
    return client.post(
        "/accounts/subscriptions/webhook",
        content=json.dumps(event),
        headers={"stripe-signature": "test_sig", "content-type": "application/json"},
    )


# ==========================================
# Test 1 — webhook creates a Subscription row
# ==========================================

async def test_webhook_creates_subscription_row(monkeypatch):
    """A customer.subscription.created event must persist a Subscription row for the
    org named in the Stripe customer metadata, with the tier + ACTIVE status."""
    factory = await _make_test_db(monkeypatch)
    products = {"prod_pro": SimpleNamespace(name="Pro", metadata={"tier": "PRO"})}
    customers = {"cus_x": SimpleNamespace(metadata={"organization_id": "1"})}
    _bypass_stripe(monkeypatch, products, customers)

    async with factory() as session:
        session.add(Organization(id=1, name="Test Org"))
        await session.commit()

    from main import app
    client = TestClient(app)
    resp = _post_webhook(client, _make_event("customer.subscription.created", "sub_1", "cus_x", "active", "prod_pro"))
    assert resp.status_code == 200, resp.text

    async with factory() as session:
        row = (await session.execute(select(Subscription).filter_by(organization_id=1))).scalar_one()

    assert row.subscription_status == "ACTIVE"
    assert row.plan_name == "PRO"
    assert row.stripe_product_id == "prod_pro"
    assert row.stripe_customer_id == "cus_x"
    assert row.stripe_subscription_id == "sub_1"


# ==========================================
# Test 2 — repeated event updates in place (one sub per org)
# ==========================================

async def test_webhook_updates_existing_in_place(monkeypatch):
    """A second event for the same org (created → updated, different event id so the
    dedup set doesn't skip it) must UPDATE the single row, not create a duplicate —
    organization_id is UNIQUE on the cystene Subscription model."""
    factory = await _make_test_db(monkeypatch)
    products = {
        "prod_pro": SimpleNamespace(name="Pro", metadata={"tier": "PRO"}),
        "prod_ent": SimpleNamespace(name="Enterprise", metadata={"tier": "ENTERPRISE"}),
    }
    customers = {"cus_x": SimpleNamespace(metadata={"organization_id": "1"})}
    _bypass_stripe(monkeypatch, products, customers)

    async with factory() as session:
        session.add(Organization(id=1, name="Test Org"))
        await session.commit()

    from main import app
    client = TestClient(app)

    assert _post_webhook(client, _make_event("customer.subscription.created", "sub_1", "cus_x", "active", "prod_pro")).status_code == 200
    # Upgrade to Enterprise — same customer/org, new tier.
    assert _post_webhook(client, _make_event("customer.subscription.updated", "sub_1", "cus_x", "active", "prod_ent")).status_code == 200

    async with factory() as session:
        rows = (await session.execute(select(Subscription).filter_by(organization_id=1))).scalars().all()

    assert len(rows) == 1, f"Expected single row, got {len(rows)}"
    assert rows[0].plan_name == "ENTERPRISE"
    assert rows[0].stripe_product_id == "prod_ent"


# ==========================================
# Test 3 — CRITICAL: get_current_subscription returns every field the frontend needs
# ==========================================

async def test_get_current_subscription_returns_all_frontend_fields(monkeypatch):
    """Regression guard for the "shows Free even when subscribed" bug: the endpoint
    response `data` must contain EVERY field the frontend Zod schema requires, or the
    parse fails and currentSubscription stays null."""
    factory = await _make_test_db(monkeypatch)

    async with factory() as session:
        session.add(Organization(id=1, name="Test Org"))
        session.add(OrganizationMember(user_id=1, organization_id=1, role="OWNER"))
        session.add(Subscription(
            organization_id=1,
            stripe_customer_id="cus_x",
            stripe_subscription_id="sub_1",
            stripe_product_id="prod_pro",
            plan_name="PRO",
            subscription_status="ACTIVE",
        ))
        await session.commit()

    from main import app
    from core.db import get_session
    from apps.accounts.utils.auth_utils import get_current_user

    # Override auth (return a user with id=1) + DB session (use the test factory).
    async def _override_session():
        async with factory() as s:
            yield s

    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=1)
    app.dependency_overrides[get_session] = _override_session
    try:
        client = TestClient(app)
        resp = client.get("/accounts/subscriptions/organizations/1")
        assert resp.status_code == 200, resp.text
        data = resp.json()["data"]
        assert data is not None, "Active subscription returned as None"
        missing = FRONTEND_REQUIRED_FIELDS - set(data.keys())
        assert not missing, f"Response is missing frontend-required fields: {missing}"
        assert data["stripe_product_id"] == "prod_pro"
        assert data["subscription_status"] == "ACTIVE"
    finally:
        app.dependency_overrides.clear()
