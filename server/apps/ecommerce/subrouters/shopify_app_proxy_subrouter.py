"""
Shopify App Proxy Subrouter

Public endpoints for storefront widget delivery via Shopify App Proxy.
No JWT auth, no session token — authenticated via Shopify HMAC signature only.

Storefront URL pattern:
    https://shop.myshopify.com/apps/nudgio-widget/{type}?top=4&style=card&...

Shopify intercepts the request and proxies it to:
    https://server.nudgio.tech/ecommerce/shopify/app-proxy/{type}?top=4&...&shop=...&signature=...&timestamp=...

Endpoints:
- GET /shopify/app-proxy/bestsellers — bestseller widget HTML
- GET /shopify/app-proxy/cross-sell — cross-sell widget HTML (requires product_id)
- GET /shopify/app-proxy/upsell — upsell widget HTML (requires product_id)
- GET /shopify/app-proxy/similar — similar products widget HTML (requires product_id)

Auth: HMAC-SHA256 hex signature via 'signature' query parameter.
Same algorithm as OAuth callback (_verify_hmac in shopify_oauth_subrouter.py),
but param name is 'signature' instead of 'hmac'.

All responses are HTMLResponse (including errors) because these render inside
an iframe on the merchant's storefront.
"""

import hmac as hmac_mod
import hashlib
import logging

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from core.db import get_session
from core.config import settings
from ..models import EcommerceConnection, RecommendationSettings
from ..schemas.recommendation_schemas import BestsellerMethod
from ..adapters.factory import get_adapter
from ..engine.engine import RecommendationEngine
from ..utils.cache_utils import (
    get_cached_recommendations, set_cached_recommendations,
    get_cached_shop_connection, set_cached_shop_connection,
    get_cached_service_status, set_cached_service_status,
    get_cached_settings, set_cached_settings,
)
from ..utils.subscription_utils import is_service_active
from .components_subrouter import generate_recommendation_html, get_default_shop_urls, apply_visual_defaults

logger = logging.getLogger(__name__)

# ==========================================
# Shopify App Proxy Router
# ==========================================

router = APIRouter(prefix="/shopify/app-proxy", tags=["Shopify App Proxy"])


# ==========================================
# HMAC Verification (App Proxy — NOT same as OAuth)
# ==========================================

