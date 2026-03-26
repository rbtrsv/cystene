"""
Accounts Subscription Utilities

Pricing model: plan-based (Pro / Enterprise).
Each organization subscribes to one plan at a time.
Switching plans is done via Stripe Billing Portal (not checkout).

Helpers:
- Fetch plans and products from Stripe (for pricing page)
- Checkout session creation (new subscriptions only)
- Customer portal session (manage/switch/cancel existing subscription)
- Webhook handling (subscription status sync from Stripe → DB)

Stripe Dashboard setup (required once):
    1. Products → Create products:
       - "Pro" with recurring price (e.g. $120/month)
         Metadata: tier=PRO, tier_order=1, features=comma-separated string
       - "Enterprise" with recurring price (e.g. $360/month)
         Metadata: tier=ENTERPRISE, tier_order=2, features=comma-separated string
       (tier + tier_order metadata is read by dependency_utils.py for route gating)
    2. Developers → Webhooks → Add endpoint:
       - URL: https://your-domain.com/api/v1/accounts/subscriptions/webhook
       - Events: checkout.session.completed, customer.subscription.created,
         customer.subscription.updated, customer.subscription.deleted
    3. Settings → Billing → Customer Portal:
       - "Customers can switch plans" → ON
       - Add Pro and Enterprise to eligible subscription products
       - "When customers change plans" → "Prorate charges and credits"
       - Cancellations → Allow customers to cancel → ON
"""

import stripe
import logging
from collections import OrderedDict
from typing import List, Dict, Any
from datetime import datetime, timezone
from core.config import settings
from sqlalchemy import select

from ..models import Organization, User, Subscription
from core.db import async_session

# ==========================================
# Configuration
# ==========================================

logger = logging.getLogger(__name__)

# Initialize Stripe with settings
STRIPE_SECRET_KEY = settings.STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET = settings.STRIPE_WEBHOOK_SECRET
FRONTEND_URL = settings.FRONTEND_URL

stripe.api_key = STRIPE_SECRET_KEY

# ==========================================
# Price and Product Utilities
# ==========================================

def get_stripe_prices() -> List[Dict[str, Any]]:
    """
    Get active subscription prices from Stripe
    
    This function:
    1. Fetches all active prices from Stripe with their products
    2. Formats the data for the frontend
    
    Returns:
        List of formatted price objects
    """
    try:
        # Get all active prices with their products
        prices = stripe.Price.list(
            expand=['data.product'],
            active=True,
            type='recurring'
        )
        
        # Format the price data for the frontend
        formatted_prices = []
        for price in prices.data:
            # Skip prices from archived products
            if hasattr(price.product, 'active') and not price.product.active:
                continue
                
            # Get product info
            product_id = price.product.id if hasattr(price.product, 'id') else price.product
            product_name = price.product.name if hasattr(price.product, 'name') else ''
            product_description = price.product.description if hasattr(price.product, 'description') else ''
            
            # Extract features, tier, and tier_order from product metadata
            features = []
            tier = None
            tier_order = None
            if hasattr(price.product, 'metadata'):
                if price.product.metadata.get('features'):
                    features = price.product.metadata.get('features').split(',')
                tier = price.product.metadata.get('tier')
                tier_order_str = price.product.metadata.get('tier_order')
                if tier_order_str:
                    tier_order = int(tier_order_str)

            formatted_prices.append({
                "id": price.id,
                "product_id": product_id,
                "name": product_name,
                "description": product_description,
                "amount": price.unit_amount / 100 if price.unit_amount else 0,  # Convert from cents to dollars
                "currency": price.currency,
                "interval": price.recurring.interval if price.recurring else None,
                "interval_count": price.recurring.interval_count if price.recurring else None,
                "trial_period_days": price.recurring.trial_period_days if price.recurring else None,
                "features": features,
                "tier": tier,
                "tier_order": tier_order,
            })

        return formatted_prices
    except Exception as e:
        logger.error(f"Error fetching Stripe prices: {str(e)}")
        return []


