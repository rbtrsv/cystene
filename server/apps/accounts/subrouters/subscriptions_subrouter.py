from fastapi import APIRouter, HTTPException, status, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any

from ..models import Organization, OrganizationMember, Subscription
from ..schemas.subscription_schemas import (
    SubscriptionPlansResponse,
    UrlResponse,
    MessageResponse,
    SubscriptionInfoResponse
)
from ..utils.auth_utils import get_current_user
from ..utils.dependency_utils import require_organization_role
from ..utils.stripe_utils import (
    get_stripe_prices,
    get_stripe_products,
    create_checkout_session,
    create_customer_portal_session,
    handle_webhook,
    create_stripe_customer
)
from core.db import get_session
from ..models import User

import logging
logger = logging.getLogger(__name__)

# ==========================================
# Subscriptions Router
# ==========================================

router = APIRouter(tags=["Subscriptions"])


async def _ensure_personal_organization(user: User, session: AsyncSession) -> Organization:
    """
    Return the user's first org; auto-create a personal workspace if they have none.

    Safety net for the direct subscription flow: new users get a workspace at registration,
    but a pre-existing zero-org user must still be able to subscribe without manually
    creating an organization. Mirrors finpy's subscriptions_subrouter._ensure_personal_organization.
    """
    membership = await session.scalar(
        select(OrganizationMember).filter(OrganizationMember.user_id == user.id).limit(1)
    )
    if membership:
        return await session.get(Organization, membership.organization_id)

    # No org yet — auto-create a personal workspace (same shape as auth register).
    base_name = user.name or (user.email.split("@")[0] if user.email else "Personal")
    organization = Organization(name=f"{base_name}'s Workspace")
    session.add(organization)
    await session.flush()  # get organization.id without committing
    session.add(OrganizationMember(
        user_id=user.id,
        organization_id=organization.id,
        role="OWNER",
    ))
    await session.commit()
    await session.refresh(organization)
    logger.info(f"Auto-created personal org {organization.id} for user {user.id} at checkout")
    return organization


@router.get("/plans", response_model=SubscriptionPlansResponse)
async def get_subscription_plans():
    """
    List all active subscription plans from Stripe
    
    This endpoint:
    1. Fetches active price and product information from Stripe
    2. Returns formatted plan details
    
    Returns:
        Object containing prices and products
    """
    try:
        prices = get_stripe_prices()
        products = get_stripe_products()
        
        return SubscriptionPlansResponse(
            success=True,
            data={
                "prices": prices,
                "products": products
            }
        )
    except Exception as e:
        logger.exception(f"Failed to get subscription plans: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/organizations/{organization_id}", response_model=SubscriptionInfoResponse)
