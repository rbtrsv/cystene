"""
Cybersecurity Dependency Utilities

Shared helper functions and FastAPI dependencies for the cybersecurity module.

Organization Helpers:
    - get_user_organization_id: resolve user → organization via OrganizationMember

Target Ownership Helpers:
    - get_user_target: ownership + soft-delete filtered lookup for scan targets

Shared Context (resolved ONCE per request via FastAPI Depends deduplication):
    - get_org_context: queries org_id + subscription + tier in 2 DB calls, shared
      across all dependencies that need org/subscription info

Router-Level Dependencies (applied to gated router — all gated endpoints):
    - require_active_subscription: blocks all requests when service is inactive (403)
    - enforce_rate_limit: per-org per-minute and per-hour request caps (429)

Scan-Specific Dependencies (applied at endpoint level):
    - enforce_scan_credit_limit: blocks POST /start when monthly credits exceeded (403)
    - enforce_scan_type_access: blocks if scan_type not in tier's allowed list (403)
"""

from dataclasses import dataclass
from typing import Optional
from fastapi import HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from ..models.infrastructure_models import ScanTarget
from .subscription_utils import (
    get_org_subscription,
    get_org_tier,
    get_tier_limits,
    is_service_active_with_subscription,
    get_monthly_scan_credits_used,
)
from .rate_limiting_utils import check_rate_limit
from apps.accounts.models import User, OrganizationMember, Subscription
from apps.accounts.utils.auth_utils import get_current_user
from core.db import get_session


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
    return result.scalar_one_or_none()


# ==========================================
# Target Ownership Helpers
# ==========================================

async def get_user_target(target_id: int, user_id: int, db: AsyncSession) -> ScanTarget:
    """
    Get and validate that the user owns the scan target.

    Checks: target exists, belongs to user's organization, not soft-deleted.

    Args:
        target_id: ID of the target to look up
        user_id: ID of the current user (ownership check via org)
        db: Database session

    Returns:
        The ScanTarget instance

    Raises:
        HTTPException 404 if target not found or not owned by user
    """
    # Get user's org first
    org_id = await get_user_organization_id(user_id, db)
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan target not found"
        )

    result = await db.execute(
        select(ScanTarget).where(
            and_(
                ScanTarget.id == target_id,
                ScanTarget.organization_id == org_id,
                ScanTarget.deleted_at == None,  # Soft delete filter
            )
        )
    )
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan target not found"
        )
    return target


# ==========================================
# Shared Organization Context
# ==========================================

@dataclass
class OrgContext:
    """
    Resolved once per request via FastAPI Depends deduplication.

    All dependencies that need org_id / subscription / tier declare
    Depends(get_org_context). FastAPI calls get_org_context exactly once
    per request and reuses the result — reducing multiple queries down to 2 DB calls.
    """
    org_id: Optional[int]
    subscription: Optional[Subscription]
    tier: str


async def get_org_context(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> OrgContext:
    """
    Resolve the user's organization context in 2 DB calls.

    This function:
    1. Look up the user's organization ID from OrganizationMember
    2. Look up the organization's Stripe subscription record
    3. Derive the tier from subscription.plan_name

    FastAPI deduplicates Depends() — when multiple dependencies declare
    Depends(get_org_context), this function runs once and the result is
    shared across require_active_subscription, enforce_rate_limit, etc.
    """
    org_id = await get_user_organization_id(user.id, session)
    if not org_id:
        return OrgContext(org_id=None, subscription=None, tier="FREE")

    subscription = await get_org_subscription(org_id, session)
    tier = get_org_tier(subscription)

    return OrgContext(org_id=org_id, subscription=subscription, tier=tier)


# ==========================================
# Subscription Dependencies
# ==========================================

async def require_active_subscription(
    ctx: OrgContext = Depends(get_org_context),
    session: AsyncSession = Depends(get_session),
):
    """
    Router-level dependency — covers all gated cybersecurity subrouters.

    Blocks ALL requests (reads + writes) when service is inactive.
    Why block reads too: unlike assetmanager which allows reads after expiry,
    cybersecurity scan data is the product — no subscription = no access.

    Grace period: 7 days after cancellation (handled by is_service_active_with_subscription).

    Uses get_org_context (deduplicated) for org_id and subscription.
    """
    if not ctx.org_id:
        # No org = no data = nothing to gate
        return

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


# ==========================================
# Scan-Specific Dependencies
# ==========================================

async def enforce_scan_credit_limit(
    ctx: OrgContext = Depends(get_org_context),
    session: AsyncSession = Depends(get_session),
):
    """
    Endpoint-level dependency — blocks POST /start when monthly scan credits exceeded.

    Only applied to scan_job_subrouter POST /start endpoint.
    Raises HTTP 403 if the organization has exceeded their monthly scan credit limit.

    Uses get_org_context (deduplicated) for org_id and tier.
    """
    if not ctx.org_id:
        return

    limits = get_tier_limits(ctx.tier)
    max_credits = limits["monthly_scan_credits"]

    # -1 = unlimited (ENTERPRISE/CUSTOM)
    if max_credits == -1:
        return

    current_used = await get_monthly_scan_credits_used(ctx.org_id, session)
    if current_used >= max_credits:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Monthly scan credit limit reached: {current_used}/{max_credits} for {ctx.tier} plan. Upgrade to increase."
        )


async def enforce_scan_type_access(
    scan_types: list[str],
    ctx: OrgContext = Depends(get_org_context),
):
    """
    Endpoint-level dependency — blocks scan if any scan_type not in tier's allowed list.

    Called before starting a scan job. Checks each requested scan type against
    the tier's allowed_scan_types list.

    Args:
        scan_types: List of scan type strings from the template
        ctx: Organization context (deduplicated)

    Raises:
        HTTPException 403 if any scan type is not allowed for the tier
    """
    limits = get_tier_limits(ctx.tier)
    allowed = limits["allowed_scan_types"]

    for scan_type in scan_types:
        if scan_type not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Scan type '{scan_type}' requires a higher subscription tier. Current: {ctx.tier}."
            )
