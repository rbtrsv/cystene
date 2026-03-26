from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from typing import List, Optional, Dict, Any

from ..models import Organization, OrganizationMember, Subscription
from ..utils.auth_utils import AuthBearer
from ..utils.decorators_utils import organization_role_required
from ..utils.stripe_utils import (
    get_stripe_prices,
    get_stripe_products,
    create_checkout_session,
    create_customer_portal_session,
    handle_webhook,
    handle_successful_checkout,
    create_stripe_customer
)

# ==========================================
# Stripe Schemas
# ==========================================

class PriceDetail(Schema):
    """Schema for Stripe price details"""
    id: str
    product_id: str
    name: str
    description: Optional[str] = None
    amount: float
    currency: str
    interval: Optional[str] = None
    interval_count: Optional[int] = None
    trial_period_days: Optional[int] = None
    features: Optional[List[str]] = None


class ProductDetail(Schema):
    """Schema for Stripe product details"""
    id: str
    name: str
    description: Optional[str] = None
    features: List[str]
    defaultPriceId: Optional[str] = None
    metadata: Dict[str, Any]


class SubscriptionPlansResponse(Schema):
    """Response schema for subscription plans"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class UrlResponse(Schema):
    """Schema for URL response"""
    success: bool
    url: Optional[str] = None
    error: Optional[str] = None


class MessageResponse(Schema):
    """Simple message response"""
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None


class SubscriptionInfoResponse(Schema):
    """Response schema for current subscription info"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# ==========================================
# Stripe Router
# ==========================================

router = Router(tags=["Subscriptions"])


@router.get("/plans", response=SubscriptionPlansResponse)
def get_subscription_plans(request: HttpRequest):
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
        
        return {
            "success": True,
            "data": {
                "prices": prices,
                "products": products
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/organizations/{organization_id}", response=SubscriptionInfoResponse, auth=AuthBearer())
def get_current_subscription(request: HttpRequest, organization_id: int):
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
        membership = OrganizationMember.objects.filter(
            user=request.user,
            organization_id=organization_id
        ).first()
        
        if not membership:
            return {"success": False, "error": "You don't have access to this organization"}
        
        # Get organization's subscription
        subscription = Subscription.objects.filter(organization_id=organization_id).first()
        
        if not subscription:
            return {"success": False, "error": "No subscription found for this organization"}
        
        # Format subscription data using exact database field names
        subscription_data = {
            "id": str(subscription.id),
            "plan_name": subscription.plan_name,
            "subscription_status": subscription.subscription_status,
            "start_date": subscription.start_date.isoformat() if subscription.start_date else None,
            "end_date": subscription.end_date.isoformat() if subscription.end_date else None,
        }
        
        return {"success": True, "data": subscription_data}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/checkout", response=UrlResponse, auth=AuthBearer())
def checkout(request: HttpRequest, price_id: str):
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
        # Get the user's organization
        membership = OrganizationMember.objects.filter(
            user=request.user
        ).select_related("organization").first()
        
        if not membership:
            return {"success": False, "error": "You are not a member of any organization"}
        
        # Create checkout session
        result = create_checkout_session(
            user_id=request.user.id,
            price_id=price_id,
            organization=membership.organization
        )
        
        if "url" in result:
            return {"success": True, "url": result["url"]}
        else:
            return {"success": False, "error": result.get("error", "Unknown error")}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/portal", response=UrlResponse, auth=AuthBearer())
def customer_portal(request: HttpRequest):
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
        membership = OrganizationMember.objects.filter(
            user=request.user
        ).select_related("organization").first()
        
        if not membership:
            return {"success": False, "error": "You are not a member of any organization"}
        
        # Get subscription
        organization = membership.organization
        subscription = Subscription.objects.filter(organization=organization).first()
        
        if not subscription or not subscription.stripe_customer_id:
            return {"success": False, "error": "No subscription found for your organization"}
        
        # Create portal session
        result = create_customer_portal_session(
            user_id=request.user.id,
            organization=organization,
            subscription=subscription
        )
        
        if "url" in result:
            return {"success": True, "url": result["url"]}
        else:
            return {"success": False, "error": result.get("error", "Unknown error")}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/webhook-success", response=MessageResponse, auth=AuthBearer())
def webhook_success(request: HttpRequest, session_id: str):
    """
    Handle successful checkout completion
    
    This endpoint:
    1. Updates subscription status after successful checkout
    2. Returns a success message
    
    Args:
        session_id: The Stripe session ID from checkout
    
    Returns:
        Success message
    """
    try:
        success = handle_successful_checkout(session_id)
        if success:
            return {"success": True, "message": "Subscription created successfully"}
        else:
            return {"success": False, "error": "Failed to process checkout success"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/create-customer", response=MessageResponse, auth=AuthBearer())
def create_customer(request: HttpRequest, email: Optional[str] = None):
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
        membership = OrganizationMember.objects.filter(
            user=request.user
        ).select_related("organization").first()
        
        if not membership:
            return {"success": False, "error": "You are not a member of any organization"}
        
        # Use provided email or user's email
        customer_email = email or request.user.email
        
        # Create customer
        customer_id = create_stripe_customer(
            organization=membership.organization,
            email=customer_email
        )
        
        return {"success": True, "message": "Stripe customer created successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ==========================================
# Webhook Handler (not requiring authentication)
# ==========================================

@router.post("/webhook")
def stripe_webhook(request: HttpRequest) -> HttpResponse:
    """
    Handle Stripe webhook events
    
    This endpoint:
    1. Receives webhook events from Stripe
    2. Processes events like subscription changes
    3. Returns a success response
    
    Returns:
        HTTP 200 response if successful
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    if not sig_header:
        return HttpResponse(status=400, content="Missing Stripe signature header")
    
    try:
        # Process the webhook
        handle_webhook(payload, sig_header)
        return HttpResponse(status=200, content="Webhook processed successfully")
    except Exception as e:
        return HttpResponse(status=400, content=f"Webhook error: {str(e)}")
