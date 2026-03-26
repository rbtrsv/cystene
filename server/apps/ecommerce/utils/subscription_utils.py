"""
Nudgio Subscription Utilities

Order-based tier system. Each subscription tier unlocks more connections
and monthly order processing capacity. All features (recommendations,
widgets, styling) are available on every tier including FREE.

Tier model:
- FREE: 1 connection, 50 orders/month, 10 req/min
- PRO: 5 connections, 2000 orders/month, 100 req/min
- ENTERPRISE: unlimited connections, unlimited orders, 500 req/min

Pricing (EUR):
- FREE: €0/mo
- PRO: €12/mo
- ENTERPRISE: €36/mo

Stripe Dashboard setup (required once):
    1. Products → Create products:
       - "Pro" → €12/month recurring
         description: "Scale your store with smart product recommendations for growing ecommerce businesses."
         metadata: tier=PRO, tier_order=0
         features=5 connections,2000 orders/month,All recommendation types,Configurable widgets,100 req/min,Email support
       - "Enterprise" → €36/month recurring
         description: "Unlimited recommendation engine for high-volume ecommerce operations."
         metadata: tier=ENTERPRISE, tier_order=1
         features=Unlimited connections,Unlimited orders,All recommendation types,Configurable widgets,500 req/min,Priority support,Full API access
    2. Developers → Webhooks → Add endpoint:
       (already configured in accounts)
    3. Settings → Billing → Customer Portal:
       - "Customers can switch plans" → ON
       - Add Pro and Enterprise to eligible subscription products
       - Cancellations → Allow customers to cancel → ON

These are pure helpers — not FastAPI dependencies. The dependency that
uses them lives in dependency_utils.py (require_active_subscription).

Pricing changes (Stripe Dashboard):
    Prices are changed directly in Stripe Dashboard — code never checks amounts.
    Only requirement: Stripe Product metadata "tier" must be "PRO" or "ENTERPRISE"
    (must match TIER_ORDER below). Webhooks populate Subscription.plan_name from this.

Pricing changes (Shopify Dashboard):
    Same TIER_LIMITS apply. Plan name mapping lives in
    shopify_billing_utils.py → map_shopify_plan_to_tier().
"""

import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import case

from ..models import EcommerceConnection, APIUsageTracking, ShopifyBilling
from apps.accounts.models import Subscription

logger = logging.getLogger(__name__)

# ==========================================
# Constants
# ==========================================

# Subscription tiers from lowest to highest — index-based comparison.
# FREE is implicit (no subscription record needed).
# PRO/ENTERPRISE match Stripe product metadata "tier" values.
TIER_ORDER = ["FREE", "PRO", "ENTERPRISE"]

# Days after subscription cancellation before service is fully disabled.
# During grace period: full access (reads + writes).
# After grace period: all ecommerce endpoints return 403.
GRACE_PERIOD_DAYS = 7

# Tier limits — connections, monthly orders, requests per minute/hour
TIER_LIMITS = {
    "FREE":       {"max_connections": 1,    "max_monthly_orders": 50,   "requests_per_minute": 10,  "requests_per_hour": 100},
    "PRO":        {"max_connections": 5,    "max_monthly_orders": 2000, "requests_per_minute": 100, "requests_per_hour": 5000},
    "ENTERPRISE": {"max_connections": None, "max_monthly_orders": None, "requests_per_minute": 500, "requests_per_hour": 20000},
}

# ==========================================
# Query Helpers
# ==========================================

async def get_org_subscription(org_id: int, session: AsyncSession) -> Subscription | None:
    """
    Get the organization's subscription record.

    Args:
        org_id: Organization ID
        session: Database session

    Returns:
        Subscription or None
    """
    result = await session.execute(
        select(Subscription).filter(Subscription.organization_id == org_id)
    )
    return result.scalar_one_or_none()


async def get_org_connection_count(org_id: int, session: AsyncSession) -> int:
    """
    Count non-deleted connections owned by an organization.

    This is the billing quantity — each connection counts toward the tier limit.

    Args:
        org_id: Organization ID
        session: Database session

    Returns:
        Number of active (non-deleted) connections
    """
    result = await session.execute(
        select(func.count(EcommerceConnection.id))
        .filter(
            EcommerceConnection.organization_id == org_id,
            EcommerceConnection.deleted_at.is_(None)
        )
    )
    return result.scalar() or 0


