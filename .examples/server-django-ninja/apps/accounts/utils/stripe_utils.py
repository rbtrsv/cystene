import stripe
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from django.conf import settings

from ..models import Organization, User, Subscription

# ==========================================
# Configuration
# ==========================================

logger = logging.getLogger(__name__)

# Initialize Stripe with settings
STRIPE_SECRET_KEY = getattr(settings, 'STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = getattr(settings, 'STRIPE_WEBHOOK_SECRET')
FRONTEND_URL = getattr(settings, 'FRONTEND_URL')

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
            
            # Extract features from product metadata
            features = []
            if hasattr(price.product, 'metadata') and price.product.metadata.get('features'):
                features = price.product.metadata.get('features').split(',')
                
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
                "features": features
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
            # Get default price ID
            default_price_id = None
            if hasattr(product, 'default_price'):
                if isinstance(product.default_price, str):
                    default_price_id = product.default_price
                elif hasattr(product.default_price, 'id'):
                    default_price_id = product.default_price.id
                    
            # Extract features from metadata
            features = []
            if hasattr(product, 'metadata') and product.metadata.get('features'):
                features = product.metadata.get('features').split(',')
                
            formatted_products.append({
                "id": product.id,
                "name": product.name,
                "description": getattr(product, 'description', ''),
                "features": features,
                "defaultPriceId": default_price_id,
                "metadata": product.metadata
            })
                
        return formatted_products
    except Exception as e:
        logger.error(f"Error fetching Stripe products: {str(e)}")
        return []


# ==========================================
# Checkout and Customer Portal
# ==========================================

def create_checkout_session(user_id: int, price_id: str, organization: Organization) -> Dict[str, Any]:
    """
    Create a Stripe checkout session for subscription
    
    This function:
    1. Creates a checkout session in Stripe
    2. Returns the checkout URL or error
    
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
    try:
        subscription = Subscription.objects.get(organization=organization)
        stripe_customer_id = subscription.stripe_customer_id
    except Subscription.DoesNotExist:
        # No existing subscription
        pass
    
    try:
        # Get the price details to check the currency
        price = stripe.Price.retrieve(price_id)
        
        # Create the checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price': price_id,
                    'quantity': 1,
                }
            ],
            mode='subscription',
            success_url=f"{FRONTEND_URL}/dashboard?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/pricing",
            customer=stripe_customer_id,
            client_reference_id=str(user_id),
            allow_promotion_codes=True,
            currency=price.currency,
            subscription_data={
                'trial_period_days': 14  # Default trial period
            },
            metadata={
                'organizationId': str(organization.id)
            }
        )
        
        return {"url": session.url}
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        
        # Return error information
        if str(e).find('combine currencies') >= 0:
            return {"error": "currency-mismatch"}
            
        return {"error": "checkout-failed"}


def create_customer_portal_session(user_id: int, organization: Organization, subscription: Subscription) -> Dict[str, Any]:
    """
    Create a Stripe customer portal session
    
    This function:
    1. Creates a customer portal session in Stripe
    2. Returns the portal URL or error
    
    Args:
        user_id: ID of the user accessing the portal
        organization: Organization with the subscription
        subscription: Organization's subscription
        
    Returns:
        Dict with URL or error
    """
    if not subscription.stripe_customer_id or not subscription.stripe_product_id:
        return {"error": "no-subscription"}
    
    try:
        # Get or create a portal configuration
        configurations = stripe.billing_portal.Configuration.list()
        
        if configurations.data:
            # Use existing configuration
            configuration = configurations.data[0]
        else:
            # Create a new configuration
            product = stripe.Product.retrieve(subscription.stripe_product_id)
            if not product.active:
                return {"error": "product-inactive"}
                
            prices = stripe.Price.list(
                product=product.id,
                active=True
            )
            
            if not prices.data:
                return {"error": "no-prices"}
                
            # Create a new portal configuration
            configuration = stripe.billing_portal.Configuration.create(
                business_profile={
                    'headline': 'Manage your subscription'
                },
                features={
                    'subscription_update': {
                        'enabled': True,
                        'default_allowed_updates': ['price', 'quantity', 'promotion_code'],
                        'proration_behavior': 'create_prorations',
                        'products': [
                            {
                                'product': product.id,
                                'prices': [price.id for price in prices.data]
                            }
                        ]
                    },
                    'subscription_cancel': {
                        'enabled': True,
                        'mode': 'at_period_end',
                        'cancellation_reason': {
                            'enabled': True,
                            'options': [
                                'too_expensive',
                                'missing_features',
                                'switched_service',
                                'unused',
                                'other'
                            ]
                        }
                    }
                }
            )
        
        # Create the portal session
        portal_session = stripe.billing_portal.Session.create(
            customer=subscription.stripe_customer_id,
            return_url=f"{FRONTEND_URL}/dashboard",
            configuration=configuration.id
        )
        
        return {"url": portal_session.url}
    except Exception as e:
        logger.error(f"Error creating customer portal session: {str(e)}")
        return {"error": str(e)}


# ==========================================
# Webhook and Subscription Management
# ==========================================

def handle_successful_checkout(session_id: str) -> bool:
    """
    Process a successful checkout
    
    This function:
    1. Retrieves the checkout session
    2. Updates the organization's subscription
    
    Args:
        session_id: Stripe checkout session ID
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Retrieve the session
        session = stripe.checkout.Session.retrieve(
            session_id,
            expand=['subscription', 'customer']
        )
        
        # Get organization ID from metadata
        organization_id = session.metadata.get('organizationId')
        if not organization_id:
            logger.error("No organization ID in session metadata")
            return False
            
        # Get the organization
        try:
            organization = Organization.objects.get(id=organization_id)
        except Organization.DoesNotExist:
            logger.error(f"Organization not found: {organization_id}")
            return False
            
        # Get subscription details
        if not session.subscription:
            logger.error("No subscription in session")
            return False
            
        # Get subscription
        subscription_id = session.subscription.id
        customer_id = session.customer.id
        
        # Get subscription from Stripe
        stripe_subscription = stripe.Subscription.retrieve(subscription_id)
        
        # Get the product ID
        if not stripe_subscription.items.data:
            logger.error("No items in subscription")
            return False
            
        product_id = stripe_subscription.items.data[0].plan.product
        
        # Get the product name
        try:
            product = stripe.Product.retrieve(product_id)
            product_name = product.name
        except Exception:
            product_name = "Unknown Plan"
            
        # Update or create subscription
        Subscription.objects.update_or_create(
            organization=organization,
            defaults={
                'stripe_customer_id': customer_id,
                'stripe_subscription_id': subscription_id,
                'stripe_product_id': product_id,
                'plan_name': product_name,
                'subscription_status': stripe_subscription.status.upper(),
                'start_date': datetime.fromtimestamp(stripe_subscription.start_date)
            }
        )
        
        return True
    except Exception as e:
        logger.error(f"Error handling checkout success: {str(e)}")
        return False


def handle_webhook(payload, sig_header: str) -> bool:
    """
    Process Stripe webhook events
    
    This function:
    1. Verifies the webhook signature
    2. Handles subscription events
    
    Args:
        payload: Raw webhook payload
        sig_header: Stripe signature header
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Verify signature if we have a webhook secret
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        else:
            # Just parse the JSON
            data = json.loads(payload)
            event = {
                'type': data.get('type'),
                'data': {'object': data.get('data', {}).get('object', {})}
            }
            
        event_type = event.get('type')
        
        # Handle checkout.session.completed event
        if event_type == 'checkout.session.completed':
            session = event['data']['object']
            # Extract subscription ID from checkout session
            subscription_id = session.get('subscription')
            if subscription_id:
                # Fetch the actual subscription object from Stripe
                subscription = stripe.Subscription.retrieve(subscription_id)
                handle_subscription_change(subscription)
            else:
                logger.warning("No subscription found in checkout session")
            
        # Handle subscription events
        elif event_type.startswith('customer.subscription'):
            subscription_data = event['data']['object']
            handle_subscription_change(subscription_data)
            
        return True
    except Exception as e:
        logger.error(f"Error handling webhook: {str(e)}")
        return False


def handle_subscription_change(subscription_data: Dict[str, Any]) -> None:
    """
    Update subscription status
    
    This function:
    1. Gets the organization from the subscription
    2. Updates the subscription status
    
    Args:
        subscription_data: Stripe subscription object
    """
    try:
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
        
        # Find the subscription by customer ID
        existing_subscription = None
        try:
            existing_subscription = Subscription.objects.get(stripe_customer_id=customer_id)
        except Subscription.DoesNotExist:
            pass
            
        # Try to get organization ID from metadata
        organization_id = None
        metadata = subscription_data.get('metadata', {})
        if metadata and metadata.get('organizationId'):
            organization_id = metadata.get('organizationId')
        elif existing_subscription:
            organization_id = existing_subscription.organization.id
            
        if not organization_id:
            # Try to get the customer from Stripe to get the metadata
            try:
                customer = stripe.Customer.retrieve(customer_id)
                if hasattr(customer, 'metadata') and customer.metadata.get('organizationId'):
                    organization_id = customer.metadata.get('organizationId')
            except Exception as e:
                logger.error(f"Error retrieving customer from Stripe: {str(e)}")
                
        if not organization_id:
            logger.error(f"Organization ID not found for Stripe customer: {customer_id}")
            return
            
        # Get the organization
        try:
            organization = Organization.objects.get(id=organization_id)
        except Organization.DoesNotExist:
            logger.error(f"Organization not found: {organization_id}")
            return
            
        # Get organization's subscription
        org_subscription = None
        try:
            org_subscription = Subscription.objects.get(organization=organization)
        except Subscription.DoesNotExist:
            pass
            
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
                    
                    # Get product name
                    if product_id:
                        try:
                            product = stripe.Product.retrieve(product_id)
                            product_name = product.name
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
            existing_subscription.save()
        elif org_subscription:
            # Update existing subscription by organization ID
            org_subscription.stripe_customer_id = customer_id
            org_subscription.stripe_subscription_id = subscription_id
            if product_id:
                org_subscription.stripe_product_id = product_id
            if product_name:
                org_subscription.plan_name = product_name
            org_subscription.subscription_status = status
            org_subscription.save()
        else:
            # Create new subscription
            Subscription.objects.create(
                organization=organization,
                stripe_customer_id=customer_id,
                stripe_subscription_id=subscription_id,
                stripe_product_id=product_id,
                plan_name=product_name or "Unknown Plan",
                subscription_status=status,
                start_date=datetime.now()
            )
    except Exception as e:
        logger.error(f"Error updating subscription: {str(e)}")


def create_stripe_customer(organization: Organization, email: str) -> str:
    """
    Creates a Stripe customer for an organization
    
    Args:
        organization: The organization to create a customer for
        email: The email to associate with the customer
        
    Returns:
        The Stripe customer ID
    """
    try:
        # Create the customer in Stripe
        customer = stripe.Customer.create(
            email=email,
            name=organization.name,
            metadata={
                'organizationId': str(organization.id)
            }
        )
        
        # Check if a subscription record already exists
        try:
            subscription = Subscription.objects.get(organization=organization)
            subscription.stripe_customer_id = customer.id
            subscription.save()
        except Subscription.DoesNotExist:
            # Create a new subscription record with Stripe customer ID
            Subscription.objects.create(
                organization=organization,
                stripe_customer_id=customer.id,
                start_date=datetime.now()
            )
            
        return customer.id
    except Exception as e:
        logger.error(f"Error creating Stripe customer: {str(e)}")
        raise ValueError(f"Failed to create Stripe customer: {str(e)}")
