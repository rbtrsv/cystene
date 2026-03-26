"""
Ecommerce Dependency Utilities

Shared helper functions and FastAPI dependencies for the ecommerce module.

Connection Ownership Helpers:
    - get_user_connection: ownership + soft-delete filtered lookup (any connection)
    - get_active_connection: same + is_active check (for recommendation/data endpoints)

Organization Helpers:
    - get_user_organization_id: resolve user → organization via OrganizationMember

Shared Context (resolved ONCE per request via FastAPI Depends deduplication):
    - get_org_context: queries org_id + subscription + tier in 2 DB calls, shared
      across all dependencies that need org/subscription info

Router-Level Dependencies (applied to gated router — all gated endpoints):
    - require_active_subscription: blocks all requests when service is inactive (403)
    - enforce_rate_limit: per-org per-minute and per-hour request caps (429)

Subrouter-Level Dependencies (applied to recommendation + component routers only):
    - enforce_monthly_order_limit: blocks when monthly order quota exceeded (403)

Embedded Dependencies (session token auth — Shopify embedded app):
    - get_embedded_org_context: same as get_org_context but derives org_id from
      connection.organization_id instead of JWT user
    - require_embedded_active_subscription: subscription gating for embedded endpoints
    - enforce_embedded_rate_limit: rate limiting for embedded endpoints
    - enforce_embedded_monthly_order_limit: monthly order cap for embedded endpoints
"""

from dataclasses import dataclass
from typing import Optional
from fastapi import HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from ..models import EcommerceConnection, ShopifyBilling
from .subscription_utils import (
    is_service_active_with_subscription,
    get_org_subscription,
    get_org_shopify_billing,
    is_shopify_billing_active,
    get_org_tier,
    get_tier_limits,
    get_org_monthly_order_count,
)
from .rate_limiting_utils import check_rate_limit
from .shopify_session_utils import get_shopify_connection
from apps.accounts.models import User, OrganizationMember, Subscription
from apps.accounts.utils.auth_utils import get_current_user
from core.db import get_session


# ==========================================
# Connection Ownership Helpers
# ==========================================

async def get_user_connection(connection_id: int, user_id: int, db: AsyncSession):
    """
    Get and validate that the user owns the connection.

    Args:
        connection_id: ID of the connection to look up
        user_id: ID of the current user (ownership check)
        db: Database session

    Returns:
        The EcommerceConnection instance

    Raises:
        HTTPException 404 if connection not found or not owned by user
    """
    result = await db.execute(
        select(EcommerceConnection).where(
            and_(
                EcommerceConnection.id == connection_id,
                EcommerceConnection.user_id == user_id,
                EcommerceConnection.deleted_at == None,  # Soft delete filter
            )
        )
    )
    connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )
    return connection


# ⚠️ STANDALONE ONLY — used by standalone endpoints (recommendations, components, data).
# Shopify embedded endpoints use get_shopify_connection (shopify_session_utils.py) instead.
# Changes here do NOT affect Shopify embedded auth flow.
async def get_active_connection(connection_id: int, user_id: int, db: AsyncSession):
    """
    Get and validate that the user owns an active connection.

    Same as get_user_connection but also checks is_active == True.
    Used by recommendation and data endpoints that require a tested connection.

    Args:
        connection_id: ID of the connection to look up
        user_id: ID of the current user (ownership check)
        db: Database session

    Returns:
        The EcommerceConnection instance (guaranteed active)

    Raises:
        HTTPException 404 if connection not found, not owned, or not active
    """
    # Ingest connections are active by definition (no credentials to test),
    # so we skip the is_active check for them
    result = await db.execute(
        select(EcommerceConnection).where(
            and_(
                EcommerceConnection.id == connection_id,
                EcommerceConnection.user_id == user_id,
                or_(
                    EcommerceConnection.is_active == True,
                    EcommerceConnection.connection_method == "ingest",
                ),
                EcommerceConnection.deleted_at == None,  # Soft delete filter
            )
        )
    )
    connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active connection not found"
        )
    return connection


# ==========================================
# Organization Helpers
# ==========================================

async def get_user_organization_id(user_id: int, session: AsyncSession) -> Optional[int]:
    """
    Get the user's organization ID from their membership.

    Args:
        user_id: User ID
        session: Database session

    Returns:
        Organization ID or None if user has no organization
    """
    result = await session.execute(
        select(OrganizationMember.organization_id)
        .filter(OrganizationMember.user_id == user_id)
        .limit(1)
    )
    org_membership = result.scalar_one_or_none()
    return org_membership