def get_stripe_products() -> List[Dict[str, Any]]:
    """
    Get active products from Stripe with their default prices
    
    This function:
    1. Fetches all active products from Stripe with their default prices
    2. Formats the data for the frontend
    
    Returns:
        List of formatted product objects
    """
    try:
        # Get all active products with their default prices
        products = stripe.Product.list(
            active=True,
            expand=['data.default_price']
        )
        
        # Format the product data for the frontend
        formatted_products = []
        for product in products.data:
            # Extract features from metadata
            features = []
            if product.metadata and product.metadata.get('features'):
                features = product.metadata.get('features').split(',')
            
            formatted_products.append({
                "id": product.id,
                "name": product.name,
                "description": product.description or "",
                "features": features,
                "defaultPriceId": product.default_price.id if product.default_price else None,
                "metadata": dict(product.metadata) if product.metadata else {}
            })
                
        return formatted_products
    except Exception as e:
        logger.error(f"Error fetching Stripe products: {str(e)}")
        return []

# ==========================================
# Checkout & Portal Sessions
# ==========================================

async def create_checkout_session(user_id: int, price_id: str, organization: Organization) -> Dict[str, Any]:
    """
    Create a Stripe checkout session for subscription - best practice approach
    
    Args:
        user_id: ID of the user creating the checkout
        price_id: Stripe price ID for the subscription
        organization: Organization subscribing
        
    Returns:
        Dict with URL or error
    """
    if not price_id:
        return {"error": "price-id-required"}
        
    # Get the organization's subscription to check for Stripe customer ID
    stripe_customer_id = None
    async with async_session() as db_session:
        result = await db_session.execute(
            select(Subscription).filter(Subscription.organization_id == organization.id)
        )
        subscription = result.scalar_one_or_none()
        if subscription:
            stripe_customer_id = subscription.stripe_customer_id

            # Block new checkout if org already has an active subscription —
            # user must switch plans via Billing Portal, not create a new one
            if (
                subscription.stripe_subscription_id
                and subscription.subscription_status in ('ACTIVE', 'TRIALING')
            ):
                return {"error": "Active subscription already exists. Use Billing Portal to switch plans."}

    try:
        # Get the price details to check the currency
        price = stripe.Price.retrieve(price_id)
        
        # Ensure Stripe customer exists with proper metadata
        if stripe_customer_id:
            # Check if existing customer has organizationId in metadata
            customer = stripe.Customer.retrieve(stripe_customer_id)
            if not customer.metadata.get('organization_id'):
                # Update existing customer with organization metadata
                stripe.Customer.modify(
                    stripe_customer_id,
                    metadata={'organization_id': str(organization.id)}
                )
        else:
            # Get the user's actual email
            async with async_session() as db_session:
                user_result = await db_session.execute(
                    select(User).filter(User.id == user_id)
                )
                user = user_result.scalar_one_or_none()
                if not user or not user.email:
                    return {"error": "User email not found"}
            
            # Create new customer with actual user email
            stripe_customer_id = await create_stripe_customer(organization, user.email)
        
        # Create the checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price': price_id,
                    'quantity': 1,
                }
            ],
            mode='subscription',
            success_url=f"{FRONTEND_URL}/?checkout=success&session_id={{CHECKOUT_SESSION_ID}}",  # Redirect after successful payment
            cancel_url=f"{FRONTEND_URL}/",  # Redirect if user cancels checkout
            customer=stripe_customer_id,
            client_reference_id=str(user_id),
            allow_promotion_codes=True,
            currency=price.currency,
            # Trial Period: Stripe does not accept 0 days. To enable trial, uncomment
            # and set days > 0. To disable trial, keep commented out (omit entirely).
            # subscription_data={
            #     'trial_period_days': 14
            # }
        )
        
        return {"url": checkout_session.url}
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        
        # Return error information
        if str(e).find('combine currencies') >= 0:
            return {"error": "currency-mismatch"}
            
        return {"error": "checkout-failed"}


async def create_customer_portal_session(user_id: int, organization: Organization, subscription: Subscription) -> Dict[str, Any]:
    """
    Create a Stripe customer portal session
    
    Args:
        subscription: Organization's subscription
        
    Returns:
        Dictionary containing portal URL or error
    """
    try:
        if not subscription.stripe_customer_id:
            return {"error": "No Stripe customer found for this organization"}

        # Create portal session (manage subscription, billing, invoices)
        portal_session = stripe.billing_portal.Session.create(
            customer=subscription.stripe_customer_id,
            return_url=f"{FRONTEND_URL}/",  # Redirect after exiting portal
        )
        
        return {"url": portal_session.url}
    except Exception as e:
        logger.error(f"Error creating portal session: {str(e)}")
        return {"error": str(e)}