async def get_current_subscription(
    organization_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get current subscription for an organization
    
    This endpoint:
    1. Gets the organization's subscription
    2. Returns subscription details
    
    Args:
        organization_id: Organization ID
    
    Returns:
        Current subscription information
    """
    try:
        # Verify user has access to this organization
        result = await session.execute(
            select(OrganizationMember).filter(
                OrganizationMember.user_id == user.id,
                OrganizationMember.organization_id == organization_id
            )
        )
        membership = result.scalar_one_or_none()
        
        if not membership:
            raise HTTPException(status_code=403, detail="You don't have access to this organization")
        
        # Get organization's subscription
        result = await session.execute(
            select(Subscription).filter(Subscription.organization_id == organization_id)
        )
        subscription = result.scalar_one_or_none()
        
        if not subscription:
            return SubscriptionInfoResponse(success=True, data=None)
        
        # Format subscription data using exact database field names.
        # Why stripe_product_id: the frontend matches it against each plan card's
        # product_id to mark the active plan as "Current" (and its Zod schema requires
        # the field present) — omitting it broke the parse, so the UI fell back to Free.
        # Why every stripe_* field: the frontend Zod SubscriptionSchema requires all of
        # them present (nullable but not missing). Omitting any made the parse fail, so
        # currentSubscription stayed null and the UI fell back to Free even when active.
        subscription_data = {
            "id": str(subscription.id),
            "stripe_customer_id": subscription.stripe_customer_id,
            "stripe_subscription_id": subscription.stripe_subscription_id,
            "stripe_product_id": subscription.stripe_product_id,
            "plan_name": subscription.plan_name,
            "subscription_status": subscription.subscription_status,
            "start_date": subscription.start_date.isoformat() if subscription.start_date else None,
            "end_date": subscription.end_date.isoformat() if subscription.end_date else None,
        }
        
        return SubscriptionInfoResponse(
            success=True,
            data=subscription_data
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to get current subscription: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/checkout", response_model=UrlResponse)
async def checkout(
    price_id: str,  # Query parameter
    organization_id: Optional[int] = None,  # Optional explicit org context
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create a Stripe checkout session for a subscription
    
    This endpoint:
    1. Creates a checkout session for the specified price
    2. Returns the checkout URL
    
    Args:
        price_id: Stripe price ID to use for checkout
    
    Returns:
        Checkout session URL
    """
    try:
        # Resolve org context. If provided, enforce membership for that org.
        if organization_id is not None:
            membership = await session.scalar(
                select(OrganizationMember).filter(
                    OrganizationMember.user_id == user.id,
                    OrganizationMember.organization_id == organization_id
                )
            )
            if not membership:
                raise HTTPException(status_code=403, detail="You don't have access to this organization")

            organization = await session.get(Organization, organization_id)
            if not organization:
                raise HTTPException(status_code=404, detail="Organization not found")
        else:
            # No explicit org — resolve (or auto-create) the user's personal workspace, so a
            # zero-org user can subscribe directly without a manual "create organization" step.
            organization = await _ensure_personal_organization(user, session)

        # Create checkout session
        result = await create_checkout_session(
            user_id=user.id,
            price_id=price_id,
            organization=organization
        )
        
        if "url" in result:
            return UrlResponse(success=True, url=result["url"])
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to create checkout session: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/portal", response_model=UrlResponse)
async def customer_portal(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create a Stripe customer portal session for managing subscriptions
    
    This endpoint:
    1. Gets the user's organization
    2. Creates a customer portal session
    3. Returns the portal URL
    
    Returns:
        Customer portal URL
    """
    try:
        # Get the user's organization
        result = await session.execute(
            select(OrganizationMember)
            .filter(OrganizationMember.user_id == user.id)
            .limit(1)
        )
        membership = result.scalar_one_or_none()
        
        if not membership:
            raise HTTPException(status_code=403, detail="You are not a member of any organization")

        # Get organization and subscription
        result = await session.execute(
            select(Organization).filter(Organization.id == membership.organization_id)
        )
        organization = result.scalar_one()
        
        result = await session.execute(
            select(Subscription).filter(Subscription.organization_id == organization.id)
        )
        subscription = result.scalar_one_or_none()
        
        if not subscription or not subscription.stripe_customer_id:
            raise HTTPException(status_code=404, detail="No subscription found for your organization")
        
        # Create portal session
        result = await create_customer_portal_session(
            user_id=user.id,
            organization=organization,
            subscription=subscription
        )
        
        if "url" in result:
            return UrlResponse(success=True, url=result["url"])
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to create customer portal session: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/create-customer", response_model=MessageResponse)
async def create_customer(
    email: Optional[str] = None,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create a Stripe customer for the user's organization
    
    This endpoint:
    1. Gets the user's organization
    2. Creates a Stripe customer
    3. Returns a success message
    
    Args:
        email: Optional email to use for the customer (defaults to user's email)
    
    Returns:
        Success message
    """
    try:
        # Get the user's organization
        result = await session.execute(
            select(OrganizationMember)
            .filter(OrganizationMember.user_id == user.id)
            .limit(1)
        )
        membership = result.scalar_one_or_none()
        
        if not membership:
            raise HTTPException(status_code=403, detail="You are not a member of any organization")

        # Get organization
        result = await session.execute(
            select(Organization).filter(Organization.id == membership.organization_id)
        )
        organization = result.scalar_one()

        # Use provided email or user's email
        customer_email = email or user.email
        
        # Create customer
        customer_id = await create_stripe_customer(
            organization=organization,
            email=customer_email
        )
        
        return MessageResponse(
            success=True,
            message="Stripe customer created successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to create Stripe customer: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# Webhook Handler (not requiring authentication)
# ==========================================

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events

    This endpoint:
    1. Receives webhook events from Stripe
    2. Processes events like subscription changes
    3. Returns 200 on success, 500 on failure (so Stripe retries)

    Returns:
        HTTP 200 response if successful, 500 if processing failed
    """
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    if not sig_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe signature header"
        )

    try:
        # Process the webhook — returns False if processing failed
        success = await handle_webhook(payload, sig_header)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Webhook processing failed"
            )
        return Response(status_code=200, content="Webhook processed successfully")
    except HTTPException:
        raise
    except Exception as e:
        # 500 (not 400) so Stripe retries transient failures
        logger.exception(f"Webhook processing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
