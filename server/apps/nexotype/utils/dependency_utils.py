"""
Nexotype Dependency Utilities

Helper functions for authentication and organization context in nexotype endpoints.
Nexotype doesn't have entity-level roles like assetmanager — access is based on
accounts organization membership + data ownership (is_curated + organization_id).

Pattern: Subrouters import get_current_user from accounts (as FastAPI dependency),
then call get_user_organization_id() in the endpoint body where needed.
Same pattern as assetmanager's get_entity_access() / get_user_entity_ids().

Subscription enforcement:
    require_domain_access() is a router-level dependency that gates read/write
    access by subscription tier. Applied on each include_router() in router.py —
    zero modifications needed on individual subrouters.
    Same pattern as assetmanager's require_active_subscription().
"""

from typing import Optional
from fastapi import HTTPException, status, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from apps.accounts.models import User, OrganizationMember
from apps.accounts.utils.auth_utils import get_current_user
from core.db import get_session

from .subscription_utils import (
    get_org_subscription,
    get_required_tier,
    tier_is_sufficient,
)


# ==========================================
# Helper Functions
# ==========================================

async def get_user_organization_id(user_id: int, session: AsyncSession) -> Optional[int]:
    """
    Get the user's organization ID from accounts.

    Queries accounts.OrganizationMember to find which org the user belongs to.
    Returns the first org found (users typically belong to one org).

    Args:
        user_id: The user's ID
        session: Database session

    Returns:
        Organization ID or None if user has no org membership
    """
    result = await session.execute(
        select(OrganizationMember.organization_id)
        .filter(OrganizationMember.user_id == user_id)
        .limit(1)
    )
    return result.scalar_one_or_none()


# ==========================================
# Subscription Dependencies
# ==========================================

def require_domain_access(domain: str, entity: str | None = None):
    """
    Router-level dependency factory that gates access by subscription tier.

    Method-aware: checks read tier for GET/HEAD, write tier for POST/PUT/PATCH/DELETE.
    Applied at include_router() level — covers all endpoints in a subrouter
    without modifying each one individually.

    Same pattern as assetmanager's require_active_subscription(), but with
    domain/entity-level granularity instead of simple write lock.

    Args:
        domain: Domain name (e.g. "omics", "clinical", "commercial")
        entity: Optional entity name for tier override (e.g. "subject", "gene")

    Returns:
        FastAPI dependency function

    Usage:
        # In router.py:
        router.include_router(genes_router, prefix="/genes",
            dependencies=[Depends(require_domain_access("omics", entity="gene"))])

        router.include_router(subjects_router, prefix="/subjects",
            dependencies=[Depends(require_domain_access("lims", entity="subject"))])

        router.include_router(market_organizations_router, prefix="/market-organizations",
            dependencies=[Depends(require_domain_access("commercial"))])
    """
    async def dependency(
        request: Request,
        user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session),
    ):
        # Determine if this is a read or write operation
        is_write = request.method in ("POST", "PUT", "PATCH", "DELETE")

        # Look up the minimum tier required for this domain/entity + operation
        required_tier = get_required_tier(domain, entity, is_write)

        # FREE tier = no subscription needed (but user must be authenticated)
        if required_tier == "FREE":
            return

        # Get user's organization
        org_id = await get_user_organization_id(user.id, session)
        if not org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Organization membership required to access this resource",
            )

        # Get organization's subscription
        subscription = await get_org_subscription(org_id, session)

        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This resource requires a {required_tier} subscription",
            )

        # Manual override bypasses all Stripe status/tier checks (invoice/bank transfer clients)
        if subscription.manual_override:
            return

        # Check subscription is active
        if subscription.subscription_status not in ("ACTIVE", "TRIALING"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your subscription is inactive. Subscribe to continue accessing this resource.",
            )

        # Check tier is sufficient
        current_tier = subscription.plan_name or "FREE"
        if not tier_is_sufficient(current_tier, required_tier):
            action = "write to" if is_write else "access"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Your {current_tier} plan cannot {action} this resource. Upgrade to {required_tier} or higher.",
            )

    return dependency
