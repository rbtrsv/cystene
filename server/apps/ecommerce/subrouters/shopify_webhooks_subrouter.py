"""
Shopify Webhooks Subrouter

All Shopify webhooks flow through a single dispatcher endpoint that verifies
HMAC and routes by X-Shopify-Topic header. This matches shopify.app.toml
configuration where compliance_topics all go to one URI.

Dispatcher:
- POST /shopify/webhooks — single entry point for ALL Shopify webhooks

Handled topics:
- customers/data_request — customer requests their data (GDPR)
- customers/redact — delete customer's personal data (GDPR)
- shop/redact — delete all shop data, 48h after uninstall (GDPR)
- app/uninstalled — merchant uninstalls app (immediate deactivation)
- app_subscriptions/update — billing status changes

Individual endpoints are preserved for backward compatibility:
- POST /shopify/webhooks/customers/data_request
- POST /shopify/webhooks/customers/redact
- POST /shopify/webhooks/shop/redact
- POST /shopify/webhooks/app_subscriptions/update

These are ungated — no user auth, no subscription check, no rate limiting.
Authentication is via HMAC signature verification only.
"""

import json
import hmac
import hashlib
import base64
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Request, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from core.db import get_session
from core.config import settings
from ..models import EcommerceConnection, ShopifyBilling
from ..utils.shopify_billing_utils import handle_shopify_billing_webhook

logger = logging.getLogger(__name__)

# ==========================================
# Shopify Webhooks Router
# ==========================================

router = APIRouter(prefix="/shopify/webhooks", tags=["Shopify Webhooks"])


# ==========================================
# HMAC Verification (Base64)
# ==========================================

async def _verify_webhook_hmac(request: Request) -> bytes:
    """
    Verify Shopify webhook HMAC-SHA256 signature (Base64).

    Procedure:
    1. Read raw request body as bytes
    2. Compute HMAC-SHA256 using Client Secret as key
    3. Base64 encode the digest
    4. Compare to X-Shopify-Hmac-SHA256 header (timing-safe)

    Returns:
        Raw body bytes (for JSON parsing after verification)

    Raises:
        HTTPException 401 if HMAC is missing or invalid
    """
    # Get the HMAC header from Shopify
    received_hmac = request.headers.get("X-Shopify-Hmac-SHA256")
    if not received_hmac:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Shopify-Hmac-SHA256 header",
        )

    # Verify Client Secret is configured
    if not settings.SHOPIFY_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Shopify Client Secret not configured",
        )

    # Read raw body bytes for HMAC computation
    body = await request.body()

    # Compute HMAC-SHA256 and Base64 encode
    computed = base64.b64encode(
        hmac.new(
            settings.SHOPIFY_CLIENT_SECRET.encode("utf-8"),
            body,
            hashlib.sha256,
        ).digest()
    ).decode("utf-8")

    # Timing-safe comparison
    if not hmac.compare_digest(computed, received_hmac):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="HMAC verification failed",
        )

    return body


# ==========================================
# GDPR Endpoints
# ==========================================

@router.post("/customers/data_request")
async def customers_data_request(request: Request):
    """
    Handle Shopify customers/data_request webhook

    This endpoint:
    1. Verifies the HMAC-SHA256 signature (Base64)
    2. Logs the data request
    3. Returns 200 OK — Nudgio does not store personal customer data,
       only aggregated order counts and product recommendations

    Shopify sends this when a customer requests their data under GDPR.
    """
    body = await _verify_webhook_hmac(request)

    payload = json.loads(body)
    shop_domain = payload.get("shop_domain", "unknown")

    logger.info(f"Received customers/data_request webhook for shop: {shop_domain}")

    # Nudgio does not store personal customer data.
    # We only store connection credentials and aggregated analytics.
    # No customer PII to return.

    return {"success": True}


@router.post("/customers/redact")
async def customers_redact(request: Request):
    """
    Handle Shopify customers/redact webhook

    This endpoint:
    1. Verifies the HMAC-SHA256 signature (Base64)
    2. Logs the redaction request
    3. Returns 200 OK — Nudgio does not store personal customer data

    Shopify sends this when a customer requests deletion of their data under GDPR.
    """
    body = await _verify_webhook_hmac(request)

    payload = json.loads(body)
    shop_domain = payload.get("shop_domain", "unknown")

    logger.info(f"Received customers/redact webhook for shop: {shop_domain}")

    # Nudgio does not store personal customer data.
    # Recommendation analytics track product IDs and event types,
    # not customer identities. Nothing to redact.

    return {"success": True}


