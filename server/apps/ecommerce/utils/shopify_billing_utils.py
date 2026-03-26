"""
Shopify Billing Utilities

GraphQL helpers for Shopify's Billing API (appSubscriptionCreate, appSubscriptionCancel).
Standalone functions — not tied to ShopifyAdapter (which handles product/order data).

Plan pricing constants are business logic (not config) — they map directly to the
TIER_ORDER in subscription_utils.py and must match Shopify Partner Dashboard charges.

Billing Operations:
    - create_shopify_subscription(store, token, plan, return_url, test) → confirmation_url + GID
    - cancel_shopify_subscription(store, token, gid) → True
    - get_shopify_subscription_status(store, token, gid) → subscription details

Webhook:
    - handle_shopify_billing_webhook(payload, shop, db) — processes APP_SUBSCRIPTIONS_UPDATE,
      updates ShopifyBilling status (ACTIVE/PAST_DUE/CANCELED). Idempotent.

Pricing changes (Shopify Dashboard):
    Prices are managed via Shopify Managed Pricing (Partner Dashboard → Pricing).
    SHOPIFY_PLAN_PRICES below are NOT used — kept only for manual pricing fallback.
    When changing plans in Shopify Dashboard, keep in sync:
    - map_shopify_plan_to_tier() — maps Shopify plan name ("Pro") to tier ("PRO")
    - TIER_LIMITS in subscription_utils.py — defines what each tier gets
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Optional

import aiohttp
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from ..models import ShopifyBilling

logger = logging.getLogger(__name__)

# ==========================================
# Constants
# ==========================================

# Plan name → Shopify charge configuration
# Prices in EUR, matching subscription_utils.py pricing comments (€12 PRO, €36 ENTERPRISE)
SHOPIFY_PLAN_PRICES = {
    "PRO": {"name": "Pro", "price": "12.00", "currency": "EUR"},
    "ENTERPRISE": {"name": "Enterprise", "price": "36.00", "currency": "EUR"},
}

# Billing interval for all plans
SHOPIFY_BILLING_INTERVAL = "EVERY_30_DAYS"

# Shopify status → our billing_status mapping
# Only statuses that arrive via webhook (PENDING is set at creation, not by Shopify)
SHOPIFY_STATUS_MAP = {
    "ACTIVE": "ACTIVE",
    "FROZEN": "PAST_DUE",
    "CANCELLED": "CANCELED",
    "DECLINED": "CANCELED",
    "EXPIRED": "CANCELED",
}


# ==========================================
# GraphQL Helper
# ==========================================

async def _shopify_graphql(
    store_domain: str,
    access_token: str,
    query: str,
    variables: Optional[Dict] = None,
) -> Dict:
    """
    Execute a single GraphQL POST request against Shopify Admin API.

    Same pattern as ShopifyAdapter._graphql_request but standalone —
    billing endpoints don't use the adapter (which is for product/order data).

    This function:
    1. Build the GraphQL URL from store_domain + settings.SHOPIFY_API_VERSION
    2. POST the query + variables with X-Shopify-Access-Token header
    3. Check for errors array + data is None (fatal error)
    4. Log extensions.cost if present (Shopify throttling info)
    5. Return the "data" dict

    Args:
        store_domain: Shopify store domain (e.g., "mystore.myshopify.com")
        access_token: Shopify access token
        query: GraphQL query string
        variables: Optional query variables

    Returns:
        The "data" dict from the GraphQL response

    Raises:
        Exception: If Shopify returns errors with no data (fatal error)
    """
    url = f"https://{store_domain}/admin/api/{settings.SHOPIFY_API_VERSION}/graphql.json"
    headers = {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": access_token,
    }
    payload: Dict = {"query": query}
    if variables:
        payload["variables"] = variables

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload, headers=headers) as response:
            # Check HTTP status before parsing JSON
            if response.status != 200:
                error_text = await response.text()
                raise Exception(
                    f"Shopify GraphQL HTTP {response.status}: {error_text}"
                )

            body = await response.json()

            # Log cost info for throttling awareness
            cost = body.get("extensions", {}).get("cost")
            if cost:
                logger.debug("Shopify Billing GraphQL cost: %s", cost)

            errors = body.get("errors")
            data = body.get("data")

            # Fatal error — errors present and no data at all
            if errors and data is None:
                # Normalize errors: can be str, dict, or list of dicts
                if isinstance(errors, str):
                    error_messages = errors
                elif isinstance(errors, dict):
                    error_messages = errors.get("message", str(errors))
                elif isinstance(errors, list):
                    error_messages = "; ".join(
                        e.get("message", str(e)) if isinstance(e, dict) else str(e)
                        for e in errors
                    )
                else:
                    error_messages = str(errors)
                raise Exception(f"Shopify GraphQL error: {error_messages}")

            # Partial errors — log but continue
            if errors:
                logger.warning("Shopify Billing GraphQL partial errors: %s", errors)

            return data or {}


# ==========================================
# Billing Operations
# ==========================================

async def create_shopify_subscription(
    store_domain: str,
    access_token: str,
    plan_name: str,
    return_url: str,
    test: bool,
) -> Dict:
    """
    Create a Shopify app subscription charge via appSubscriptionCreate mutation.

    This function:
    1. Validate plan_name against SHOPIFY_PLAN_PRICES
    2. Build appSubscriptionCreate mutation with appRecurringPricingDetails
    3. Execute the mutation via _shopify_graphql
    4. Check for userErrors in the response
    5. Return confirmation_url + subscription GID

    Args:
        store_domain: Shopify store domain (e.g., "mystore.myshopify.com")
        access_token: Shopify access token
        plan_name: Plan tier ("PRO" or "ENTERPRISE")
        return_url: URL Shopify redirects to after merchant approves/declines
        test: Whether this is a test charge (dev store)

    Returns:
        Dict with "confirmation_url" and "subscription_gid"

    Raises:
        ValueError: If plan_name is not in SHOPIFY_PLAN_PRICES
        Exception: If Shopify returns userErrors or GraphQL errors
    """
    if plan_name not in SHOPIFY_PLAN_PRICES:
        raise ValueError(f"Unknown plan: {plan_name}. Valid plans: {list(SHOPIFY_PLAN_PRICES.keys())}")

    plan = SHOPIFY_PLAN_PRICES[plan_name]

    query = """
    mutation appSubscriptionCreate(
        $name: String!,
        $returnUrl: URL!,
        $test: Boolean,
        $lineItems: [AppSubscriptionLineItemInput!]!
    ) {
        appSubscriptionCreate(
            name: $name,
            returnUrl: $returnUrl,
            test: $test,
            lineItems: $lineItems
        ) {
            appSubscription {
                id
            }
            confirmationUrl
            userErrors {
                field
                message
            }
        }
    }
    """

    variables = {
        "name": plan["name"],
        "returnUrl": return_url,
        "test": test,
        "lineItems": [
            {
                "plan": {
                    "appRecurringPricingDetails": {
                        "price": {
                            "amount": plan["price"],
                            "currencyCode": plan["currency"],
                        },
                        "interval": SHOPIFY_BILLING_INTERVAL,
                    }
                }
            }
        ],
    }

    data = await _shopify_graphql(store_domain, access_token, query, variables)

    result = data.get("appSubscriptionCreate", {})

    # Check for user errors from Shopify
    user_errors = result.get("userErrors", [])
    if user_errors:
        error_messages = "; ".join(e.get("message", str(e)) for e in user_errors)
        raise Exception(f"Shopify appSubscriptionCreate failed: {error_messages}")

    subscription = result.get("appSubscription", {})
    confirmation_url = result.get("confirmationUrl")

    return {
        "confirmation_url": confirmation_url,
        "subscription_gid": subscription.get("id"),
    }


async def cancel_shopify_subscription(
    store_domain: str,
    access_token: str,
    subscription_gid: str,
) -> bool:
    """
    Cancel a Shopify app subscription via appSubscriptionCancel mutation.

    This function:
    1. Execute appSubscriptionCancel mutation with the subscription GID
    2. Check for userErrors in the response
    3. Return True on success

    Args:
        store_domain: Shopify store domain
        access_token: Shopify access token
        subscription_gid: Shopify subscription GID (e.g., "gid://shopify/AppSubscription/12345")

    Returns:
        True on successful cancellation

    Raises:
        Exception: If Shopify returns userErrors or GraphQL errors
    """
    query = """
    mutation appSubscriptionCancel($id: ID!) {
        appSubscriptionCancel(id: $id) {
            appSubscription {
                id
                status
            }
            userErrors {
                field
                message
            }
        }
    }
    """

    variables = {"id": subscription_gid}

    data = await _shopify_graphql(store_domain, access_token, query, variables)

    result = data.get("appSubscriptionCancel", {})

    # Check for user errors from Shopify
    user_errors = result.get("userErrors", [])
    if user_errors:
        error_messages = "; ".join(e.get("message", str(e)) for e in user_errors)
        raise Exception(f"Shopify appSubscriptionCancel failed: {error_messages}")

    return True


async def get_shopify_subscription_status(
    store_domain: str,
    access_token: str,
    subscription_gid: str,
) -> Optional[Dict]:
    """
    Query a specific Shopify subscription by GID via node(id:) query.

    Uses node(id:) to fetch the exact subscription we created — NOT
    currentAppInstallation.activeSubscriptions[0] which could return
    a different subscription.

    This function:
    1. Query the subscription node by GID
    2. Return subscription details (id, name, status, etc.) or None

    Args:
        store_domain: Shopify store domain
        access_token: Shopify access token
        subscription_gid: Shopify subscription GID

    Returns:
        Dict with subscription details or None if not found
    """
    query = """
    query getSubscription($id: ID!) {
        node(id: $id) {
            ... on AppSubscription {
                id
                name
                status
                createdAt
                currentPeriodEnd
                test
                lineItems {
                    plan {
                        pricingDetails {
                            ... on AppRecurringPricing {
                                price {
                                    amount
                                    currencyCode
                                }
                                interval
                            }
                        }
                    }
                }
            }
        }
    }
    """

    variables = {"id": subscription_gid}

    data = await _shopify_graphql(store_domain, access_token, query, variables)

    node = data.get("node")
    if not node:
        return None

    return node


# ==========================================
# Plan Mapping
# ==========================================

def map_shopify_plan_to_tier(plan_name: str) -> str:
    """
    Map Shopify subscription plan name to our tier system.

    Shopify plan names are human-readable ("Pro", "Enterprise") while
    our tiers are uppercase constants ("PRO", "ENTERPRISE").

    Args:
        plan_name: Shopify plan name (e.g., "Pro", "Enterprise")

    Returns:
        Tier string: "PRO", "ENTERPRISE", or "FREE" for unrecognized plans
    """
    mapping = {
        "Pro": "PRO",
        "Enterprise": "ENTERPRISE",
    }
    return mapping.get(plan_name, "FREE")


# ==========================================
# Webhook Handler
# ==========================================

async def handle_shopify_billing_webhook(
    payload: Dict,
    shop_domain: str,
    db: AsyncSession,
) -> None:
    """
    Process Shopify APP_SUBSCRIPTIONS_UPDATE webhook payload.

    Idempotent — re-processing the same webhook produces the same result.
    If no ShopifyBilling record matches the GID, logs a warning and returns
    (webhook may arrive before the callback creates the record).

    This function:
    1. Extract subscription GID, status, and name from payload
    2. Map Shopify status to our billing_status via SHOPIFY_STATUS_MAP
    3. Find ShopifyBilling by shopify_subscription_gid
    4. If not found → log warning, return (idempotent)
    5. If found → update billing_status and plan_name
    6. Set end_date on CANCELED, clear it on ACTIVE

    Args:
        payload: Parsed JSON webhook payload from Shopify
        shop_domain: Shop domain from X-Shopify-Shop-Domain header
        db: Database session
    """
    # Extract subscription info from webhook payload
    app_subscription = payload.get("app_subscription", {})
    subscription_gid = app_subscription.get("admin_graphql_api_id")
    shopify_status = app_subscription.get("status")
    plan_name = app_subscription.get("name")

    if not subscription_gid or not shopify_status:
        logger.warning(
            "Shopify billing webhook missing required fields. "
            "shop=%s, gid=%s, status=%s",
            shop_domain, subscription_gid, shopify_status,
        )
        return

    # Map Shopify status to our billing_status
    billing_status = SHOPIFY_STATUS_MAP.get(shopify_status)
    if not billing_status:
        logger.warning(
            "Shopify billing webhook unknown status: %s for shop=%s, gid=%s",
            shopify_status, shop_domain, subscription_gid,
        )
        return

    # Find the ShopifyBilling record by GID
    result = await db.execute(
        select(ShopifyBilling).where(
            ShopifyBilling.shopify_subscription_gid == subscription_gid,
        )
    )
    billing = result.scalar_one_or_none()

    if not billing:
        # Webhook may arrive before callback — idempotent, just log
        logger.warning(
            "Shopify billing webhook: no record found for gid=%s, shop=%s. "
            "Webhook may have arrived before callback.",
            subscription_gid, shop_domain,
        )
        return

    # Update billing status
    billing.billing_status = billing_status
    billing.plan_name = map_shopify_plan_to_tier(plan_name) if plan_name else billing.plan_name

    # Set end_date on cancellation, clear it on reactivation
    now = datetime.now(timezone.utc)
    if billing_status == "CANCELED":
        billing.end_date = now
    elif billing_status == "PAST_DUE":
        billing.end_date = now
    elif billing_status == "ACTIVE":
        billing.end_date = None

    await db.commit()

    logger.info(
        "Shopify billing webhook processed: gid=%s, shop=%s, status=%s → %s",
        subscription_gid, shop_domain, shopify_status, billing_status,
    )
