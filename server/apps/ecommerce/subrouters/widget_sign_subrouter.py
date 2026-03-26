"""
Widget Sign Subrouter

Public endpoint that generates HMAC-signed widget URLs for the universal JS loader (widget.js).
Used by non-Shopify platforms (WooCommerce, Magento, custom sites).

Flow:
    1. widget.js on merchant's storefront reads data-* attributes from <div class="nudgio-widget">
    2. widget.js makes XHR GET to /ecommerce/widget/sign?key_id=5&type=bestsellers&top=4&...
    3. This endpoint looks up the API key, signs all params via HMAC-SHA256, returns signed URL
    4. widget.js creates <iframe src="{signed_url}"> inside the div
    5. Signed URL hits /ecommerce/widget/{type} (existing widget_subrouter) which verifies HMAC

Security:
- API key lookup validates key is active + not deleted
- Rate limiting per key_id + per IP
- Domain restriction as secondary signal
- Signed URL includes timestamp + nonce to prevent replay attacks
- CORS: Access-Control-Allow-Origin: * (public endpoint, called from any merchant's storefront)

Endpoint:
- GET /widget/sign — returns JSON { "url": "https://server.nudgio.tech/ecommerce/widget/..." }
"""

import hmac as hmac_mod
import hashlib
import time
import secrets
import logging

from fastapi import APIRouter, Request, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fastapi import Depends

from core.db import get_session
from core.config import settings
from ..models import WidgetAPIKey, EcommerceConnection
from ..utils.encryption_utils import decrypt_password
from ..utils.widget_auth_utils import check_widget_rate_limit, check_domain_restriction

logger = logging.getLogger(__name__)

# ==========================================
# Widget Sign Router
# ==========================================

router = APIRouter(prefix="/widget", tags=["Widget Sign"])


# ==========================================
# CORS Preflight
# ==========================================