@router.post("/shop/redact")
async def shop_redact(
    request: Request,
    db: AsyncSession = Depends(get_session),
):
    """
    Handle Shopify shop/redact webhook

    This endpoint:
    1. Verifies the HMAC-SHA256 signature (Base64)
    2. Finds ALL EcommerceConnections matching the shop_domain
    3. Soft-deletes them (sets deleted_at timestamp)
    4. Related data (settings, usage_tracking, analytics) cascades via FK

    Shopify sends this 48 hours after a merchant uninstalls the app.
    We must delete all data associated with that shop.
    """
    body = await _verify_webhook_hmac(request)

    payload = json.loads(body)
    shop_domain = payload.get("shop_domain", "unknown")

    logger.info(f"Received shop/redact webhook for shop: {shop_domain}")

    # Find ALL connections for this shop domain (not just the first one)
    result = await db.execute(
        select(EcommerceConnection).where(
            EcommerceConnection.platform == "shopify",
            EcommerceConnection.store_url == shop_domain,
            EcommerceConnection.deleted_at == None,
        )
    )
    connections = result.scalars().all()

    if connections:
        now = datetime.now(timezone.utc)
        for connection in connections:
            # Soft-delete the connection
            connection.deleted_at = now
            # Clear sensitive credentials
            connection.api_key = None
            connection.api_secret = None
            connection.is_active = False

        await db.commit()
        logger.info(f"shop/redact: soft-deleted {len(connections)} connection(s) for {shop_domain}")
    else:
        logger.info(f"shop/redact: no active connections found for {shop_domain}")

    return {"success": True}


# ==========================================
# Billing Webhook
# ==========================================

@router.post("/app_subscriptions/update")
async def app_subscriptions_update(
    request: Request,
    db: AsyncSession = Depends(get_session),
):
    """
    Handle Shopify APP_SUBSCRIPTIONS_UPDATE webhook

    This endpoint:
    1. Verify the HMAC-SHA256 signature (Base64) via _verify_webhook_hmac
    2. Parse JSON payload and extract shop domain
    3. Call handle_shopify_billing_webhook to update ShopifyBilling record
       → idempotent: re-processing same webhook = same result
       → if ShopifyBilling not found for GID: logs warning, still returns 200
    4. Return 200 only after HMAC verified + payload processed
       (401 on invalid HMAC is raised by _verify_webhook_hmac before reaching step 2)

    Register in Shopify Partner Dashboard:
        topic: APP_SUBSCRIPTIONS_UPDATE
        URL: https://server.nudgio.tech/ecommerce/shopify/webhooks/app_subscriptions/update
    """
    # Step 1: Verify HMAC signature (raises 401 if invalid)
    body = await _verify_webhook_hmac(request)

    # Step 2: Parse payload
    payload = json.loads(body)
    shop_domain = request.headers.get("X-Shopify-Shop-Domain", "unknown")

    logger.info(f"Received app_subscriptions/update webhook for shop: {shop_domain}")

    # Step 3: Process billing status update (idempotent)
    await handle_shopify_billing_webhook(payload, shop_domain, db)

    # Step 4: Return 200
    return {"success": True}


# ==========================================
# App Uninstalled Handler
# ==========================================