# ==========================================
# Customer Management
# ==========================================

async def create_stripe_customer(organization: Organization, email: str) -> str:
    """
    Create a Stripe customer for an organization with proper metadata
    
    Args:
        organization: Organization to create customer for
        email: Email for the customer
        
    Returns:
        Stripe customer ID
    """
    try:
        customer = stripe.Customer.create(
            email=email,
            name=organization.name,
            metadata={
                "organization_id": str(organization.id)
            }
        )
        
        # Update organization's subscription with customer ID
        async with async_session() as session:
            result = await session.execute(
                select(Subscription).filter(Subscription.organization_id == organization.id)
            )
            subscription = result.scalar_one_or_none()
            
            if subscription:
                subscription.stripe_customer_id = customer.id
                await session.commit()
            # Note: Don't create subscription record until user actually pays
        
        return customer.id
    except Exception as e:
        logger.error(f"Error creating Stripe customer: {str(e)}")
        raise e

# ==========================================
# Webhook Handling
# ==========================================

# Required webhook events in Stripe Dashboard:
#   - checkout.session.completed
#   - customer.subscription.created
#   - customer.subscription.updated
#   - customer.subscription.deleted
#
# Other events (invoice.*, payment_method.*, customer.created, etc.)
# are sent by Stripe but not processed - they return 200 OK and are ignored.

# Webhook event deduplication (in-memory, FIFO eviction).
# Stripe retries events on 5xx/timeouts — this prevents reprocessing.
# OrderedDict keeps insertion order so we evict oldest entries first,
# unlike set.clear() which would wipe recent event IDs too.
# Persistent dedupe (DB table) is unnecessary for now — subscription
# writes are idempotent (overwrite same fields), and retries happen
# within minutes (not across server restarts).
_processed_event_ids: OrderedDict[str, None] = OrderedDict()
_MAX_PROCESSED_EVENTS = 10_000