# ==========================================
# Shared Organization Context
# ==========================================

@dataclass
class OrgContext:
    """
    Resolved once per request via FastAPI Depends deduplication.

    All dependencies that need org_id / subscription / tier declare
    Depends(get_org_context). FastAPI calls get_org_context exactly once
    per request and reuses the result — reducing 3x org_id + 3x subscription
    queries down to 1x each (3 DB calls total instead of 10+).
    """
    org_id: Optional[int]
    subscription: Optional[Subscription]
    shopify_billing: Optional["ShopifyBilling"]  # Resolved once per request
    tier: str


async def get_org_context(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> OrgContext:
    """
    Resolve the user's organization context in 3 DB calls.

    This endpoint:
    1. Look up the user's organization ID from OrganizationMember
    2. Look up the organization's Stripe subscription record
    3. Look up the organization's best ShopifyBilling entitlement
    4. Derive the tier — ShopifyBilling takes priority if ACTIVE

    FastAPI deduplicates Depends() — when multiple dependencies declare
    Depends(get_org_context), this function runs once and the result is
    shared across require_active_subscription, enforce_rate_limit, and
    enforce_monthly_order_limit within the same request.
    """
    org_id = await get_user_organization_id(user.id, session)
    if not org_id:
        return OrgContext(org_id=None, subscription=None, shopify_billing=None, tier="FREE")

    subscription = await get_org_subscription(org_id, session)
    shopify_billing = await get_org_shopify_billing(org_id, session)

    # Shopify billing takes priority for tier resolution (ACTIVE or grace period)
    if is_shopify_billing_active(shopify_billing):
        tier = shopify_billing.plan_name or "FREE"
    else:
        tier = get_org_tier(subscription)

    return OrgContext(org_id=org_id, subscription=subscription, shopify_billing=shopify_billing, tier=tier)


# ==========================================
# Subscription Dependencies
# ==========================================

async def require_active_subscription(
    ctx: OrgContext = Depends(get_org_context),
    session: AsyncSession = Depends(get_session),
):
    """
    Router-level dependency — covers all gated ecommerce subrouters.

    Blocks ALL requests (reads + writes) when service is inactive.
    Unlike finpy/nexotype which only gate writes, Nudgio blocks everything
    after grace period — widgets show nothing (not broken, just empty).

    Checks ShopifyBilling first (if present, takes priority over Stripe),
    then falls through to existing Stripe subscription check.

    Uses get_org_context (deduplicated) for org_id, subscription, and shopify_billing.
    Passes ctx.subscription to is_service_active_with_subscription to avoid
    re-querying. Only needs its own session for the FREE tier connection
    count check (when subscription is None).
    """
    if not ctx.org_id:
        # No org = no connections = nothing to gate
        return

    # Shopify billing check (if present, takes priority over Stripe)
    if is_shopify_billing_active(ctx.shopify_billing):
        return

    # Existing Stripe subscription check (unchanged)
    if not await is_service_active_with_subscription(ctx.subscription, ctx.org_id, session):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your subscription has expired. Reactivate to restore access."
        )


async def enforce_rate_limit(
    ctx: OrgContext = Depends(get_org_context),
):
    """
    Router-level dependency — enforces per-org rate limits on all gated endpoints.

    Checks per-minute and per-hour request limits based on subscription tier.
    Raises HTTP 429 if either limit is exceeded.

    Uses get_org_context (deduplicated) — no additional DB queries needed.
    """
    if not ctx.org_id:
        # No org = FREE tier defaults
        await check_rate_limit(0, "FREE")
        return

    await check_rate_limit(ctx.org_id, ctx.tier)


async def enforce_monthly_order_limit(
    ctx: OrgContext = Depends(get_org_context),
    session: AsyncSession = Depends(get_session),
):
    """
    Endpoint-level dependency — blocks recommendation requests when monthly order quota is exceeded.

    Only applied to recommendation and component subrouters (not connections, settings, or data).
    Raises HTTP 403 if the organization has exceeded their monthly order limit for their tier.

    Uses get_org_context (deduplicated) for org_id and tier.
    Only needs its own session for the monthly order count query.
    """
    if not ctx.org_id:
        return

    limits = get_tier_limits(ctx.tier)

    # None = unlimited (ENTERPRISE)
    if limits["max_monthly_orders"] is None:
        return

    current_count = await get_org_monthly_order_count(ctx.org_id, session)
    if current_count >= limits["max_monthly_orders"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Monthly order limit exceeded: {limits['max_monthly_orders']} requests/month for {ctx.tier} plan. Upgrade to increase your limit."
        )