@router.options("/sign")
async def sign_options():
    """CORS preflight handler for sign endpoint"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
    )


# ==========================================
# GET /widget/sign — Generate HMAC-Signed Widget URL
# ==========================================

@router.get("/sign")
async def sign_widget_url(
    request: Request,
    key_id: int = Query(..., description="Widget API key ID"),
    type: str = Query(..., description="Widget type: bestsellers, cross-sell, upsell, similar"),
    # Algorithm / data params (passed through to signed URL)
    product_id: str | None = Query(None, description="Product ID (required for cross-sell, upsell, similar)"),
    top: int = Query(4, description="Number of recommendations"),
    lookback_days: int = Query(30, description="Lookback window in days"),
    method: str = Query("volume", description="Bestseller method: volume, value, balanced"),
    min_price_increase: int = Query(10, description="Min price increase % for upsell"),
    device: str = Query("desktop", description="Target device: desktop, mobile"),
    # Group 1: Widget Container
    widget_bg_color: str = Query("#FFFFFF", description="Widget background color hex"),
    widget_padding: str = Query("md", description="Widget padding: none, sm, md, lg"),
    # Group 2: Widget Title
    widget_title: str = Query("", description="Custom widget title (empty = auto-default based on type)"),
    title_color: str = Query("#111827", description="Widget title color hex"),
    title_size: str = Query("lg", description="Widget title size: sm, md, lg, xl"),
    title_alignment: str = Query("left", description="Widget title alignment: left, center"),
    # Group 3: Layout
    widget_style: str = Query("grid", description="Layout style: grid, carousel"),
    widget_columns: int = Query(4, description="Max columns at full width (2-6)"),
    gap: str = Query("md", description="Gap between cards: sm, md, lg"),
    # Group 4: Product Card
    card_bg_color: str = Query("#FFFFFF", description="Card background color hex"),
    card_border_radius: str = Query("8px", description="Card border radius CSS"),
    card_border_width: str = Query("0", description="Card border width: 0, 1, 2"),
    card_border_color: str = Query("#E5E7EB", description="Card border color hex"),
    card_shadow: str = Query("md", description="Card shadow: none, sm, md, lg"),
    card_padding: str = Query("md", description="Card content padding: sm, md, lg"),
    card_hover: str = Query("lift", description="Card hover effect: none, lift, shadow, glow"),
    # Group 5: Product Image
    image_aspect: str = Query("square", description="Image aspect ratio: square, portrait, landscape"),
    image_fit: str = Query("cover", description="Image fit: cover, contain"),
    image_radius: str = Query("8px", description="Image border radius CSS"),
    # Group 6: Product Title in Card
    product_title_color: str = Query("#1F2937", description="Product title color hex"),
    product_title_size: str = Query("sm", description="Product title size: xs, sm, md, lg"),
    product_title_weight: str = Query("semibold", description="Product title weight: normal, medium, semibold, bold"),
    product_title_lines: int = Query(2, description="Product title max lines: 1-3"),
    product_title_alignment: str = Query("left", description="Product title alignment: left, center"),
    # Group 7: Price
    show_price: bool = Query(True, description="Show product price"),
    price_color: str = Query("#111827", description="Price text color hex"),
    price_size: str = Query("md", description="Price text size: sm, md, lg"),
    # Group 8: CTA Button
    button_text: str = Query("View", description="CTA button text"),
    button_bg_color: str = Query("#3B82F6", description="Button background color hex"),
    button_text_color: str = Query("#FFFFFF", description="Button text color hex"),
    button_radius: str = Query("6px", description="Button border radius CSS"),
    button_size: str = Query("md", description="Button size: sm, md, lg"),
    button_variant: str = Query("solid", description="Button variant: solid, outline, ghost"),
    button_full_width: bool = Query(False, description="Button full width"),
    db: AsyncSession = Depends(get_session),
):
    """
    Generate an HMAC-signed widget URL for iframe embedding.

    This endpoint:
    1. Look up WidgetAPIKey by key_id (active, not deleted)
    2. Load the connection (active, not deleted)
    3. Check rate limit (per key_id + per client IP)
    4. Check domain restriction (referer vs allowed_domains)
    5. Decrypt API secret via Fernet
    6. Build params dict with all widget params + key_id + ts + nonce
    7. Sort params → urlencode → HMAC-SHA256 → hexdigest
    8. Build signed URL: {SERVER_URL}/ecommerce/widget/{type}?{params}&sig={sig}
    9. Return JSON { "url": signed_url }
    """
    cors_headers = {"Access-Control-Allow-Origin": "*"}

    # Step 1: Look up API key (active + not deleted)
    result = await db.execute(
        select(WidgetAPIKey).where(
            and_(
                WidgetAPIKey.id == key_id,
                WidgetAPIKey.is_active == True,
                WidgetAPIKey.deleted_at.is_(None),
            )
        )
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        return JSONResponse(
            status_code=403,
            content={"error": "Invalid or inactive API key"},
            headers=cors_headers,
        )

    # Step 2: Load connection (active + not deleted)
    conn_result = await db.execute(
        select(EcommerceConnection).where(
            and_(
                EcommerceConnection.id == api_key.connection_id,
                EcommerceConnection.is_active == True,
                EcommerceConnection.deleted_at.is_(None),
            )
        )
    )
    connection = conn_result.scalar_one_or_none()
    if not connection:
        return JSONResponse(
            status_code=403,
            content={"error": "Connection not found or inactive"},
            headers=cors_headers,
        )

    # Step 3: Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    rate_ok = await check_widget_rate_limit(key_id, client_ip)
    if not rate_ok:
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded"},
            headers=cors_headers,
        )

    # Step 4: Domain restriction check
    referer = request.headers.get("referer")
    domain_ok = check_domain_restriction(api_key, referer)
    if not domain_ok:
        return JSONResponse(
            status_code=403,
            content={"error": "Domain not allowed"},
            headers=cors_headers,
        )

    # Step 5: Decrypt API secret
    try:
        decrypted_secret = decrypt_password(api_key.api_key_encrypted)
    except Exception:
        logger.error("Widget sign: failed to decrypt API key id=%s", key_id)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal authentication error"},
            headers=cors_headers,
        )

    # Step 6: Build params dict — URL param name = DB column name
    params = {
        "key_id": str(key_id),
        "connection_id": str(connection.id),
        "ts": str(int(time.time())),
        "nonce": secrets.token_hex(16),
        # Algorithm / data
        "top": str(top),
        "lookback_days": str(lookback_days),
        "method": method,
        "min_price_increase": str(min_price_increase),
        "device": device,
        # Group 1: Widget Container
        "widget_bg_color": widget_bg_color,
        "widget_padding": widget_padding,
        # Group 2: Widget Title
        "title_color": title_color,
        "title_size": title_size,
        "title_alignment": title_alignment,
        # Group 3: Layout
        "widget_style": widget_style,
        "widget_columns": str(widget_columns),
        "gap": gap,
        # Group 4: Product Card
        "card_bg_color": card_bg_color,
        "card_border_radius": card_border_radius,
        "card_border_width": card_border_width,
        "card_border_color": card_border_color,
        "card_shadow": card_shadow,
        "card_padding": card_padding,
        "card_hover": card_hover,
        # Group 5: Product Image
        "image_aspect": image_aspect,
        "image_fit": image_fit,
        "image_radius": image_radius,
        # Group 6: Product Title in Card
        "product_title_color": product_title_color,
        "product_title_size": product_title_size,
        "product_title_weight": product_title_weight,
        "product_title_lines": str(product_title_lines),
        "product_title_alignment": product_title_alignment,
        # Group 7: Price
        "show_price": str(show_price).lower(),
        "price_color": price_color,
        "price_size": price_size,
        # Group 8: CTA Button
        "button_text": button_text,
        "button_bg_color": button_bg_color,
        "button_text_color": button_text_color,
        "button_radius": button_radius,
        "button_size": button_size,
        "button_variant": button_variant,
        "button_full_width": str(button_full_width).lower(),
    }

    # Only include widget_title if non-empty (empty = server auto-defaults)
    if widget_title:
        params["widget_title"] = widget_title

    # Only include product_id if provided (not needed for bestsellers)
    if product_id:
        params["product_id"] = product_id

    # Step 7: Sort → urlencode → HMAC-SHA256
    from urllib.parse import urlencode
    sorted_params = sorted(params.items())
    canonical = urlencode(sorted_params)

    sig = hmac_mod.new(
        decrypted_secret.encode("utf-8"),
        canonical.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    # Step 8: Build signed URL
    signed_url = f"{settings.SERVER_URL}/ecommerce/widget/{type}?{canonical}&sig={sig}"

    # Step 9: Return signed URL
    return JSONResponse(
        content={"url": signed_url},
        headers=cors_headers,
    )