async def handle_webhook(payload: bytes, sig_header: str) -> bool:
    """
    Process Stripe webhook events.

    Args:
        payload: Raw webhook payload
        sig_header: Stripe signature header

    Returns:
        True if successful, False otherwise
    """
    try:
        # Reject if webhook secret not configured — never accept unverified payloads
        if not STRIPE_WEBHOOK_SECRET:
            logger.error("STRIPE_WEBHOOK_SECRET not configured — rejecting webhook")
            return False

        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )

        # Skip already-processed events (Stripe retry protection)
        event_id = event.get('id')
        if event_id in _processed_event_ids:
            logger.info(f"Skipping duplicate webhook event: {event_id}")
            return True

        event_type = event.get('type')

        # Handle checkout.session.completed event
        if event_type == 'checkout.session.completed':
            session = event['data']['object']
            # Extract subscription ID from checkout session
            subscription_id = session.get('subscription')
            if subscription_id:
                # Fetch the actual subscription object from Stripe
                subscription = stripe.Subscription.retrieve(subscription_id)
                await handle_subscription_change(subscription)
            else:
                logger.warning("No subscription found in checkout session")

        # Handle subscription events
        elif event_type.startswith('customer.subscription'):
            subscription_data = event['data']['object']
            await handle_subscription_change(subscription_data)

        # Mark processed — evict oldest half when cap reached (FIFO, not clear-all)
        if len(_processed_event_ids) >= _MAX_PROCESSED_EVENTS:
            for _ in range(_MAX_PROCESSED_EVENTS // 2):
                _processed_event_ids.popitem(last=False)
        _processed_event_ids[event_id] = None

        return True
    except Exception as e:
        logger.error(f"Error handling webhook: {str(e)}")
        return False

async def handle_subscription_change(subscription_data) -> None:
    """
    Update subscription status - exactly like Django Ninja
    
    Args:
        subscription_data: Stripe subscription object
    """
    try:
        # Convert to dict if it's a Stripe object
        if hasattr(subscription_data, '__dict__'):
            subscription_data = dict(subscription_data)
        
        # Get customer ID
        customer_id = subscription_data.get('customer')
        if not customer_id:
            logger.error("No customer ID in subscription data")
            return
            
        # Get subscription ID
        subscription_id = subscription_data.get('id')
        
        # Get status and map to our model choices
        stripe_status = subscription_data.get('status', '')
        # Map Stripe status to our model choices
        status_mapping = {
            'active': 'ACTIVE',
            'trialing': 'TRIALING', 
            'past_due': 'PAST_DUE',
            'canceled': 'CANCELED',
            'unpaid': 'UNPAID'
        }
        status = status_mapping.get(stripe_status, 'ACTIVE')
        
        async with async_session() as db_session:
            # Find the subscription by customer ID
            existing_subscription = None
            result = await db_session.execute(
                select(Subscription).filter(Subscription.stripe_customer_id == customer_id)
            )
            existing_subscription = result.scalar_one_or_none()
                
            # Get organization ID from customer metadata (single source of truth)
            organization_id = None
            if existing_subscription:
                organization_id = existing_subscription.organization_id
            else:
                # Get organization ID from Stripe customer metadata
                try:
                    customer = stripe.Customer.retrieve(customer_id)
                    if hasattr(customer, 'metadata') and customer.metadata.get('organization_id'):
                        organization_id = customer.metadata.get('organization_id')
                except Exception as e:
                    logger.error(f"Error retrieving customer from Stripe: {str(e)}")
                    
            if not organization_id:
                logger.error(f"Organization ID not found for Stripe customer: {customer_id}")
                return
                
            # Get the organization
            org_result = await db_session.execute(
                select(Organization).filter(Organization.id == int(organization_id))
            )
            organization = org_result.scalar_one_or_none()
            if not organization:
                logger.error(f"Organization not found: {organization_id}")
                return
                
            # Get organization's subscription
            org_subscription = None
            org_result = await db_session.execute(
                select(Subscription).filter(Subscription.organization_id == organization.id)
            )
            org_subscription = org_result.scalar_one_or_none()
                
            # Get product details if status is active or trialing
            product_id = None
            product_name = None
            
            if status in ['ACTIVE', 'TRIALING']:
                # Get the product ID from the subscription items
                items = subscription_data.get('items', {}).get('data', [])
                if items:
                    plan = items[0].get('plan', {})
                    if plan:
                        product_id = plan.get('product')
                        
                        # Get tier from product metadata (matches SUBSCRIPTION_TIERS format)
                        # Stripe metadata: tier=PRO, tier=ENTERPRISE — stored uppercase
                        # dependency_utils.py compares plan_name against SUBSCRIPTION_TIERS
                        if product_id:
                            try:
                                product = stripe.Product.retrieve(product_id)
                                product_name = product.metadata.get('tier', product.name).upper()
                            except Exception:
                                product_name = "Unknown Plan"
            
            # Update or create subscription
            if existing_subscription:
                # Update existing subscription by customer ID
                existing_subscription.stripe_subscription_id = subscription_id
                if product_id:
                    existing_subscription.stripe_product_id = product_id
                if product_name:
                    existing_subscription.plan_name = product_name
                existing_subscription.subscription_status = status
            elif org_subscription:
                # Update existing subscription by organization ID
                org_subscription.stripe_customer_id = customer_id
                org_subscription.stripe_subscription_id = subscription_id
                if product_id:
                    org_subscription.stripe_product_id = product_id
                if product_name:
                    org_subscription.plan_name = product_name
                org_subscription.subscription_status = status
            else:
                # Create new subscription
                new_subscription = Subscription(
                    organization_id=organization.id,
                    stripe_customer_id=customer_id,
                    stripe_subscription_id=subscription_id,
                    stripe_product_id=product_id,
                    plan_name=product_name or "Unknown Plan",
                    subscription_status=status,
                    start_date=datetime.now(timezone.utc)
                )
                db_session.add(new_subscription)
                
            await db_session.commit()
    except Exception as e:
        logger.error(f"Error updating subscription: {str(e)}")
