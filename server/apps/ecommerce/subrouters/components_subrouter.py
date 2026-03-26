from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List, Dict
from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user
from ..models import EcommerceConnection, RecommendationSettings, IngestedProduct
from ..schemas.ecommerce_connection_schemas import PlatformType
from ..schemas.recommendation_schemas import BestsellerMethod
from ..adapters.factory import get_adapter
from ..engine.engine import RecommendationEngine
from ..utils.dependency_utils import get_active_connection, enforce_monthly_order_limit
from ..utils.cache_utils import get_cached_recommendations, set_cached_recommendations

router = APIRouter(
    prefix="/components",
    tags=["Product Component Recommendations"],
    dependencies=[Depends(enforce_monthly_order_limit)],
)


# ==========================================
# CSS Value Maps — Tailwind classes for enum-based settings
# Size fields (title_size, product_title_size, etc.) use inline px values directly.
# ==========================================

CARD_SHADOW_MAP = {
    "none": "",
    "sm": "shadow-sm",
    "md": "shadow-md",
    "lg": "shadow-lg",
}

CARD_HOVER_MAP = {
    "none": "",
    "lift": "hover:-translate-y-1",
    "shadow": "hover:shadow-xl",
    "glow": "hover:shadow-lg hover:shadow-blue-200/50",
}

def _generate_carousel_css(columns: int, gap_px: int, min_width: int, max_width: int) -> str:
    """
    Generate carousel card CSS.

    - flex-basis: calc((100% - total_gaps) / columns) — merchant's intended layout
    - min-width: prevents cards from shrinking below usable size on narrow screens
    - max-width: prevents cards from growing too large (e.g. columns=1 on wide screen)
    - When container is too narrow for N cards at min-width, overflow kicks in
      and scroll appears naturally — that's what makes it a real carousel
    """
    basis = f"calc((100% - {gap_px * (columns - 1)}px) / {columns})"
    max_width_css = f"max-width: {max_width}px;" if max_width > 0 else ""

    return f"""
        .nudgio-carousel-card {{
            flex: 0 0 {basis};
            min-width: {min_width}px;
            {max_width_css}
            scroll-snap-align: start;
        }}
    """


def _generate_grid_style(columns: int, min_width: int, max_width: int, gap_px: int) -> str:
    """
    Generate inline CSS grid style.

    columns=1: single column, optionally capped by max-width.
    columns>=2: auto-fit + minmax — responsive grid that collapses on narrow containers.
    auto-fit (not auto-fill): collapses empty tracks so cards expand to fill full width
    when there are fewer items than the container could fit.
    """
    max_col = f"minmax(0, {max_width}px)" if max_width > 0 else "1fr"
    if columns == 1:
        return f"display: grid; grid-template-columns: repeat(1, {max_col}); justify-content: center; gap: {gap_px}px;"
    if max_width > 0:
        return f"display: grid; grid-template-columns: repeat(auto-fit, minmax(min({min_width}px, 100%), {max_width}px)); justify-content: center; gap: {gap_px}px;"
    return f"display: grid; grid-template-columns: repeat(auto-fit, minmax(min({min_width}px, 100%), 1fr)); gap: {gap_px}px;"


# NOTE: All widget endpoints accept a `device` query param ("desktop", "mobile") which is
# currently unused in rendering logic — CSS responsiveness via @media queries inside the
# iframe handles device adaptation. Decided to keep this param (not remove as dead code).
# May be used for server-side device-specific rendering in the future.
# Same param exists in widget_subrouter.py, shopify_app_proxy_subrouter.py, and
# shopify_embedded_subrouter.py.


# ==========================================
# Hardcoded Visual Defaults — single source of truth
# URL param name = DB column name (no mapping table needed).
# ==========================================

