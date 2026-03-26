from functools import wraps
from typing import List, Union, Callable
from fastapi import HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..models import User, Organization, OrganizationMember, Subscription
from .auth_utils import get_current_user
from core.db import get_session

# ==========================================
# Constants
# ==========================================

def get_stripe_subscription_tiers() -> List[str]:
    """
    Get subscription tiers from Stripe products metadata.

    Stripe Setup Required:
    Each product in Stripe Dashboard must have metadata:
      - tier: tier name (will be uppercased)
      - tier_order: sort order (lower = higher priority)

    Example tiers:
      - Product "Pro" → metadata: tier=PRO, tier_order=1
        Description: "Access to core features and priority support."
      - Product "Enterprise" → metadata: tier=ENTERPRISE, tier_order=2
        Description: "Access to all features and dedicated support."
    """
    import stripe
    from core.config import settings
    
    stripe.api_key = settings.STRIPE_SECRET_KEY
    
    try:
        products = stripe.Product.list(active=True)
        tier_data = []
        
        for product in products.data:
            if product.metadata and product.metadata.get('tier'):
                tier_name = product.metadata.get('tier').upper()
                tier_order = int(product.metadata.get('tier_order', 999))
                tier_data.append((tier_order, tier_name))
        
        # Sort by tier_order and extract names
        tier_data.sort(key=lambda x: x[0])
        tiers = [tier[1] for tier in tier_data]
        
        # Ensure FREE is first
        if 'FREE' not in tiers:
            tiers.insert(0, 'FREE')
        
        return tiers
    except Exception:
        # Fallback to hardcoded tiers
        return ['FREE', 'BASIC', 'PRO', 'ENTERPRISE']

# Subscription tiers from lowest to highest - fetched dynamically from Stripe
SUBSCRIPTION_TIERS = get_stripe_subscription_tiers()

# Organization roles from lowest to highest permission level
ORGANIZATION_ROLES = ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']

# ==========================================
# Permission Dependencies
# ==========================================

def require_organization_role(roles: Union[str, List[str]]):
    """
    FastAPI dependency factory to check if user has required role in organization
    
    Args:
        roles: Role or list of roles allowed to access this endpoint
        
    Returns:
        FastAPI dependency function
        
    Usage:
        @router.delete('/organizations/{organization_id}')
        async def delete_organization(
            organization_id: int,
            user: User = Depends(get_current_user),
            org: Organization = Depends(require_organization_role('OWNER'))
        ):
    """
    if isinstance(roles, str):
        roles = [roles]
        
    async def dependency(
        organization_id: int,
        user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
    ) -> Organization:
        # Get user's membership and check role
        result = await session.execute(
            select(OrganizationMember)
            .options(selectinload(OrganizationMember.organization))
            .filter(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.user_id == user.id
            )
        )
        membership = result.scalar_one_or_none()
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this organization"
            )
            
        if membership.role not in roles:
            role_list = ", ".join(roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You need one of these roles: {role_list}"
            )
            
        return membership.organization
    
    return dependency


def require_subscription_tier(tier: str):
    """
    FastAPI dependency factory to check if organization has required subscription tier
    
    Args:
        tier: Minimum subscription tier required (e.g. 'BASIC', 'PRO')
        
    Returns:
        FastAPI dependency function
        
    Usage:
        @router.post('/organizations/{organization_id}/advanced-feature')
        async def use_advanced_feature(
            organization_id: int,
            user: User = Depends(get_current_user),
            org: Organization = Depends(require_subscription_tier('PRO'))
        ):
    """
    if tier not in SUBSCRIPTION_TIERS:
        raise ValueError(f"Invalid tier: {tier}. Must be one of {SUBSCRIPTION_TIERS}")
    
    required_tier_index = SUBSCRIPTION_TIERS.index(tier)
    
    async def dependency(
        organization_id: int,
        user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
    ) -> Organization:
        # First check if user is a member
        result = await session.execute(
            select(OrganizationMember)
            .options(selectinload(OrganizationMember.organization))
            .filter(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.user_id == user.id
            )
        )
        membership = result.scalar_one_or_none()
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this organization"
            )
        
        organization = membership.organization
        
        # Then check subscription
        result = await session.execute(
            select(Subscription).filter(Subscription.organization_id == organization.id)
        )
        subscription = result.scalar_one_or_none()
        
        if not subscription:
            if required_tier_index > 0:  # If anything above FREE is required
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This feature requires a subscription"
                )
        else:
            # Manual override bypasses all Stripe checks (invoice/bank transfer clients)
            if not subscription.manual_override:
                # Check if subscription is active
                if subscription.subscription_status != 'ACTIVE':
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="This feature requires an active subscription"
                    )

                # Check tier
                if not subscription.plan_name or subscription.plan_name not in SUBSCRIPTION_TIERS:
                    current_tier_index = 0  # Default to FREE
                else:
                    current_tier_index = SUBSCRIPTION_TIERS.index(subscription.plan_name)

                if current_tier_index < required_tier_index:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"This feature requires at least a {tier} subscription"
                    )

        return organization

    return dependency


def require_organization_role_and_subscription(tier: str, roles: Union[str, List[str]]):
    """
    FastAPI dependency factory to check both subscription tier and user role
    
    Args:
        tier: Minimum subscription tier required
        roles: Role or list of roles allowed to access this endpoint
        
    Returns:
        FastAPI dependency function
        
    Usage:
        @router.post('/organizations/{organization_id}/admin-feature')
        async def use_admin_feature(
            organization_id: int,
            user: User = Depends(get_current_user),
            org: Organization = Depends(require_organization_role_and_subscription('PRO', ['ADMIN', 'OWNER']))
        ):
    """
    if isinstance(roles, str):
        roles = [roles]
        
    async def dependency(
        organization_id: int,
        user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
    ) -> Organization:
        # Check role first
        result = await session.execute(
            select(OrganizationMember)
            .options(selectinload(OrganizationMember.organization))
            .filter(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.user_id == user.id
            )
        )
        membership = result.scalar_one_or_none()
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this organization"
            )
            
        if membership.role not in roles:
            role_list = ", ".join(roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You need one of these roles: {role_list}"
            )
        
        organization = membership.organization
        
        # Then check subscription if tier is above FREE
        if tier in SUBSCRIPTION_TIERS and SUBSCRIPTION_TIERS.index(tier) > 0:
            result = await session.execute(
                select(Subscription).filter(Subscription.organization_id == organization.id)
            )
            subscription = result.scalar_one_or_none()
            
            if not subscription:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This feature requires a subscription"
                )

            # Manual override bypasses all Stripe checks (invoice/bank transfer clients)
            if not subscription.manual_override:
                # Check if subscription is active
                if subscription.subscription_status != 'ACTIVE':
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="This feature requires an active subscription"
                    )

                # Check tier
                if not subscription.plan_name or subscription.plan_name not in SUBSCRIPTION_TIERS:
                    current_tier_index = 0  # Default to FREE
                else:
                    current_tier_index = SUBSCRIPTION_TIERS.index(subscription.plan_name)

                required_tier_index = SUBSCRIPTION_TIERS.index(tier)
                if current_tier_index < required_tier_index:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"This feature requires at least a {tier} subscription"
                    )

        return organization
    
    return dependency