async def get_org_monthly_order_count(org_id: int, session: AsyncSession) -> int:
    """
    Count recommendation API calls for this org in the current calendar month.

    Counts APIUsageTracking records where endpoint contains "recommendations"
    and timestamp is in the current month. This is our proxy for "orders
    processed" — every recommendation request = processing order data.

    Args:
        org_id: Organization ID
        session: Database session

    Returns:
        Number of recommendation requests this month
    """
    now = datetime.now(timezone.utc)
    result = await session.execute(
        select(func.count(APIUsageTracking.id))
        .filter(
            APIUsageTracking.organization_id == org_id,
            APIUsageTracking.endpoint.contains("recommendations"),
            extract("year", APIUsageTracking.timestamp) == now.year,
            extract("month", APIUsageTracking.timestamp) == now.month,
        )
    )
    return result.scalar() or 0


async def get_org_shopify_billing(org_id: int, session: AsyncSession) -> ShopifyBilling | None:
    """
    Get the organization's best ShopifyBilling entitlement.

    An org may have multiple Shopify connections (multiple stores), each with
    its own ShopifyBilling record. This returns the single most favorable record
    for tier resolution and service access checks.

    Priority order (deterministic):
    1. ACTIVE ENTERPRISE
    2. ACTIVE PRO
    3. CANCELED/PAST_DUE ENTERPRISE (may still be in grace period)
    4. CANCELED/PAST_DUE PRO (may still be in grace period)
    5. None — no billing records, org is on FREE tier

    Tie-break within same status + tier: most recently updated (updated_at DESC,
    then start_date DESC).

    Query: all non-deleted ShopifyBilling for org_id, ordered by:
      - CASE billing_status WHEN 'ACTIVE' THEN 0 WHEN 'PAST_DUE' THEN 1 WHEN 'CANCELED' THEN 2 ELSE 3 END ASC
      - CASE plan_name WHEN 'ENTERPRISE' THEN 0 WHEN 'PRO' THEN 1 ELSE 2 END ASC
      - COALESCE(updated_at, start_date) DESC
    LIMIT 1

    Args:
        org_id: Organization ID
        session: Database session

    Returns:
        ShopifyBilling or None
    """
    # Priority ordering: ACTIVE > PAST_DUE > CANCELED > others
    status_priority = case(
        (ShopifyBilling.billing_status == "ACTIVE", 0),
        (ShopifyBilling.billing_status == "PAST_DUE", 1),
        (ShopifyBilling.billing_status == "CANCELED", 2),
        else_=3,
    )

    # Tier ordering: ENTERPRISE > PRO > others
    tier_priority = case(
        (ShopifyBilling.plan_name == "ENTERPRISE", 0),
        (ShopifyBilling.plan_name == "PRO", 1),
        else_=2,
    )

    result = await session.execute(
        select(ShopifyBilling)
        .where(
            ShopifyBilling.organization_id == org_id,
            ShopifyBilling.billing_status != "PENDING",
            ShopifyBilling.deleted_at.is_(None),  # Exclude soft-deleted records
        )
        .order_by(
            status_priority.asc(),
            tier_priority.asc(),
            func.coalesce(ShopifyBilling.updated_at, ShopifyBilling.start_date).desc(),
        )
        .limit(1)
    )
    return result.scalar_one_or_none()


# ==========================================
# Logic Helpers
# ==========================================

def get_org_tier(subscription: Subscription | None) -> str:
    """
    Determine the organization's current tier from their subscription.

    - No subscription record → FREE
    - subscription.plan_name matches TIER_ORDER → return it
    - Unknown plan_name → FREE

    Args:
        subscription: Subscription model instance or None

    Returns:
        Tier string: "FREE", "PRO", or "ENTERPRISE"
    """
    if not subscription:
        return "FREE"

    if subscription.plan_name in TIER_ORDER:
        return subscription.plan_name

    return "FREE"


def tier_is_sufficient(current_tier: str, required_tier: str) -> bool:
    """
    Check if current tier meets or exceeds the required tier.

    Uses index-based comparison on TIER_ORDER.

    Args:
        current_tier: Organization's current tier (e.g. "PRO")
        required_tier: Minimum tier needed (e.g. "FREE")

    Returns:
        True if current_tier >= required_tier
    """
    # Handle unknown tiers defensively
    if current_tier not in TIER_ORDER:
        return False
    if required_tier not in TIER_ORDER:
        return False

    return TIER_ORDER.index(current_tier) >= TIER_ORDER.index(required_tier)


def get_tier_limits(tier: str) -> dict:
    """
    Get the limits for a specific tier.

    Args:
        tier: Tier string ("FREE", "PRO", "ENTERPRISE")

    Returns:
        Dict with max_connections, max_monthly_orders, requests_per_minute, requests_per_hour
    """
    return TIER_LIMITS.get(tier, TIER_LIMITS["FREE"])