# ==========================================
# Embedded Organization Context
# ==========================================

@dataclass
class EmbeddedOrgContext:
    """
    Same as OrgContext but for embedded (session token) auth.

    Derives org_id from connection.organization_id instead of JWT user.
    FastAPI deduplicates Depends() — get_embedded_org_context runs once per
    request, even if multiple embedded dependencies reference it.
    """
    org_id: Optional[int]
    subscription: Optional[Subscription]
    shopify_billing: Optional["ShopifyBilling"]
    tier: str


async def get_embedded_org_context(
    connection: EcommerceConnection = Depends(get_shopify_connection),
    session: AsyncSession = Depends(get_session),
) -> EmbeddedOrgContext:
    """
    Resolve the embedded app's organization context.

    Same logic as get_org_context but derives org_id from the connection
    (resolved via session token) instead of the JWT user. This avoids
    the dependency on get_current_user which requires cookie JWT auth —
    not available in the Shopify Admin iframe (third-party context).

    This endpoint:
    1. Get org_id from connection.organization_id
    2. Look up the organization's Stripe subscription record
    3. Look up the organization's best ShopifyBilling entitlement
    4. Derive the tier — ShopifyBilling takes priority if ACTIVE
    """
    org_id = connection.organization_id
    if not org_id:
        return EmbeddedOrgContext(org_id=None, subscription=None, shopify_billing=None, tier="FREE")

    subscription = await get_org_subscription(org_id, session)
    shopify_billing = await get_org_shopify_billing(org_id, session)

    # Shopify billing takes priority for tier resolution (ACTIVE or grace period)
    if is_shopify_billing_active(shopify_billing):
        tier = shopify_billing.plan_name or "FREE"
    else:
        tier = get_org_tier(subscription)

    return EmbeddedOrgContext(org_id=org_id, subscription=subscription, shopify_billing=shopify_billing, tier=tier)


# ==========================================
# Embedded Subscription Dependencies
# ==========================================

async def require_embedded_active_subscription(
    ctx: EmbeddedOrgContext = Depends(get_embedded_org_context),
    session: AsyncSession = Depends(get_session),
):
    """
    Embedded equivalent of require_active_subscription.

    Blocks embedded requests when service is inactive (no active subscription
    and not in grace period). Applied to settings, recommendations, and
    components endpoints — NOT to init, dashboard, or billing.

    Same subscription check logic as the standalone version:
    - ShopifyBilling ACTIVE → allow
    - Stripe subscription active/trialing → allow
    - Grace period → allow
    - Otherwise → 403
    """
    if not ctx.org_id:
        return

    # Shopify billing check (if present, takes priority over Stripe)
    if is_shopify_billing_active(ctx.shopify_billing):
        return

    # Existing Stripe subscription check (unchanged)
    if not await is_service_active_with_subscription(ctx.subscription, ctx.org_id, session):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your subscription has expired. Reactivate to restore access."
        )


async def enforce_embedded_rate_limit(
    ctx: EmbeddedOrgContext = Depends(get_embedded_org_context),
):
    """
    Embedded equivalent of enforce_rate_limit.

    Enforces per-org rate limits on embedded endpoints.
    Same tier-based limits as standalone.
    """
    if not ctx.org_id:
        await check_rate_limit(0, "FREE")
        return

    await check_rate_limit(ctx.org_id, ctx.tier)


async def enforce_embedded_monthly_order_limit(
    ctx: EmbeddedOrgContext = Depends(get_embedded_org_context),
    session: AsyncSession = Depends(get_session),
):
    """
    Embedded equivalent of enforce_monthly_order_limit.

    Blocks recommendation/component requests when monthly order quota is exceeded.
    Same tier-based limits as standalone.
    """
    if not ctx.org_id:
        return

    limits = get_tier_limits(ctx.tier)

    # None = unlimited (ENTERPRISE)
    if limits["max_monthly_orders"] is None:
        return

    current_count = await get_org_monthly_order_count(ctx.org_id, session)
    if current_count >= limits["max_monthly_orders"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Monthly order limit exceeded: {limits['max_monthly_orders']} requests/month for {ctx.tier} plan. Upgrade to increase your limit."
        )