async def _handle_app_uninstalled(payload: dict, db: AsyncSession):
    """
    Handle Shopify app/uninstalled webhook.

    Fires immediately when a merchant uninstalls the app.
    Deactivates all connections for this shop and cancels any active ShopifyBilling.

    shop/redact fires 48h later and handles soft-delete + credential cleanup.
    This handler does the immediate deactivation so the merchant doesn't see
    an active billing record for a removed app.

    This function:
    1. Extract shop_domain from payload
    2. Find all active connections for this shop
    3. Deactivate them (is_active = False)
    4. Cancel any ACTIVE/PENDING ShopifyBilling records for these connections
    """
    shop_domain = payload.get("myshopify_domain") or payload.get("domain", "unknown")

    logger.info(f"Received app/uninstalled webhook for shop: {shop_domain}")

    # Find all active connections for this shop
    result = await db.execute(
        select(EcommerceConnection).where(
            EcommerceConnection.platform == "shopify",
            EcommerceConnection.store_url == shop_domain,
            EcommerceConnection.deleted_at == None,
        )
    )
    connections = result.scalars().all()

    if not connections:
        logger.info(f"app/uninstalled: no active connections found for {shop_domain}")
        return

    now = datetime.now(timezone.utc)
    connection_ids = [c.id for c in connections]

    # Deactivate connections (don't soft-delete — shop/redact does that 48h later)
    for connection in connections:
        connection.is_active = False

    # Cancel any ACTIVE or PENDING ShopifyBilling for these connections
    billing_result = await db.execute(
        select(ShopifyBilling).where(
            and_(
                ShopifyBilling.connection_id.in_(connection_ids),
                ShopifyBilling.billing_status.in_(["ACTIVE", "PENDING"]),
                ShopifyBilling.deleted_at == None,
            )
        )
    )
    billings = billing_result.scalars().all()

    for billing in billings:
        billing.billing_status = "CANCELED"
        billing.end_date = now

    await db.commit()
    logger.info(
        f"app/uninstalled: deactivated {len(connections)} connection(s), "
        f"canceled {len(billings)} billing record(s) for {shop_domain}"
    )


# ==========================================
# Dispatcher (single entry point for all webhooks)
# ==========================================

@router.post("")
async def webhook_dispatcher(
    request: Request,
    db: AsyncSession = Depends(get_session),
):
    """
    Single entry point for ALL Shopify webhooks.

    Configured in shopify.app.toml as the uri for all topics + compliance_topics.
    Shopify sends the topic in the X-Shopify-Topic header.

    This endpoint:
    1. Verify HMAC-SHA256 signature (Base64)
    2. Read X-Shopify-Topic header to identify the webhook type
    3. Parse JSON payload
    4. Route to the appropriate handler based on topic
    5. Return 200 (Shopify retries on non-2xx)

    Unknown topics are logged and acknowledged with 200 (forward-compatible).
    """
    # Step 1: Verify HMAC signature (raises 401 if invalid)
    body = await _verify_webhook_hmac(request)

    # Step 2: Read topic
    topic = request.headers.get("X-Shopify-Topic", "unknown")

    # Step 3: Parse payload
    payload = json.loads(body)
    shop_domain = (
        request.headers.get("X-Shopify-Shop-Domain")
        or payload.get("shop_domain")
        or payload.get("myshopify_domain")
        or "unknown"
    )

    logger.info(f"Webhook dispatcher: topic={topic}, shop={shop_domain}")

    # Step 4: Route to handler
    if topic == "customers/data_request":
        # Nudgio does not store personal customer data — nothing to return
        logger.info(f"Received customers/data_request webhook for shop: {shop_domain}")

    elif topic == "customers/redact":
        # Nudgio does not store personal customer data — nothing to redact
        logger.info(f"Received customers/redact webhook for shop: {shop_domain}")

    elif topic == "shop/redact":
        # Soft-delete all connections + clear credentials
        await _handle_shop_redact(payload, shop_domain, db)

    elif topic == "app/uninstalled":
        # Deactivate connections + cancel billing immediately
        await _handle_app_uninstalled(payload, db)

    elif topic == "app_subscriptions/update":
        # Update ShopifyBilling status
        await handle_shopify_billing_webhook(payload, shop_domain, db)

    else:
        # Unknown topic — log and acknowledge (forward-compatible)
        logger.warning(f"Webhook dispatcher: unknown topic={topic}, shop={shop_domain}")

    # Step 5: Return 200
    return {"success": True}


async def _handle_shop_redact(payload: dict, shop_domain: str, db: AsyncSession):
    """
    Internal handler for shop/redact topic (used by dispatcher).
    Same logic as the shop_redact endpoint.
    """
    logger.info(f"Received shop/redact webhook for shop: {shop_domain}")

    # Find ALL connections for this shop domain
    result = await db.execute(
        select(EcommerceConnection).where(
            EcommerceConnection.platform == "shopify",
            EcommerceConnection.store_url == shop_domain,
            EcommerceConnection.deleted_at == None,
        )
    )
    connections = result.scalars().all()

    if connections:
        now = datetime.now(timezone.utc)
        for connection in connections:
            connection.deleted_at = now
            connection.api_key = None
            connection.api_secret = None
            connection.is_active = False

        await db.commit()
        logger.info(f"shop/redact: soft-deleted {len(connections)} connection(s) for {shop_domain}")
    else:
        logger.info(f"shop/redact: no active connections found for {shop_domain}")