def is_shopify_billing_active(shopify_billing: ShopifyBilling | None) -> bool:
    """
    Check if a ShopifyBilling record grants active service.

    Same grace period logic as Stripe subscriptions:
    - ACTIVE → True
    - CANCELED/PAST_DUE within grace period (end_date + GRACE_PERIOD_DAYS > now) → True
    - Otherwise → False

    Args:
        shopify_billing: ShopifyBilling model instance or None

    Returns:
        True if service should be active, False otherwise
    """
    if not shopify_billing:
        return False

    if shopify_billing.billing_status == "ACTIVE":
        return True

    # CANCELED/PAST_DUE — check grace period
    if shopify_billing.billing_status in ("CANCELED", "PAST_DUE"):
        if shopify_billing.end_date:
            grace_deadline = shopify_billing.end_date + timedelta(days=GRACE_PERIOD_DAYS)
            if datetime.now(timezone.utc) < grace_deadline:
                return True

    return False


async def is_over_connection_limit(org_id: int, session: AsyncSession, subscription: Subscription | None) -> bool:
    """
    Check if the organization has reached their connection limit.

    Used before creating a new connection to enforce tier-based limits.

    Args:
        org_id: Organization ID
        session: Database session
        subscription: Organization's subscription (or None for FREE tier)

    Returns:
        True if at or over limit (cannot create more connections)
    """
    tier = get_org_tier(subscription)
    limits = get_tier_limits(tier)

    # None = unlimited (ENTERPRISE)
    if limits["max_connections"] is None:
        return False

    current_count = await get_org_connection_count(org_id, session)
    return current_count >= limits["max_connections"]


async def is_service_active(org_id: int, session: AsyncSession) -> bool:
    """
    The main subscription check — called by require_active_subscription dependency.

    Determines whether the organization's ecommerce service is active.
    When inactive, ALL ecommerce endpoints return 403 (reads + writes blocked).

    Logic:
    1. Get subscription
    2. If no subscription → check if under FREE limits → if yes: active, if no: inactive
    3. If subscription ACTIVE/TRIALING → active
    4. If subscription CANCELED/PAST_DUE/UNPAID:
       - Check end_date + GRACE_PERIOD_DAYS > now → active (in grace period)
       - Otherwise → inactive
    5. If subscription has manual_override → active (bypass Stripe status)

    Args:
        org_id: Organization ID
        session: Database session

    Returns:
        True if service is active (requests allowed), False if blocked
    """
    subscription = await get_org_subscription(org_id, session)

    # No subscription record → FREE tier
    if not subscription:
        # FREE tier is active as long as within limits
        connection_count = await get_org_connection_count(org_id, session)
        free_limits = get_tier_limits("FREE")
        return connection_count <= free_limits["max_connections"]

    # Manual override bypasses Stripe status checks (invoice/bank transfer clients)
    if subscription.manual_override:
        return True

    # Active or trialing subscription → service active
    if subscription.subscription_status in ("ACTIVE", "TRIALING"):
        return True

    # Canceled/past_due/unpaid — check grace period
    if subscription.subscription_status in ("CANCELED", "PAST_DUE", "UNPAID"):
        if subscription.end_date:
            grace_deadline = subscription.end_date + timedelta(days=GRACE_PERIOD_DAYS)
            if datetime.now(timezone.utc) < grace_deadline:
                return True

    # All other statuses → inactive
    return False


async def is_service_active_with_subscription(
    subscription: Subscription | None, org_id: int, session: AsyncSession
) -> bool:
    """
    Same logic as is_service_active but accepts a pre-resolved subscription.

    Used by require_active_subscription (via OrgContext) to avoid re-querying
    get_org_subscription when the subscription is already resolved.

    Only hits the DB for FREE tier (get_org_connection_count check).

    Args:
        subscription: Pre-resolved subscription from OrgContext (or None for FREE tier)
        org_id: Organization ID (needed for connection count on FREE tier)
        session: Database session (needed for connection count on FREE tier)

    Returns:
        True if service is active (requests allowed), False if blocked
    """
    # No subscription record → FREE tier
    if not subscription:
        # FREE tier is active as long as within limits
        connection_count = await get_org_connection_count(org_id, session)
        free_limits = get_tier_limits("FREE")
        return connection_count <= free_limits["max_connections"]

    # Manual override bypasses Stripe status checks (invoice/bank transfer clients)
    if subscription.manual_override:
        return True

    # Active or trialing subscription → service active
    if subscription.subscription_status in ("ACTIVE", "TRIALING"):
        return True

    # Canceled/past_due/unpaid — check grace period
    if subscription.subscription_status in ("CANCELED", "PAST_DUE", "UNPAID"):
        if subscription.end_date:
            grace_deadline = subscription.end_date + timedelta(days=GRACE_PERIOD_DAYS)
            if datetime.now(timezone.utc) < grace_deadline:
                return True

    # All other statuses → inactive
    return False