VISUAL_DEFAULTS = {
    # Group 1: Widget Container
    "widget_bg_color": "#FFFFFF",
    "widget_padding": 16,
    # Group 2: Widget Title
    "widget_title": "",
    "title_color": "#111827",
    "title_size": 24,
    "title_alignment": "left",
    # Group 3: Layout
    "widget_style": "grid",
    "widget_columns": 4,
    "gap": 16,
    "card_min_width": 200,
    "card_max_width": 0,  # 0 = no limit (merchant controls via container)
    # Group 4: Product Card
    "card_bg_color": "#FFFFFF",
    "card_border_radius": 8,
    "card_border_width": 0,
    "card_border_color": "#E5E7EB",
    "card_shadow": "md",
    "card_padding": 16,
    "card_hover": "lift",
    # Group 5: Product Image
    "image_aspect_w": 1,
    "image_aspect_h": 1,
    "image_fit": "cover",
    "image_radius": 8,
    # Group 6: Product Title in Card
    "product_title_color": "#1F2937",
    "product_title_size": 14,
    "product_title_weight": 600,
    "product_title_lines": 2,
    "product_title_alignment": "left",
    # Group 7: Price
    "show_price": True,
    "price_color": "#111827",
    "price_size": 18,
    # Group 8: CTA Button
    "button_text": "View",
    "button_bg_color": "#3B82F6",
    "button_text_color": "#FFFFFF",
    "button_radius": 6,
    "button_size": 14,
    "button_variant": "solid",
    "button_full_width": False,
}


def apply_visual_defaults(
    settings,
    **url_params,
) -> Dict[str, any]:
    """
    Apply the fallback chain: URL param (explicit) → DB brand defaults → hardcoded defaults.

    For each visual parameter:
    - URL value != hardcoded default → user explicitly set it → use URL value
    - URL value == hardcoded default AND DB has value → use DB value
    - URL value == hardcoded default AND DB is None → keep hardcoded default

    URL param name = DB column name (no mapping table needed).
    Returns a dict with resolved values keyed by setting names.
    """
    resolved = {}
    for param_name, url_val in url_params.items():
        hardcoded = VISUAL_DEFAULTS.get(param_name)

        # Unknown param — skip (safety guard)
        if hardcoded is None:
            resolved[param_name] = url_val
            continue

        if url_val != hardcoded:
            # URL value differs from hardcoded → user explicitly set it → use URL value
            resolved[param_name] = url_val
        elif settings is not None and getattr(settings, param_name, None) is not None:
            # URL value matches hardcoded AND DB has a saved value → use DB value
            resolved[param_name] = getattr(settings, param_name)
        else:
            # URL value matches hardcoded AND DB is None → keep hardcoded default
            resolved[param_name] = hardcoded

    return resolved


def get_default_shop_urls(connection: EcommerceConnection, settings: Optional[RecommendationSettings]) -> Dict[str, str]:
    """Get shop URLs from settings or defaults by platform"""
    if settings and settings.shop_base_url and settings.product_url_template:
        return {
            "base_url": settings.shop_base_url,
            "product_template": settings.product_url_template
        }

    # Strip protocol from store_url if already present (store_url is stored as "https://domain.com")
    raw_host = connection.store_url or connection.db_host or ""
    raw_host = raw_host.removeprefix("https://").removeprefix("http://").rstrip("/")

    # Default URL patterns by platform
    defaults = {
        PlatformType.SHOPIFY.value: {
            "base_url": f"https://{raw_host}",  # Shopify store domain
            "product_template": "/products/{handle}"
        },
        PlatformType.WOOCOMMERCE.value: {
            "base_url": f"https://{raw_host}",  # WordPress site domain
            "product_template": "/product/{handle}"
        },
        PlatformType.MAGENTO.value: {
            "base_url": f"https://{raw_host}",  # Magento store domain
            "product_template": "/catalog/product/view/id/{id}"
        }
    }

    return defaults.get(connection.platform, {
        "base_url": f"https://{raw_host}",
        "product_template": "/products/{handle}"
    })


async def _check_ingest_has_data(connection: EcommerceConnection, session: AsyncSession) -> Optional[JSONResponse]:
    """
    Check if an ingest connection has ingested data (products).

    For ingest connections with zero products, returns a JSON response
    with waiting_for_data status instead of letting the engine fail
    with a cryptic error.

    Returns:
        JSONResponse if no data (caller should return it), None if data exists
    """
    if connection.connection_method != "ingest":
        return None

    result = await session.execute(
        select(func.count()).select_from(IngestedProduct).where(
            IngestedProduct.connection_id == connection.id
        )
    )
    product_count = result.scalar() or 0

    if product_count == 0:
        return JSONResponse(
            status_code=200,
            content={
                "status": "waiting_for_data",
                "message": "Connection is active but no data has been ingested yet. Push product and order data via the API to generate recommendations.",
            },
        )

    return None