def _verify_proxy_signature(request: Request, client_secret: str) -> bool:
    """
    Verify Shopify App Proxy HMAC-SHA256 signature.

    DIFFERENT from OAuth callback (_verify_hmac in shopify_oauth_subrouter.py).
    App Proxy uses a different join format.

    Follows Shopify App Proxy authentication docs exactly:
    https://shopify.dev/docs/apps/build/online-store/app-proxies/authenticate-app-proxies

    Algorithm (matching Ruby reference):
        query_hash = Rack::Utils.parse_query(query_string)
        signature = query_hash.delete("signature")
        sorted_params = query_hash.collect{ |k, v| "#{k}=#{Array(v).join(',')}" }.sort.join
        calculated = OpenSSL::HMAC.hexdigest('sha256', secret, sorted_params)

    Key differences from OAuth HMAC:
    - Values are URL-decoded (not raw encoded)
    - Duplicate keys are joined with comma: key=v1,v2
    - Sorted key=value pairs are concatenated WITHOUT separator (no &)
    - HMAC-SHA256 hex digest with Client Secret
    """
    from urllib.parse import unquote, parse_qs

    # Step 1: Parse query string with URL decoding, preserve duplicate keys
    # parse_qs returns {key: [val1, val2, ...]} with decoded values
    raw_qs = str(request.url.query)
    parsed = parse_qs(raw_qs, keep_blank_values=True)

    # Step 2: Extract and remove signature
    signature_list = parsed.pop("signature", [])
    received_signature = signature_list[0] if signature_list else ""

    if not received_signature:
        return False

    # Step 3: Build sorted params string
    # Duplicate key values joined with comma, then sorted alphabetically, then concatenated (no separator)
    param_strings = []
    for key, values in parsed.items():
        # Join multiple values with comma (e.g., extra=1&extra=2 → extra=1,2)
        joined_value = ",".join(values)
        param_strings.append(f"{key}={joined_value}")

    # Sort alphabetically and concatenate WITHOUT separator (Shopify's .sort.join with no arg)
    param_strings.sort()
    sorted_params = "".join(param_strings)

    # Step 4: HMAC-SHA256 hex digest
    computed = hmac_mod.new(
        client_secret.encode("utf-8"),
        sorted_params.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    # Step 5: Timing-safe compare
    return hmac_mod.compare_digest(computed, received_signature)


# ==========================================
# Connection Lookup (by shop domain)
# ==========================================

async def _get_connection_by_shop(shop: str, db: AsyncSession) -> EcommerceConnection | None:
    """
    Look up active Shopify connection by shop domain, with cache.

    Cache layer: stores connection_id by shop domain (TTL 5 min).
    On cache hit, does an instant PK lookup via db.get() instead of full WHERE query.
    On cache miss, runs the full query and caches the result.

    Deterministic: most recent active connection for this shop.
    Filters: platform=shopify, store_url=shop, is_active=True, not soft-deleted.
    """
    # Check cache — connection_id + org_id by shop domain
    cached = await get_cached_shop_connection(shop)
    if cached is not None:
        # PK lookup — instant, uses SQLAlchemy identity map within same request
        connection = await db.get(EcommerceConnection, cached["connection_id"])
        if connection and connection.is_active and connection.deleted_at is None:
            return connection
        # Cached connection no longer valid — fall through to full query

    # Full WHERE query
    result = await db.execute(
        select(EcommerceConnection).where(
            and_(
                EcommerceConnection.platform == "shopify",
                EcommerceConnection.store_url == shop,
                EcommerceConnection.is_active == True,
                EcommerceConnection.deleted_at.is_(None),
            )
        ).order_by(EcommerceConnection.created_at.desc()).limit(1)
    )
    connection = result.scalars().first()

    # Cache the result for next request
    if connection:
        await set_cached_shop_connection(shop, connection.id, connection.organization_id)

    return connection


# ==========================================
# Error HTML Templates
# ==========================================

def _sanitize_proxy_param(value: str) -> str:
    """
    Sanitize a string query parameter from Shopify App Proxy requests.

    Shopify Theme Editor appends tracking params (e.g. ?oseid=...) to the
    iframe src URL. This contaminates the last query parameter's value
    because the editor uses '?' instead of '&', making it part of the
    value instead of a separate parameter.

    Example: button_text=View?oseid=abc123 → button_text should be "View"

    Strips everything after the first '?' in the value.
    """
    return value.split("?")[0].strip()


# Fields from RecommendationSettings to cache for visual/URL rendering
_SETTINGS_CACHE_FIELDS = [
    "shop_base_url", "product_url_template",
    # Group 1: Widget Container
    "widget_bg_color", "widget_padding",
    # Group 2: Widget Title
    "widget_title", "title_color", "title_size", "title_alignment",
    # Group 3: Layout
    "widget_style", "widget_columns", "gap", "card_min_width", "card_max_width",
    # Group 4: Product Card
    "card_bg_color", "card_border_radius", "card_border_width", "card_border_color",
    "card_shadow", "card_padding", "card_hover",
    # Group 5: Product Image
    "image_aspect_w", "image_aspect_h", "image_fit", "image_radius",
    # Group 6: Product Title in Card
    "product_title_color", "product_title_size", "product_title_weight",
    "product_title_lines", "product_title_alignment",
    # Group 7: Price
    "show_price", "price_color", "price_size",
    # Group 8: CTA Button
    "button_text", "button_bg_color", "button_text_color", "button_radius",
    "button_size", "button_variant", "button_full_width",
]


def _settings_to_dict(rec_settings) -> dict | None:
    """Extract cacheable fields from RecommendationSettings ORM object."""
    if rec_settings is None:
        return None
    return {f: getattr(rec_settings, f, None) for f in _SETTINGS_CACHE_FIELDS}


def _settings_from_cache(cached_dict: dict):
    """
    Reconstruct a settings-like object from cached dict.
    Uses SimpleNamespace so getattr() works in apply_visual_defaults() and
    get_default_shop_urls().
    Returns None if cached_dict is the empty sentinel.
    """
    from types import SimpleNamespace
    if cached_dict.get("_empty"):
        return None
    return SimpleNamespace(**cached_dict)


def _error_html(message: str) -> str:
    """Generate minimal error HTML for iframe display."""
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100px;font-family:sans-serif;color:#6B7280;">
    <p>{message}</p>
</body>
</html>"""


# ==========================================
# GET /bestsellers — Bestseller Widget
# ==========================================

@router.get("/bestsellers", response_class=HTMLResponse)
async def get_bestsellers_widget(
    request: Request,
    shop: str = Query("", description="Shopify store domain (added by Shopify App Proxy)"),
    top: int = Query(4, description="Number of recommendations to show"),
    lookback_days: int = Query(30, description="Number of days to look back for order data"),
    method: str = Query("volume", description="Bestseller calculation method: volume, value, or balanced"),
    device: str = Query("desktop", description="Target device: desktop, mobile"),
    # Group 1: Widget Container
    widget_bg_color: str = Query("#FFFFFF", description="Widget background color hex"),
    widget_padding: int = Query(16, description="Widget padding in pixels"),
    # Group 2: Widget Title
    widget_title: str = Query("", description="Custom widget title (empty = auto-default by widget type)"),
    title_color: str = Query("#111827", description="Widget title color hex"),
    title_size: int = Query(24, description="Widget title font-size in pixels"),
    title_alignment: str = Query("left", description="Widget title alignment: left, center"),
    # Group 3: Layout
    widget_style: str = Query("grid", description="Layout style: grid, carousel"),
    widget_columns: int = Query(4, description="Max columns at full width (2-6)"),
    gap: int = Query(16, description="Gap between cards in pixels"),
    card_min_width: int = Query(200, description="Min card width in pixels"),
    card_max_width: int = Query(0, description="Max card width in pixels (0 = no limit)"),
    # Group 4: Product Card
    card_bg_color: str = Query("#FFFFFF", description="Card background color hex"),
    card_border_radius: int = Query(8, description="Card border radius in pixels"),
    card_border_width: int = Query(0, description="Card border width in pixels"),
    card_border_color: str = Query("#E5E7EB", description="Card border color hex"),
    card_shadow: str = Query("md", description="Card shadow: none, sm, md, lg"),
    card_padding: int = Query(16, description="Card content padding in pixels"),
    card_hover: str = Query("lift", description="Card hover effect: none, lift, shadow, glow"),
    # Group 5: Product Image
    image_aspect_w: int = Query(1, description="Image aspect ratio width (e.g. 1, 3, 4, 16)"),
    image_aspect_h: int = Query(1, description="Image aspect ratio height (e.g. 1, 4, 5, 9)"),
    image_fit: str = Query("cover", description="Image fit: cover, contain"),
    image_radius: int = Query(8, description="Image border radius in pixels"),
    # Group 6: Product Title in Card
    product_title_color: str = Query("#1F2937", description="Product title color hex"),
    product_title_size: int = Query(14, description="Product title font-size in pixels"),
    product_title_weight: int = Query(600, description="CSS font-weight (100-900)"),
    product_title_lines: int = Query(2, description="Product title max lines: 1-3"),
    product_title_alignment: str = Query("left", description="Product title alignment: left, center"),
    # Group 7: Price
    show_price: bool = Query(True, description="Show product price"),
    price_color: str = Query("#111827", description="Price text color hex"),
    price_size: int = Query(18, description="Price font-size in pixels"),
    # Group 8: CTA Button
    button_text: str = Query("View", description="CTA button text"),
    button_bg_color: str = Query("#3B82F6", description="Button background color hex"),
    button_text_color: str = Query("#FFFFFF", description="Button text color hex"),
    button_radius: int = Query(6, description="Button border radius in pixels"),
    button_size: int = Query(14, description="Button font-size in pixels"),
    button_variant: str = Query("solid", description="Button variant: solid, outline, ghost"),
    button_full_width: bool = Query(False, description="Button full width"),
    db: AsyncSession = Depends(get_session),
):
    """
    Serve bestseller recommendation widget HTML via Shopify App Proxy.

    Public endpoint — no JWT, no session token. Authenticated via Shopify HMAC
    signature in query params. Returns HTML for iframe rendering on storefront.

    This endpoint:
    1. Verify HMAC-SHA256 signature from 'signature' query param
    2. Look up active Shopify connection by 'shop' domain
    3. Check entitlement (active subscription or free tier within limits)
    4. Get RecommendationSettings for shop URL configuration
    5. Create adapter + engine, check cache or generate bestseller recommendations
    6. Generate HTML widget via generate_recommendation_html
    7. Return HTMLResponse for iframe rendering
    """
    try:
        # Sanitize string params — Shopify Theme Editor appends ?oseid=... to iframe URLs
        method = _sanitize_proxy_param(method)
        widget_bg_color = _sanitize_proxy_param(widget_bg_color)

        widget_title = _sanitize_proxy_param(widget_title)
        title_color = _sanitize_proxy_param(title_color)
        # title_size is int — no string sanitization needed
        title_alignment = _sanitize_proxy_param(title_alignment)
        widget_style = _sanitize_proxy_param(widget_style)
        card_bg_color = _sanitize_proxy_param(card_bg_color)
        # card_border_radius and card_border_width are int — no string sanitization needed
        card_border_color = _sanitize_proxy_param(card_border_color)
        card_shadow = _sanitize_proxy_param(card_shadow)
        card_hover = _sanitize_proxy_param(card_hover)
        image_fit = _sanitize_proxy_param(image_fit)
        # image_radius is int — no string sanitization needed
        product_title_color = _sanitize_proxy_param(product_title_color)
        # product_title_size, product_title_weight are int — no string sanitization needed
        product_title_alignment = _sanitize_proxy_param(product_title_alignment)
        price_color = _sanitize_proxy_param(price_color)
        # price_size is int — no string sanitization needed
        button_text = _sanitize_proxy_param(button_text)
        button_bg_color = _sanitize_proxy_param(button_bg_color)
        button_text_color = _sanitize_proxy_param(button_text_color)
        # button_radius, button_size are int — no string sanitization needed
        button_variant = _sanitize_proxy_param(button_variant)

        # Step 1: Verify HMAC signature
        if not settings.SHOPIFY_CLIENT_SECRET:
            logger.error("App Proxy: SHOPIFY_CLIENT_SECRET not configured")
            return HTMLResponse(content=_error_html("Widget not available"), status_code=500)

        if not _verify_proxy_signature(request, settings.SHOPIFY_CLIENT_SECRET):
            logger.warning(f"App Proxy: HMAC verification failed for shop={shop}")
            return HTMLResponse(content=_error_html("Unauthorized"), status_code=401)

        # Step 2: Look up connection by shop domain
        connection = await _get_connection_by_shop(shop, db)
        if not connection:
            logger.warning(f"App Proxy: no active connection for shop={shop}")
            return HTMLResponse(content=_error_html("Widget not available"), status_code=404)

        # Step 3: Check entitlement (cached — avoids subscription DB query on every render)
        cached_status = await get_cached_service_status(connection.organization_id)
        if cached_status is not None:
            service_active = cached_status
        else:
            service_active = await is_service_active(connection.organization_id, db)
            await set_cached_service_status(connection.organization_id, service_active)
        if not service_active:
            logger.info(f"App Proxy: service inactive for shop={shop}, org_id={connection.organization_id}")
            return HTMLResponse(
                content=_error_html("Widget unavailable — subscription required"),
                status_code=403,
            )

        # Step 4: Get shop URL settings (cached — avoids settings DB query on every render)
        cached_settings = await get_cached_settings(connection.id)
        if cached_settings is not None:
            rec_settings = _settings_from_cache(cached_settings)
        else:
            settings_result = await db.execute(
                select(RecommendationSettings).where(
                    RecommendationSettings.connection_id == connection.id
                )
            )
            rec_settings = settings_result.scalar_one_or_none()
            await set_cached_settings(connection.id, _settings_to_dict(rec_settings))
        shop_urls = get_default_shop_urls(connection, rec_settings)

        # Apply visual defaults fallback chain: URL param → DB brand defaults → hardcoded
        vis = apply_visual_defaults(
            rec_settings,
            widget_bg_color=widget_bg_color, widget_padding=widget_padding,
            widget_title=widget_title, title_color=title_color, title_size=title_size, title_alignment=title_alignment,
            widget_style=widget_style, widget_columns=widget_columns, gap=gap, card_min_width=card_min_width, card_max_width=card_max_width,
            card_bg_color=card_bg_color, card_border_radius=card_border_radius, card_border_width=card_border_width,
            card_border_color=card_border_color, card_shadow=card_shadow, card_padding=card_padding, card_hover=card_hover,
            image_aspect_w=image_aspect_w, image_aspect_h=image_aspect_h, image_fit=image_fit, image_radius=image_radius,
            product_title_color=product_title_color, product_title_size=product_title_size,
            product_title_weight=product_title_weight, product_title_lines=product_title_lines,
            product_title_alignment=product_title_alignment,
            show_price=show_price, price_color=price_color, price_size=price_size,
            button_text=button_text, button_bg_color=button_bg_color, button_text_color=button_text_color,
            button_radius=button_radius, button_size=button_size, button_variant=button_variant,
            button_full_width=button_full_width,
        )

        # Step 5: Create adapter + engine, check cache or generate
        adapter = get_adapter(connection, db)
        engine = RecommendationEngine(adapter)

        cached = await get_cached_recommendations(
            connection.id, "bestseller",
            limit=top, method=method, lookback_days=lookback_days,
        )
        if cached is not None:
            recs = cached
        else:
            method_enum = BestsellerMethod(method) if method in [m.value for m in BestsellerMethod] else BestsellerMethod.VOLUME
            recs = await engine.get_bestsellers(limit=top, lookback_days=lookback_days, method=method_enum)
            await set_cached_recommendations(
                connection.id, "bestseller", recs,
                limit=top, method=method, lookback_days=lookback_days,
            )

        # Step 6: Generate HTML widget
        html = generate_recommendation_html(
            recommendations=recs, vis=vis,
            rec_type="bestseller", shop_urls=shop_urls,
        )

        # Step 7: Return HTMLResponse
        return HTMLResponse(content=html)

    except Exception as e:
        logger.error(f"App Proxy bestsellers error for shop={shop}: {str(e)}")
        return HTMLResponse(content=_error_html("Error loading recommendations"), status_code=500)


# ==========================================
# GET /cross-sell — Cross-Sell Widget
# ==========================================

@router.get("/cross-sell", response_class=HTMLResponse)
async def get_cross_sell_widget(
    request: Request,
    shop: str = Query("", description="Shopify store domain (added by Shopify App Proxy)"),
    product_id: str | None = Query(None, description="Product ID for cross-sell recommendations (required — only works on product pages)"),
    top: int = Query(4, description="Number of recommendations to show"),
    lookback_days: int = Query(30, description="Number of days to look back for order data"),
    device: str = Query("desktop", description="Target device: desktop, mobile"),
    # Group 1: Widget Container
    widget_bg_color: str = Query("#FFFFFF", description="Widget background color hex"),
    widget_padding: int = Query(16, description="Widget padding in pixels"),
    # Group 2: Widget Title
    widget_title: str = Query("", description="Custom widget title (empty = auto-default by widget type)"),
    title_color: str = Query("#111827", description="Widget title color hex"),
    title_size: int = Query(24, description="Widget title font-size in pixels"),
    title_alignment: str = Query("left", description="Widget title alignment: left, center"),
    # Group 3: Layout
    widget_style: str = Query("grid", description="Layout style: grid, carousel"),
    widget_columns: int = Query(4, description="Max columns at full width (2-6)"),
    gap: int = Query(16, description="Gap between cards in pixels"),
    card_min_width: int = Query(200, description="Min card width in pixels"),
    card_max_width: int = Query(0, description="Max card width in pixels (0 = no limit)"),
    # Group 4: Product Card
    card_bg_color: str = Query("#FFFFFF", description="Card background color hex"),
    card_border_radius: int = Query(8, description="Card border radius in pixels"),
    card_border_width: int = Query(0, description="Card border width in pixels"),
    card_border_color: str = Query("#E5E7EB", description="Card border color hex"),
    card_shadow: str = Query("md", description="Card shadow: none, sm, md, lg"),
    card_padding: int = Query(16, description="Card content padding in pixels"),
    card_hover: str = Query("lift", description="Card hover effect: none, lift, shadow, glow"),
    # Group 5: Product Image
    image_aspect_w: int = Query(1, description="Image aspect ratio width (e.g. 1, 3, 4, 16)"),
    image_aspect_h: int = Query(1, description="Image aspect ratio height (e.g. 1, 4, 5, 9)"),
    image_fit: str = Query("cover", description="Image fit: cover, contain"),
    image_radius: int = Query(8, description="Image border radius in pixels"),
    # Group 6: Product Title in Card
    product_title_color: str = Query("#1F2937", description="Product title color hex"),
    product_title_size: int = Query(14, description="Product title font-size in pixels"),
    product_title_weight: int = Query(600, description="CSS font-weight (100-900)"),
    product_title_lines: int = Query(2, description="Product title max lines: 1-3"),
    product_title_alignment: str = Query("left", description="Product title alignment: left, center"),
    # Group 7: Price
    show_price: bool = Query(True, description="Show product price"),
    price_color: str = Query("#111827", description="Price text color hex"),
    price_size: int = Query(18, description="Price font-size in pixels"),
    # Group 8: CTA Button
    button_text: str = Query("View", description="CTA button text"),
    button_bg_color: str = Query("#3B82F6", description="Button background color hex"),
    button_text_color: str = Query("#FFFFFF", description="Button text color hex"),
    button_radius: int = Query(6, description="Button border radius in pixels"),
    button_size: int = Query(14, description="Button font-size in pixels"),
    button_variant: str = Query("solid", description="Button variant: solid, outline, ghost"),
    button_full_width: bool = Query(False, description="Button full width"),
    db: AsyncSession = Depends(get_session),
):
    """
    Serve cross-sell recommendation widget HTML via Shopify App Proxy.

    Public endpoint — no JWT, no session token. Authenticated via Shopify HMAC
    signature in query params. Returns HTML for iframe rendering on storefront.

    This endpoint:
    1. Check product_id is present (only available on product pages)
    2. Verify HMAC-SHA256 signature from 'signature' query param
    3. Look up active Shopify connection by 'shop' domain
    4. Check entitlement (active subscription or free tier within limits)
    5. Get RecommendationSettings for shop URL configuration
    6. Create adapter + engine, check cache or generate cross-sell recommendations
    7. Generate HTML widget via generate_recommendation_html
    8. Return HTMLResponse for iframe rendering
    """
    try:
        # Sanitize string params — Shopify Theme Editor appends ?oseid=... to iframe URLs
        widget_bg_color = _sanitize_proxy_param(widget_bg_color)

        widget_title = _sanitize_proxy_param(widget_title)
        title_color = _sanitize_proxy_param(title_color)
        # title_size is int — no string sanitization needed
        title_alignment = _sanitize_proxy_param(title_alignment)
        widget_style = _sanitize_proxy_param(widget_style)
        card_bg_color = _sanitize_proxy_param(card_bg_color)
        # card_border_radius and card_border_width are int — no string sanitization needed
        card_border_color = _sanitize_proxy_param(card_border_color)
        card_shadow = _sanitize_proxy_param(card_shadow)
        card_hover = _sanitize_proxy_param(card_hover)
        image_fit = _sanitize_proxy_param(image_fit)
        # image_radius is int — no string sanitization needed
        product_title_color = _sanitize_proxy_param(product_title_color)
        # product_title_size, product_title_weight are int — no string sanitization needed
        product_title_alignment = _sanitize_proxy_param(product_title_alignment)
        price_color = _sanitize_proxy_param(price_color)
        # price_size is int — no string sanitization needed
        button_text = _sanitize_proxy_param(button_text)
        button_bg_color = _sanitize_proxy_param(button_bg_color)
        button_text_color = _sanitize_proxy_param(button_text_color)
        # button_radius, button_size are int — no string sanitization needed
        button_variant = _sanitize_proxy_param(button_variant)

        # Step 0: product_id required — only available on product pages
        if not product_id:
            return HTMLResponse(content=_error_html("Place this widget on a product page"), status_code=200)

        # Sanitize product_id
        product_id = _sanitize_proxy_param(product_id)

        # Step 1: Verify HMAC signature
        if not settings.SHOPIFY_CLIENT_SECRET:
            logger.error("App Proxy: SHOPIFY_CLIENT_SECRET not configured")
            return HTMLResponse(content=_error_html("Widget not available"), status_code=500)

        if not _verify_proxy_signature(request, settings.SHOPIFY_CLIENT_SECRET):
            logger.warning(f"App Proxy: HMAC verification failed for shop={shop}")
            return HTMLResponse(content=_error_html("Unauthorized"), status_code=401)

        # Step 2: Look up connection by shop domain
        connection = await _get_connection_by_shop(shop, db)
        if not connection:
            logger.warning(f"App Proxy: no active connection for shop={shop}")
            return HTMLResponse(content=_error_html("Widget not available"), status_code=404)

        # Step 3: Check entitlement (cached — avoids subscription DB query on every render)
        cached_status = await get_cached_service_status(connection.organization_id)
        if cached_status is not None:
            service_active = cached_status
        else:
            service_active = await is_service_active(connection.organization_id, db)
            await set_cached_service_status(connection.organization_id, service_active)
        if not service_active:
            logger.info(f"App Proxy: service inactive for shop={shop}, org_id={connection.organization_id}")
            return HTMLResponse(
                content=_error_html("Widget unavailable — subscription required"),
                status_code=403,
            )

        # Step 4: Get shop URL settings (cached — avoids settings DB query on every render)
        cached_settings = await get_cached_settings(connection.id)
        if cached_settings is not None:
            rec_settings = _settings_from_cache(cached_settings)
        else:
            settings_result = await db.execute(
                select(RecommendationSettings).where(
                    RecommendationSettings.connection_id == connection.id
                )
            )
            rec_settings = settings_result.scalar_one_or_none()
            await set_cached_settings(connection.id, _settings_to_dict(rec_settings))
        shop_urls = get_default_shop_urls(connection, rec_settings)

        # Apply visual defaults fallback chain: URL param → DB brand defaults → hardcoded
        vis = apply_visual_defaults(
            rec_settings,
            widget_bg_color=widget_bg_color, widget_padding=widget_padding,
            widget_title=widget_title, title_color=title_color, title_size=title_size, title_alignment=title_alignment,
            widget_style=widget_style, widget_columns=widget_columns, gap=gap, card_min_width=card_min_width, card_max_width=card_max_width,
            card_bg_color=card_bg_color, card_border_radius=card_border_radius, card_border_width=card_border_width,
            card_border_color=card_border_color, card_shadow=card_shadow, card_padding=card_padding, card_hover=card_hover,
            image_aspect_w=image_aspect_w, image_aspect_h=image_aspect_h, image_fit=image_fit, image_radius=image_radius,
            product_title_color=product_title_color, product_title_size=product_title_size,
            product_title_weight=product_title_weight, product_title_lines=product_title_lines,
            product_title_alignment=product_title_alignment,
            show_price=show_price, price_color=price_color, price_size=price_size,
            button_text=button_text, button_bg_color=button_bg_color, button_text_color=button_text_color,
            button_radius=button_radius, button_size=button_size, button_variant=button_variant,
            button_full_width=button_full_width,
        )

        # Step 5: Create adapter + engine, check cache or generate
        adapter = get_adapter(connection, db)
        engine = RecommendationEngine(adapter)

        cached = await get_cached_recommendations(
            connection.id, "cross_sell",
            product_id=product_id, limit=top, lookback_days=lookback_days,
        )
        if cached is not None:
            recs = cached
        else:
            recs = await engine.get_cross_sell(product_id=product_id, limit=top, lookback_days=lookback_days)
            await set_cached_recommendations(
                connection.id, "cross_sell", recs,
                product_id=product_id, limit=top, lookback_days=lookback_days,
            )

        # Step 6: Generate HTML widget
        html = generate_recommendation_html(
            recommendations=recs, vis=vis,
            rec_type="cross-sell", shop_urls=shop_urls,
        )

        # Step 7: Return HTMLResponse
        return HTMLResponse(content=html)

    except Exception as e:
        logger.error(f"App Proxy cross-sell error for shop={shop}: {str(e)}")
        return HTMLResponse(content=_error_html("Error loading recommendations"), status_code=500)


# ==========================================
# GET /upsell — Upsell Widget
# ==========================================

@router.get("/upsell", response_class=HTMLResponse)
async def get_upsell_widget(
    request: Request,
    shop: str = Query("", description="Shopify store domain (added by Shopify App Proxy)"),
    product_id: str | None = Query(None, description="Product ID for upsell recommendations (required — only works on product pages)"),
    top: int = Query(4, description="Number of recommendations to show"),
    min_price_increase_percent: int = Query(10, description="Minimum price increase percentage for upsell candidates"),
    device: str = Query("desktop", description="Target device: desktop, mobile"),
    # Group 1: Widget Container
    widget_bg_color: str = Query("#FFFFFF", description="Widget background color hex"),
    widget_padding: int = Query(16, description="Widget padding in pixels"),
    # Group 2: Widget Title
    widget_title: str = Query("", description="Custom widget title (empty = auto-default by widget type)"),
    title_color: str = Query("#111827", description="Widget title color hex"),
    title_size: int = Query(24, description="Widget title font-size in pixels"),
    title_alignment: str = Query("left", description="Widget title alignment: left, center"),
    # Group 3: Layout
    widget_style: str = Query("grid", description="Layout style: grid, carousel"),
    widget_columns: int = Query(4, description="Max columns at full width (2-6)"),
    gap: int = Query(16, description="Gap between cards in pixels"),
    card_min_width: int = Query(200, description="Min card width in pixels"),
    card_max_width: int = Query(0, description="Max card width in pixels (0 = no limit)"),
    # Group 4: Product Card
    card_bg_color: str = Query("#FFFFFF", description="Card background color hex"),
    card_border_radius: int = Query(8, description="Card border radius in pixels"),
    card_border_width: int = Query(0, description="Card border width in pixels"),
    card_border_color: str = Query("#E5E7EB", description="Card border color hex"),
    card_shadow: str = Query("md", description="Card shadow: none, sm, md, lg"),
    card_padding: int = Query(16, description="Card content padding in pixels"),
    card_hover: str = Query("lift", description="Card hover effect: none, lift, shadow, glow"),
    # Group 5: Product Image
    image_aspect_w: int = Query(1, description="Image aspect ratio width (e.g. 1, 3, 4, 16)"),
    image_aspect_h: int = Query(1, description="Image aspect ratio height (e.g. 1, 4, 5, 9)"),
    image_fit: str = Query("cover", description="Image fit: cover, contain"),
    image_radius: int = Query(8, description="Image border radius in pixels"),
    # Group 6: Product Title in Card
    product_title_color: str = Query("#1F2937", description="Product title color hex"),
    product_title_size: int = Query(14, description="Product title font-size in pixels"),
    product_title_weight: int = Query(600, description="CSS font-weight (100-900)"),
    product_title_lines: int = Query(2, description="Product title max lines: 1-3"),
    product_title_alignment: str = Query("left", description="Product title alignment: left, center"),
    # Group 7: Price
    show_price: bool = Query(True, description="Show product price"),
    price_color: str = Query("#111827", description="Price text color hex"),
    price_size: int = Query(18, description="Price font-size in pixels"),
    # Group 8: CTA Button
    button_text: str = Query("View", description="CTA button text"),
    button_bg_color: str = Query("#3B82F6", description="Button background color hex"),
    button_text_color: str = Query("#FFFFFF", description="Button text color hex"),
    button_radius: int = Query(6, description="Button border radius in pixels"),
    button_size: int = Query(14, description="Button font-size in pixels"),
    button_variant: str = Query("solid", description="Button variant: solid, outline, ghost"),
    button_full_width: bool = Query(False, description="Button full width"),
    db: AsyncSession = Depends(get_session),
):
    """
    Serve upsell recommendation widget HTML via Shopify App Proxy.

    Public endpoint — no JWT, no session token. Authenticated via Shopify HMAC
    signature in query params. Returns HTML for iframe rendering on storefront.

    This endpoint:
    1. Check product_id is present (only available on product pages)
    2. Verify HMAC-SHA256 signature from 'signature' query param
    3. Look up active Shopify connection by 'shop' domain
    4. Check entitlement (active subscription or free tier within limits)
    5. Get RecommendationSettings for shop URL configuration
    6. Create adapter + engine, check cache or generate upsell recommendations
    7. Generate HTML widget via generate_recommendation_html
    8. Return HTMLResponse for iframe rendering
    """
    try:
        # Sanitize string params — Shopify Theme Editor appends ?oseid=... to iframe URLs
        widget_bg_color = _sanitize_proxy_param(widget_bg_color)

        widget_title = _sanitize_proxy_param(widget_title)
        title_color = _sanitize_proxy_param(title_color)
        # title_size is int — no string sanitization needed
        title_alignment = _sanitize_proxy_param(title_alignment)
        widget_style = _sanitize_proxy_param(widget_style)
        card_bg_color = _sanitize_proxy_param(card_bg_color)
        # card_border_radius and card_border_width are int — no string sanitization needed
        card_border_color = _sanitize_proxy_param(card_border_color)
        card_shadow = _sanitize_proxy_param(card_shadow)
        card_hover = _sanitize_proxy_param(card_hover)
        image_fit = _sanitize_proxy_param(image_fit)
        # image_radius is int — no string sanitization needed
        product_title_color = _sanitize_proxy_param(product_title_color)
        # product_title_size, product_title_weight are int — no string sanitization needed
        product_title_alignment = _sanitize_proxy_param(product_title_alignment)
        price_color = _sanitize_proxy_param(price_color)
        # price_size is int — no string sanitization needed
        button_text = _sanitize_proxy_param(button_text)
        button_bg_color = _sanitize_proxy_param(button_bg_color)
        button_text_color = _sanitize_proxy_param(button_text_color)
        # button_radius, button_size are int — no string sanitization needed
        button_variant = _sanitize_proxy_param(button_variant)

        # Step 0: product_id required — only available on product pages
        if not product_id:
            return HTMLResponse(content=_error_html("Place this widget on a product page"), status_code=200)

        # Sanitize product_id
        product_id = _sanitize_proxy_param(product_id)

        # Step 1: Verify HMAC signature
        if not settings.SHOPIFY_CLIENT_SECRET:
            logger.error("App Proxy: SHOPIFY_CLIENT_SECRET not configured")
            return HTMLResponse(content=_error_html("Widget not available"), status_code=500)

        if not _verify_proxy_signature(request, settings.SHOPIFY_CLIENT_SECRET):
            logger.warning(f"App Proxy: HMAC verification failed for shop={shop}")
            return HTMLResponse(content=_error_html("Unauthorized"), status_code=401)

        # Step 2: Look up connection by shop domain
        connection = await _get_connection_by_shop(shop, db)
        if not connection:
            logger.warning(f"App Proxy: no active connection for shop={shop}")
            return HTMLResponse(content=_error_html("Widget not available"), status_code=404)

        # Step 3: Check entitlement (cached — avoids subscription DB query on every render)
        cached_status = await get_cached_service_status(connection.organization_id)
        if cached_status is not None:
            service_active = cached_status
        else:
            service_active = await is_service_active(connection.organization_id, db)
            await set_cached_service_status(connection.organization_id, service_active)
        if not service_active:
            logger.info(f"App Proxy: service inactive for shop={shop}, org_id={connection.organization_id}")
            return HTMLResponse(
                content=_error_html("Widget unavailable — subscription required"),
                status_code=403,
            )

        # Step 4: Get shop URL settings (cached — avoids settings DB query on every render)
        cached_settings = await get_cached_settings(connection.id)
        if cached_settings is not None:
            rec_settings = _settings_from_cache(cached_settings)
        else:
            settings_result = await db.execute(
                select(RecommendationSettings).where(
                    RecommendationSettings.connection_id == connection.id
                )
            )
            rec_settings = settings_result.scalar_one_or_none()
            await set_cached_settings(connection.id, _settings_to_dict(rec_settings))
        shop_urls = get_default_shop_urls(connection, rec_settings)

        # Apply visual defaults fallback chain: URL param → DB brand defaults → hardcoded
        vis = apply_visual_defaults(
            rec_settings,
            widget_bg_color=widget_bg_color, widget_padding=widget_padding,
            widget_title=widget_title, title_color=title_color, title_size=title_size, title_alignment=title_alignment,
            widget_style=widget_style, widget_columns=widget_columns, gap=gap, card_min_width=card_min_width, card_max_width=card_max_width,
            card_bg_color=card_bg_color, card_border_radius=card_border_radius, card_border_width=card_border_width,
            card_border_color=card_border_color, card_shadow=card_shadow, card_padding=card_padding, card_hover=card_hover,
            image_aspect_w=image_aspect_w, image_aspect_h=image_aspect_h, image_fit=image_fit, image_radius=image_radius,
            product_title_color=product_title_color, product_title_size=product_title_size,
            product_title_weight=product_title_weight, product_title_lines=product_title_lines,
            product_title_alignment=product_title_alignment,
            show_price=show_price, price_color=price_color, price_size=price_size,
            button_text=button_text, button_bg_color=button_bg_color, button_text_color=button_text_color,
            button_radius=button_radius, button_size=button_size, button_variant=button_variant,
            button_full_width=button_full_width,
        )

        # Step 5: Create adapter + engine, check cache or generate
        adapter = get_adapter(connection, db)
        engine = RecommendationEngine(adapter)

        cached = await get_cached_recommendations(
            connection.id, "upsell",
            product_id=product_id, limit=top, min_price_increase_percent=min_price_increase_percent,
        )
        if cached is not None:
            recs = cached
        else:
            recs = await engine.get_upsell(product_id=product_id, limit=top, min_price_increase_percent=min_price_increase_percent)
            await set_cached_recommendations(
                connection.id, "upsell", recs,
                product_id=product_id, limit=top, min_price_increase_percent=min_price_increase_percent,
            )

        # Step 6: Generate HTML widget
        html = generate_recommendation_html(
            recommendations=recs, vis=vis,
            rec_type="upsell", shop_urls=shop_urls,
        )

        # Step 7: Return HTMLResponse
        return HTMLResponse(content=html)

    except Exception as e:
        logger.error(f"App Proxy upsell error for shop={shop}: {str(e)}")
        return HTMLResponse(content=_error_html("Error loading recommendations"), status_code=500)


# ==========================================
# GET /similar — Similar Products Widget
# ==========================================

@router.get("/similar", response_class=HTMLResponse)
async def get_similar_widget(
    request: Request,
    shop: str = Query("", description="Shopify store domain (added by Shopify App Proxy)"),
    product_id: str | None = Query(None, description="Product ID for similar product recommendations (required — only works on product pages)"),
    top: int = Query(4, description="Number of recommendations to show"),
    device: str = Query("desktop", description="Target device: desktop, mobile"),
    # Group 1: Widget Container
    widget_bg_color: str = Query("#FFFFFF", description="Widget background color hex"),
    widget_padding: int = Query(16, description="Widget padding in pixels"),
    # Group 2: Widget Title
    widget_title: str = Query("", description="Custom widget title (empty = auto-default by widget type)"),
    title_color: str = Query("#111827", description="Widget title color hex"),
    title_size: int = Query(24, description="Widget title font-size in pixels"),
    title_alignment: str = Query("left", description="Widget title alignment: left, center"),
    # Group 3: Layout
    widget_style: str = Query("grid", description="Layout style: grid, carousel"),
    widget_columns: int = Query(4, description="Max columns at full width (2-6)"),
    gap: int = Query(16, description="Gap between cards in pixels"),
    card_min_width: int = Query(200, description="Min card width in pixels"),
    card_max_width: int = Query(0, description="Max card width in pixels (0 = no limit)"),
    # Group 4: Product Card
    card_bg_color: str = Query("#FFFFFF", description="Card background color hex"),
    card_border_radius: int = Query(8, description="Card border radius in pixels"),
    card_border_width: int = Query(0, description="Card border width in pixels"),
    card_border_color: str = Query("#E5E7EB", description="Card border color hex"),
    card_shadow: str = Query("md", description="Card shadow: none, sm, md, lg"),
    card_padding: int = Query(16, description="Card content padding in pixels"),
    card_hover: str = Query("lift", description="Card hover effect: none, lift, shadow, glow"),
    # Group 5: Product Image
    image_aspect_w: int = Query(1, description="Image aspect ratio width (e.g. 1, 3, 4, 16)"),
    image_aspect_h: int = Query(1, description="Image aspect ratio height (e.g. 1, 4, 5, 9)"),
    image_fit: str = Query("cover", description="Image fit: cover, contain"),
    image_radius: int = Query(8, description="Image border radius in pixels"),
    # Group 6: Product Title in Card
    product_title_color: str = Query("#1F2937", description="Product title color hex"),
    product_title_size: int = Query(14, description="Product title font-size in pixels"),
    product_title_weight: int = Query(600, description="CSS font-weight (100-900)"),
    product_title_lines: int = Query(2, description="Product title max lines: 1-3"),
    product_title_alignment: str = Query("left", description="Product title alignment: left, center"),
    # Group 7: Price
    show_price: bool = Query(True, description="Show product price"),
    price_color: str = Query("#111827", description="Price text color hex"),
    price_size: int = Query(18, description="Price font-size in pixels"),
    # Group 8: CTA Button
    button_text: str = Query("View", description="CTA button text"),
    button_bg_color: str = Query("#3B82F6", description="Button background color hex"),
    button_text_color: str = Query("#FFFFFF", description="Button text color hex"),
    button_radius: int = Query(6, description="Button border radius in pixels"),
    button_size: int = Query(14, description="Button font-size in pixels"),
    button_variant: str = Query("solid", description="Button variant: solid, outline, ghost"),
    button_full_width: bool = Query(False, description="Button full width"),
    db: AsyncSession = Depends(get_session),
):
    """
    Serve similar products recommendation widget HTML via Shopify App Proxy.

    Public endpoint — no JWT, no session token. Authenticated via Shopify HMAC
    signature in query params. Returns HTML for iframe rendering on storefront.

    This endpoint:
    1. Check product_id is present (only available on product pages)
    2. Verify HMAC-SHA256 signature from 'signature' query param
    3. Look up active Shopify connection by 'shop' domain
    4. Check entitlement (active subscription or free tier within limits)
    5. Get RecommendationSettings for shop URL configuration
    6. Create adapter + engine, check cache or generate similar product recommendations
    7. Generate HTML widget via generate_recommendation_html
    8. Return HTMLResponse for iframe rendering
    """
    try:
        # Sanitize string params — Shopify Theme Editor appends ?oseid=... to iframe URLs
        widget_bg_color = _sanitize_proxy_param(widget_bg_color)

        widget_title = _sanitize_proxy_param(widget_title)
        title_color = _sanitize_proxy_param(title_color)
        # title_size is int — no string sanitization needed
        title_alignment = _sanitize_proxy_param(title_alignment)
        widget_style = _sanitize_proxy_param(widget_style)
        card_bg_color = _sanitize_proxy_param(card_bg_color)
        # card_border_radius and card_border_width are int — no string sanitization needed
        card_border_color = _sanitize_proxy_param(card_border_color)
        card_shadow = _sanitize_proxy_param(card_shadow)
        card_hover = _sanitize_proxy_param(card_hover)
        image_fit = _sanitize_proxy_param(image_fit)
        # image_radius is int — no string sanitization needed
        product_title_color = _sanitize_proxy_param(product_title_color)
        # product_title_size, product_title_weight are int — no string sanitization needed
        product_title_alignment = _sanitize_proxy_param(product_title_alignment)
        price_color = _sanitize_proxy_param(price_color)
        # price_size is int — no string sanitization needed
        button_text = _sanitize_proxy_param(button_text)
        button_bg_color = _sanitize_proxy_param(button_bg_color)
        button_text_color = _sanitize_proxy_param(button_text_color)
        # button_radius, button_size are int — no string sanitization needed
        button_variant = _sanitize_proxy_param(button_variant)

        # Step 0: product_id required — only available on product pages
        if not product_id:
            return HTMLResponse(content=_error_html("Place this widget on a product page"), status_code=200)

        # Sanitize product_id
        product_id = _sanitize_proxy_param(product_id)

        # Step 1: Verify HMAC signature
        if not settings.SHOPIFY_CLIENT_SECRET:
            logger.error("App Proxy: SHOPIFY_CLIENT_SECRET not configured")
            return HTMLResponse(content=_error_html("Widget not available"), status_code=500)

        if not _verify_proxy_signature(request, settings.SHOPIFY_CLIENT_SECRET):
            logger.warning(f"App Proxy: HMAC verification failed for shop={shop}")
            return HTMLResponse(content=_error_html("Unauthorized"), status_code=401)

        # Step 2: Look up connection by shop domain
        connection = await _get_connection_by_shop(shop, db)
        if not connection:
            logger.warning(f"App Proxy: no active connection for shop={shop}")
            return HTMLResponse(content=_error_html("Widget not available"), status_code=404)

        # Step 3: Check entitlement (cached — avoids subscription DB query on every render)
        cached_status = await get_cached_service_status(connection.organization_id)
        if cached_status is not None:
            service_active = cached_status
        else:
            service_active = await is_service_active(connection.organization_id, db)
            await set_cached_service_status(connection.organization_id, service_active)
        if not service_active:
            logger.info(f"App Proxy: service inactive for shop={shop}, org_id={connection.organization_id}")
            return HTMLResponse(
                content=_error_html("Widget unavailable — subscription required"),
                status_code=403,
            )

        # Step 4: Get shop URL settings (cached — avoids settings DB query on every render)
        cached_settings = await get_cached_settings(connection.id)
        if cached_settings is not None:
            rec_settings = _settings_from_cache(cached_settings)
        else:
            settings_result = await db.execute(
                select(RecommendationSettings).where(
                    RecommendationSettings.connection_id == connection.id
                )
            )
            rec_settings = settings_result.scalar_one_or_none()
            await set_cached_settings(connection.id, _settings_to_dict(rec_settings))
        shop_urls = get_default_shop_urls(connection, rec_settings)

        # Apply visual defaults fallback chain: URL param → DB brand defaults → hardcoded
        vis = apply_visual_defaults(
            rec_settings,
            widget_bg_color=widget_bg_color, widget_padding=widget_padding,
            widget_title=widget_title, title_color=title_color, title_size=title_size, title_alignment=title_alignment,
            widget_style=widget_style, widget_columns=widget_columns, gap=gap, card_min_width=card_min_width, card_max_width=card_max_width,
            card_bg_color=card_bg_color, card_border_radius=card_border_radius, card_border_width=card_border_width,
            card_border_color=card_border_color, card_shadow=card_shadow, card_padding=card_padding, card_hover=card_hover,
            image_aspect_w=image_aspect_w, image_aspect_h=image_aspect_h, image_fit=image_fit, image_radius=image_radius,
            product_title_color=product_title_color, product_title_size=product_title_size,
            product_title_weight=product_title_weight, product_title_lines=product_title_lines,
            product_title_alignment=product_title_alignment,
            show_price=show_price, price_color=price_color, price_size=price_size,
            button_text=button_text, button_bg_color=button_bg_color, button_text_color=button_text_color,
            button_radius=button_radius, button_size=button_size, button_variant=button_variant,
            button_full_width=button_full_width,
        )

        # Step 5: Create adapter + engine, check cache or generate
        adapter = get_adapter(connection, db)
        engine = RecommendationEngine(adapter)

        cached = await get_cached_recommendations(
            connection.id, "similar",
            product_id=product_id, limit=top,
        )
        if cached is not None:
            recs = cached
        else:
            recs = await engine.get_similar(product_id=product_id, limit=top)
            await set_cached_recommendations(
                connection.id, "similar", recs,
                product_id=product_id, limit=top,
            )

        # Step 6: Generate HTML widget
        html = generate_recommendation_html(
            recommendations=recs, vis=vis,
            rec_type="similar", shop_urls=shop_urls,
        )

        # Step 7: Return HTMLResponse
        return HTMLResponse(content=html)

    except Exception as e:
        logger.error(f"App Proxy similar error for shop={shop}: {str(e)}")
        return HTMLResponse(content=_error_html("Error loading recommendations"), status_code=500)