@router.get("/bestsellers", response_class=HTMLResponse)
async def get_bestsellers_component(
    connection_id: int = Query(..., description="Connection ID to use for recommendations"),
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
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get bestsellers HTML component"""
    try:
        connection = await get_active_connection(connection_id, current_user.id, session)

        # Check if ingest connection has data before attempting recommendations
        no_data_response = await _check_ingest_has_data(connection, session)
        if no_data_response:
            return no_data_response

        # Get shop URL settings
        settings_result = await session.execute(
            select(RecommendationSettings).where(
                RecommendationSettings.connection_id == connection_id
            )
        )
        settings = settings_result.scalar_one_or_none()

        # Default URLs by platform if not configured
        shop_urls = get_default_shop_urls(connection, settings)

        # Apply visual defaults fallback chain: URL param → DB brand defaults → hardcoded
        vis = apply_visual_defaults(
            settings,
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

        adapter = get_adapter(connection, session)
        engine = RecommendationEngine(adapter)

        # Check cache first
        cached = await get_cached_recommendations(
            connection_id, "bestseller",
            limit=top, method=method, lookback_days=lookback_days,
        )
        if cached is not None:
            recs = cached
        else:
            # Generate bestseller recommendations (cache miss)
            method_enum = BestsellerMethod(method) if method in [m.value for m in BestsellerMethod] else BestsellerMethod.VOLUME
            recs = await engine.get_bestsellers(limit=top, lookback_days=lookback_days, method=method_enum)
            # Cache for next request
            await set_cached_recommendations(
                connection_id, "bestseller", recs,
                limit=top, method=method, lookback_days=lookback_days,
            )

        # Generate HTML component
        html = generate_recommendation_html(
            recommendations=recs, vis=vis,
            rec_type="bestseller", shop_urls=shop_urls,
        )

        return HTMLResponse(content=html)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating component: {str(e)}")


@router.get("/cross-sell", response_class=HTMLResponse)
async def get_cross_sell_component(
    connection_id: int = Query(..., description="Connection ID to use for recommendations"),
    product_id: str = Query(..., description="Product ID for cross-sell recommendations"),
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
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get cross-sell HTML component"""
    try:
        connection = await get_active_connection(connection_id, current_user.id, session)

        # Check if ingest connection has data before attempting recommendations
        no_data_response = await _check_ingest_has_data(connection, session)
        if no_data_response:
            return no_data_response

        # Get shop URL settings
        settings_result = await session.execute(
            select(RecommendationSettings).where(
                RecommendationSettings.connection_id == connection_id
            )
        )
        settings = settings_result.scalar_one_or_none()

        # Default URLs by platform if not configured
        shop_urls = get_default_shop_urls(connection, settings)

        # Apply visual defaults fallback chain: URL param → DB brand defaults → hardcoded
        vis = apply_visual_defaults(
            settings,
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

        adapter = get_adapter(connection, session)
        engine = RecommendationEngine(adapter)

        # Check cache first
        cached = await get_cached_recommendations(
            connection_id, "cross_sell",
            product_id=product_id, limit=top, lookback_days=lookback_days,
        )
        if cached is not None:
            recs = cached
        else:
            # Generate cross-sell recommendations (cache miss)
            recs = await engine.get_cross_sell(product_id=product_id, limit=top, lookback_days=lookback_days)
            # Cache for next request
            await set_cached_recommendations(
                connection_id, "cross_sell", recs,
                product_id=product_id, limit=top, lookback_days=lookback_days,
            )

        # Generate HTML component
        html = generate_recommendation_html(
            recommendations=recs, vis=vis,
            rec_type="cross-sell", shop_urls=shop_urls,
        )

        return HTMLResponse(content=html)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating component: {str(e)}")


@router.get("/upsell", response_class=HTMLResponse)
async def get_upsell_component(
    connection_id: int = Query(..., description="Connection ID to use for recommendations"),
    product_id: str = Query(..., description="Product ID for upsell recommendations"),
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
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get upsell HTML component"""
    try:
        connection = await get_active_connection(connection_id, current_user.id, session)

        # Check if ingest connection has data before attempting recommendations
        no_data_response = await _check_ingest_has_data(connection, session)
        if no_data_response:
            return no_data_response

        # Get shop URL settings
        settings_result = await session.execute(
            select(RecommendationSettings).where(
                RecommendationSettings.connection_id == connection_id
            )
        )
        settings = settings_result.scalar_one_or_none()

        # Default URLs by platform if not configured
        shop_urls = get_default_shop_urls(connection, settings)

        # Apply visual defaults fallback chain: URL param → DB brand defaults → hardcoded
        vis = apply_visual_defaults(
            settings,
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

        adapter = get_adapter(connection, session)
        engine = RecommendationEngine(adapter)

        # Check cache first
        cached = await get_cached_recommendations(
            connection_id, "upsell",
            product_id=product_id, limit=top, min_price_increase_percent=min_price_increase_percent,
        )
        if cached is not None:
            recs = cached
        else:
            # Generate upsell recommendations (cache miss)
            recs = await engine.get_upsell(product_id=product_id, limit=top, min_price_increase_percent=min_price_increase_percent)
            # Cache for next request
            await set_cached_recommendations(
                connection_id, "upsell", recs,
                product_id=product_id, limit=top, min_price_increase_percent=min_price_increase_percent,
            )

        # Generate HTML component
        html = generate_recommendation_html(
            recommendations=recs, vis=vis,
            rec_type="upsell", shop_urls=shop_urls,
        )

        return HTMLResponse(content=html)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating component: {str(e)}")


@router.get("/similar", response_class=HTMLResponse)
async def get_similar_component(
    connection_id: int = Query(..., description="Connection ID to use for recommendations"),
    product_id: str = Query(..., description="Product ID for similar product recommendations"),
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
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get similar products HTML component"""
    try:
        connection = await get_active_connection(connection_id, current_user.id, session)

        # Check if ingest connection has data before attempting recommendations
        no_data_response = await _check_ingest_has_data(connection, session)
        if no_data_response:
            return no_data_response

        # Get shop URL settings
        settings_result = await session.execute(
            select(RecommendationSettings).where(
                RecommendationSettings.connection_id == connection_id
            )
        )
        settings = settings_result.scalar_one_or_none()

        # Default URLs by platform if not configured
        shop_urls = get_default_shop_urls(connection, settings)

        # Apply visual defaults fallback chain: URL param → DB brand defaults → hardcoded
        vis = apply_visual_defaults(
            settings,
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

        adapter = get_adapter(connection, session)
        engine = RecommendationEngine(adapter)

        # Check cache first
        cached = await get_cached_recommendations(
            connection_id, "similar",
            product_id=product_id, limit=top,
        )
        if cached is not None:
            recs = cached
        else:
            # Generate similar product recommendations (cache miss)
            recs = await engine.get_similar(product_id=product_id, limit=top)
            # Cache for next request
            await set_cached_recommendations(
                connection_id, "similar", recs,
                product_id=product_id, limit=top,
            )

        # Generate HTML component
        html = generate_recommendation_html(
            recommendations=recs, vis=vis,
            rec_type="similar", shop_urls=shop_urls,
        )

        return HTMLResponse(content=html)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating component: {str(e)}")


def generate_recommendation_html(
    recommendations: List[Dict],
    vis: Dict[str, any],
    rec_type: str,
    shop_urls: Dict[str, str],
) -> str:
    """
    Generate HTML component with embedded Tailwind CSS.

    This function receives a resolved `vis` dict (output of apply_visual_defaults)
    containing all 35 visual settings. Individual CSS classes are looked up from
    the per-element CSS value maps defined above.
    """

    # Empty results → return hidden empty div (nothing visible on the storefront)
    if not recommendations:
        return "<div style='display:none'></div>"

    # Server-side validation: clamp columns to 1–6
    columns = max(1, min(6, vis["widget_columns"]))

    # Backward compat: treat legacy "card" style as "grid"
    style = vis["widget_style"]
    if style == "card":
        style = "grid"

    # Widget title: use custom title if provided, otherwise auto-default by rec_type
    title_map = {
        "bestseller": "Popular now",
        "cross-sell": "Frequently bought together",
        "upsell": "You might like these too",
        "similar": "You may also like"
    }
    title = vis["widget_title"] if vis["widget_title"] else title_map.get(rec_type, "Recommended for you")

    # Resolve CSS values (with safe fallbacks)
    widget_padding_px = int(vis["widget_padding"])
    title_align = "text-center" if vis["title_alignment"] == "center" else "text-left"
    gap_px = int(vis["gap"])
    aspect_w = int(vis["image_aspect_w"])
    aspect_h = int(vis["image_aspect_h"])

    # Product title line clamp: clamp value to 1-3
    product_title_lines = max(1, min(3, vis["product_title_lines"]))

    # CSS grid/carousel — responds to actual container width, not viewport
    # Works correctly inside iframes (WordPress shortcode, Shopify App Proxy, standalone embed)
    min_width = int(vis["card_min_width"])
    max_width = int(vis["card_max_width"])
    grid_style = _generate_grid_style(columns, min_width, max_width, gap_px)

    # Generate product cards based on style
    carousel_css = ""
    if style == "carousel":
        cards_html = generate_carousel_cards(recommendations, vis, shop_urls)
        carousel_css = _generate_carousel_css(columns, gap_px, min_width, max_width)
        container_attr = f'class="nudgio-carousel"'
    else:
        # "grid" or any other value — auto-fill responsive grid
        cards_html = generate_grid_cards(recommendations, vis, shop_urls)
        container_attr = f'style="{grid_style}"'

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            .line-clamp-custom {{
                display: -webkit-box;
                -webkit-line-clamp: {product_title_lines};
                -webkit-box-orient: vertical;
                overflow: hidden;
            }}
            .nudgio-carousel {{
                display: flex;
                overflow-x: auto;
                scroll-snap-type: x mandatory;
                -webkit-overflow-scrolling: touch;
                gap: {gap_px}px;
                padding-bottom: 16px;
                -ms-overflow-style: none;
                scrollbar-width: none;
            }}
            .nudgio-carousel::-webkit-scrollbar {{
                display: none;
            }}
            {carousel_css}
        </style>
    </head>
    <body style="background-color: {vis['widget_bg_color']}; margin: 0; overflow: hidden;">
        <div class="w-full" style="padding: {widget_padding_px}px;">
            <h3 class="mb-4 {title_align}" style="font-size: {vis['title_size']}px; font-weight: 700; color: {vis['title_color']}">{title}</h3>
            <div {container_attr}>
                {cards_html}
            </div>
        </div>

        <script>
            // Report content height to parent frame for auto-resize (iframe embedding)
            // Uses multiple strategies: load event, image loads, ResizeObserver, and delayed fallback
            // to ensure the iframe height matches content after Tailwind CDN + images finish rendering
            function reportHeight() {{
                const height = document.body.scrollHeight + 2;
                window.parent.postMessage({{ type: 'nudgio-resize', height: height }}, '*');
            }}

            // Strategy 1: On initial load (Tailwind CDN may not have applied styles yet)
            window.addEventListener('load', reportHeight);

            // Strategy 2: After images finish loading (they change content height)
            document.querySelectorAll('img').forEach(img => {{
                if (!img.complete) {{
                    img.addEventListener('load', reportHeight);
                    img.addEventListener('error', reportHeight);
                }}
            }});

            // Strategy 3: Delayed fallback — catches Tailwind CDN late processing
            setTimeout(reportHeight, 500);
            setTimeout(reportHeight, 1500);

            // Strategy 4: ResizeObserver — catches any future layout shifts
            if (typeof ResizeObserver !== 'undefined') {{
                new ResizeObserver(reportHeight).observe(document.body);
            }}

            // Track recommendation clicks
            document.querySelectorAll('[data-rec-click]').forEach(el => {{
                el.addEventListener('click', (e) => {{
                    const productId = e.target.dataset.productId;
                    const position = e.target.dataset.position;
                    const recType = '{rec_type}';

                    // Send analytics (optional - implement analytics endpoint)
                    fetch('/api/analytics/click', {{
                        method: 'POST',
                        headers: {{'Content-Type': 'application/json'}},
                        body: JSON.stringify({{
                            product_id: productId,
                            rec_type: recType,
                            position: parseInt(position),
                            timestamp: new Date().toISOString()
                        }})
                    }}).catch(err => console.log('Analytics failed:', err));

                    // Redirect to product page
                    const productUrl = e.target.dataset.productUrl;
                    if (productUrl) {{
                        window.open(productUrl, '_blank');
                    }}
                }});
            }});
        </script>
    </body>
    </html>
    """

    return html


def _build_product_url(shop_urls: Dict[str, str], handle: str, product_id: str) -> str:
    """
    Build product URL from shop URL template and product data.

    Normalizes slashes to prevent double-slash (https://site.com//products/...)
    or missing-slash (https://site.comproducts/...) regardless of how the
    merchant entered base_url and product_url_template in settings.
    """
    if shop_urls.get("product_template") and shop_urls.get("base_url"):
        # Normalize: strip trailing slash from base, ensure leading slash on template
        base = shop_urls["base_url"].rstrip("/")
        template = shop_urls["product_template"]
        if not template.startswith("/"):
            template = "/" + template

        if "{handle}" in template and handle:
            return base + template.format(handle=handle)
        elif "{id}" in template and product_id:
            return base + template.format(id=product_id)
        else:
            return base
    return "#"


def _build_button_html(vis: Dict[str, any], product_id: str, position, handle: str, product_url: str) -> str:
    """
    Build CTA button HTML with variant support (solid/outline/ghost).

    Variants:
    - solid: filled background, white text (default)
    - outline: transparent bg, colored border + text
    - ghost: transparent bg, colored text, no border
    """
    # Derive button padding from font-size: padding-y = round(fontSize / 2), padding-x = fontSize
    btn_py = round(vis["button_size"] / 2)
    btn_px = vis["button_size"]
    width_class = "w-full" if vis["button_full_width"] else ""
    variant = vis["button_variant"]

    # Variant-specific inline styles
    if variant == "outline":
        style = f"color: {vis['button_bg_color']}; border: 2px solid {vis['button_bg_color']}; background: transparent; border-radius: {vis['button_radius']}px; font-size: {vis['button_size']}px; padding: {btn_py}px {btn_px}px"
    elif variant == "ghost":
        style = f"color: {vis['button_bg_color']}; background: transparent; border: none; border-radius: {vis['button_radius']}px; font-size: {vis['button_size']}px; padding: {btn_py}px {btn_px}px"
    else:
        # solid (default)
        style = f"background-color: {vis['button_bg_color']}; color: {vis['button_text_color']}; border-radius: {vis['button_radius']}px; font-size: {vis['button_size']}px; padding: {btn_py}px {btn_px}px"

    return f"""
                    <button data-rec-click
                            data-product-id="{product_id}"
                            data-position="{position}"
                            data-handle="{handle}"
                            data-product-url="{product_url}"
                            class="{width_class} font-medium hover:opacity-90 transition-opacity"
                            style="{style}">
                        {vis['button_text']}
                    </button>"""


def generate_grid_cards(recommendations: List[Dict], vis: Dict[str, any], shop_urls: Dict[str, str]) -> str:
    """Generate responsive grid product cards using individual visual settings."""
    cards = []

    # Resolve CSS classes and inline values from vis dict
    shadow_class = CARD_SHADOW_MAP.get(vis["card_shadow"], CARD_SHADOW_MAP["md"])
    card_padding_px = int(vis["card_padding"])
    hover_class = CARD_HOVER_MAP.get(vis["card_hover"], CARD_HOVER_MAP["lift"])
    aspect_w = int(vis["image_aspect_w"])
    aspect_h = int(vis["image_aspect_h"])
    title_align = "text-center" if vis["product_title_alignment"] == "center" else "text-left"

    # Card border: only add border style if width > 0
    border_style = ""
    if vis["card_border_width"] != 0:
        border_style = f"border: {vis['card_border_width']}px solid {vis['card_border_color']};"

    for rec in recommendations:
        # Handle different data structures from engine
        product_id = rec.get('id') or rec.get('product_id', '')
        title = rec.get('title') or rec.get('name', 'Product Name')
        price = rec.get('price', '0.00')
        handle = rec.get('handle', '')
        position = rec.get('position', 1)
        image_url = rec.get('image_url', '')

        product_url = _build_product_url(shop_urls, handle, product_id)

        # Conditionally render price span
        price_html = f'<span style="font-size: {vis["price_size"]}px; font-weight: 700; color: {vis["price_color"]}">${float(price):.2f}</span>' if vis["show_price"] else ''

        # Build button HTML with variant support
        button_html = _build_button_html(vis, product_id, position, handle, product_url)

        # Button container: if full width, stack vertically; otherwise flex row
        if vis["button_full_width"]:
            footer_html = f"""
                <div class="mt-auto">
                    {price_html}
                    {button_html}
                </div>"""
        else:
            footer_html = f"""
                <div class="flex items-center justify-between mt-auto">
                    {price_html}
                    {button_html}
                </div>"""

        card = f"""
        <div class="w-full flex flex-col {shadow_class} {hover_class} transition-all duration-300 transform overflow-hidden"
             style="border-radius: {vis['card_border_radius']}px; background-color: {vis['card_bg_color']}; {border_style}">
            <div class="bg-gray-100 overflow-hidden" style="aspect-ratio: {aspect_w}/{aspect_h}; border-radius: {vis['image_radius']}px {vis['image_radius']}px 0 0;">
                <img src="{image_url or 'https://via.placeholder.com/300x300?text=No+Image'}"
                     alt="{title}"
                     class="w-full h-full object-{vis['image_fit']} hover:scale-105 transition-transform duration-300"
                     loading="lazy">
            </div>
            <div class="flex flex-col flex-1" style="padding: {card_padding_px}px;">
                <h4 style="font-size: {vis['product_title_size']}px; font-weight: {vis['product_title_weight']}; color: {vis['product_title_color']}" class="{title_align} mb-2 line-clamp-custom">
                    {title}
                </h4>
                {footer_html}
            </div>
        </div>
        """
        cards.append(card)

    return ''.join(cards)


def generate_carousel_cards(recommendations: List[Dict], vis: Dict[str, any], shop_urls: Dict[str, str]) -> str:
    """Generate carousel product cards using individual visual settings."""
    cards = []

    # Resolve CSS classes and inline values from vis dict
    shadow_class = CARD_SHADOW_MAP.get(vis["card_shadow"], CARD_SHADOW_MAP["md"])
    card_padding_px = int(vis["card_padding"])
    aspect_w = int(vis["image_aspect_w"])
    aspect_h = int(vis["image_aspect_h"])
    title_align = "text-center" if vis["product_title_alignment"] == "center" else "text-left"

    # Card border: only add border style if width > 0
    border_style = ""
    if vis["card_border_width"] != 0:
        border_style = f"border: {vis['card_border_width']}px solid {vis['card_border_color']};"

    for rec in recommendations:
        product_id = rec.get('id') or rec.get('product_id', '')
        title = rec.get('title') or rec.get('name', 'Product Name')
        price = rec.get('price', '0.00')
        handle = rec.get('handle', '')
        position = rec.get('position', 1)
        image_url = rec.get('image_url', '')

        product_url = _build_product_url(shop_urls, handle, product_id)

        # Conditionally render price span
        price_html = f'<span style="font-size: {vis["price_size"]}px; font-weight: 700; color: {vis["price_color"]}">${float(price):.2f}</span>' if vis["show_price"] else ''

        # Build button HTML with variant support
        button_html = _build_button_html(vis, product_id, position, handle, product_url)

        # Button container: if full width, stack vertically; otherwise flex row
        if vis["button_full_width"]:
            footer_html = f"""
                <div class="mt-auto">
                    {price_html}
                    {button_html}
                </div>"""
        else:
            footer_html = f"""
                <div class="flex items-center justify-between mt-auto">
                    {price_html}
                    {button_html}
                </div>"""

        card = f"""
        <div class="nudgio-carousel-card flex flex-col {shadow_class} transition-all duration-300 overflow-hidden"
             style="border-radius: {vis['card_border_radius']}px; background-color: {vis['card_bg_color']}; {border_style}">
            <div class="bg-gray-100 overflow-hidden" style="aspect-ratio: {aspect_w}/{aspect_h}; border-radius: {vis['image_radius']}px {vis['image_radius']}px 0 0;">
                <img src="{image_url or 'https://via.placeholder.com/250x250?text=No+Image'}"
                     alt="{title}"
                     class="w-full h-full object-{vis['image_fit']} hover:scale-105 transition-transform duration-300">
            </div>
            <div class="flex flex-col flex-1" style="padding: {card_padding_px}px;">
                <h4 style="font-size: {vis['product_title_size']}px; font-weight: {vis['product_title_weight']}; color: {vis['product_title_color']}" class="{title_align} mb-2 line-clamp-custom">
                    {title}
                </h4>
                {footer_html}
            </div>
        </div>
        """
        cards.append(card)

    return ''.join(cards)