"""
Shopify Embedded App Subrouter

API endpoints for the Shopify embedded app (runs inside Shopify Admin iframe).
All endpoints use Shopify session token auth (not our JWT).

Stage 1 Endpoints:
- POST /shopify/embedded/init — initialize connection (auto-provision if needed)
- GET  /shopify/embedded/dashboard — dashboard data (stats + billing status)

Stage 2 Endpoints:
- GET  /shopify/embedded/settings — get recommendation settings
- PUT  /shopify/embedded/settings — create/update recommendation settings
- POST /shopify/embedded/settings/reset — reset settings to defaults
- POST /shopify/embedded/recommendations/bestsellers — bestseller recommendations
- POST /shopify/embedded/recommendations/cross-sell — cross-sell recommendations
- POST /shopify/embedded/recommendations/upsell — upsell recommendations
- POST /shopify/embedded/recommendations/similar — similar product recommendations
- GET  /shopify/embedded/components/bestsellers — bestseller HTML widget preview
- GET  /shopify/embedded/components/cross-sell — cross-sell HTML widget preview
- GET  /shopify/embedded/components/upsell — upsell HTML widget preview
- GET  /shopify/embedded/components/similar — similar products HTML widget preview
- POST /shopify/embedded/billing/subscribe — create billing subscription
- POST /shopify/embedded/billing/cancel — cancel subscription
- GET  /shopify/embedded/billing/status — billing status
- POST /shopify/embedded/billing/verify-charge — verify + activate a Shopify charge

Product Helpers:
- GET  /shopify/embedded/products — product list for admin dropdown (ungated)

Stage 3 (future — separate):
- App Proxy + HMAC verification for storefront widget delivery
- Theme App Extension (Liquid + JS) for storefront rendering

Auth: Shopify session token via Authorization: Bearer header.
- POST /init extracts and verifies the token manually (creates the connection)
- All other endpoints use get_shopify_connection dependency (requires existing connection)
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from core.config import settings
from ..models import EcommerceConnection, RecommendationSettings, ShopifyBilling
from ..adapters.factory import get_adapter
from ..engine.engine import RecommendationEngine
from ..schemas.recommendation_schemas import (
    BestsellerMethod,
    RecommendationResponse,
    RecommendationResult,
)
from ..schemas.recommendation_settings_schemas import (
    RecommendationSettingsCreate,
    RecommendationSettingsDetail,
    RecommendationSettingsResponse,
    MessageResponse,
)
from ..utils.cache_utils import get_cached_recommendations, set_cached_recommendations
from ..utils.shopify_billing_utils import (
    SHOPIFY_PLAN_PRICES,
    SHOPIFY_STATUS_MAP,
    create_shopify_subscription,
    cancel_shopify_subscription,
    get_shopify_subscription_status,
    map_shopify_plan_to_tier,
)
from ..utils.shopify_session_utils import (
    SHOPIFY_RETRY_HEADER,
    verify_shopify_session_token,
    extract_shop_domain,
    exchange_session_for_access_token,
    auto_provision_shopify_merchant,
    get_shopify_connection,
)
from ..utils.dependency_utils import (
    require_embedded_active_subscription,
    enforce_embedded_rate_limit,
    enforce_embedded_monthly_order_limit,
)
from .components_subrouter import generate_recommendation_html, get_default_shop_urls, apply_visual_defaults

logger = logging.getLogger(__name__)


# ==========================================
# Embedded Request Schemas (no connection_id)
# ==========================================

# Same as standalone request schemas but without connection_id —
# connection is auto-resolved from the Shopify session token
# via get_shopify_connection dependency.

class EmbeddedBestsellerRequest(BaseModel):
    """Embedded bestseller request — connection_id auto-resolved from session token"""
    limit: int = Field(default=10, description="Maximum number of recommendations to return")
    lookback_days: int = Field(default=30, description="Number of days to look back for order data")
    method: BestsellerMethod = Field(default=BestsellerMethod.VOLUME, description="Bestseller calculation method")

class EmbeddedCrossSellRequest(BaseModel):
    """Embedded cross-sell request — connection_id auto-resolved from session token"""
    product_id: str = Field(description="Base product ID to find cross-sell recommendations for")
    limit: int = Field(default=10, description="Maximum number of recommendations to return")
    lookback_days: int = Field(default=30, description="Number of days to look back for order data")

class EmbeddedUpsellRequest(BaseModel):
    """Embedded upsell request — connection_id auto-resolved from session token"""
    product_id: str = Field(description="Base product ID to find upsell recommendations for")
    limit: int = Field(default=10, description="Maximum number of recommendations to return")
    lookback_days: int = Field(default=30, description="Number of days to look back for order data")
    min_price_increase_percent: int = Field(default=10, description="Minimum price increase percentage for upsell candidates")

class EmbeddedSimilarRequest(BaseModel):
    """Embedded similar products request — connection_id auto-resolved from session token"""
    product_id: str = Field(description="Base product ID to find similar products for")
    limit: int = Field(default=10, description="Maximum number of recommendations to return")
    lookback_days: int = Field(default=30, description="Number of days to look back for order data")


# ==========================================
# Shopify Embedded Router
# ==========================================

router = APIRouter(prefix="/shopify/embedded", tags=["Shopify Embedded"])

# Gated sub-router for settings endpoints — subscription + rate limit.
# Same pattern as router.py gated vs ungated split.
_gated = APIRouter(
    dependencies=[
        Depends(require_embedded_active_subscription),
        Depends(enforce_embedded_rate_limit),
    ]
)

# Gated sub-router for recommendation + component endpoints —
# subscription + rate limit + monthly order limit.
# Same as standalone: recommendations/components are metered by monthly order count.
_gated_recs = APIRouter(
    dependencies=[
        Depends(require_embedded_active_subscription),
        Depends(enforce_embedded_rate_limit),
        Depends(enforce_embedded_monthly_order_limit),
    ]
)


# ==========================================
# Helper: Build Dashboard Response
# ==========================================

async def _build_dashboard_response(
    connection: EcommerceConnection,
    db: AsyncSession,
) -> dict:
    """
    Build the combined dashboard response from a connection.

    Fetches product/order counts from the store adapter and
    ShopifyBilling status from the database.

    Used by both POST /init and GET /dashboard to avoid duplication.

    Args:
        connection: EcommerceConnection instance
        db: Database session

    Returns:
        Dict with connection, stats, and billing sections
    """
    # Get product/order counts from adapter
    products_count = 0
    orders_count = 0
    try:
        adapter = get_adapter(connection, db)
        products_count = await adapter.get_product_count()
        orders_count = await adapter.get_order_count(lookback_days=365)
    except Exception as e:
        # Don't fail the whole dashboard if adapter counts fail
        logger.warning(
            "Embedded dashboard: failed to get counts for connection_id=%s: %s",
            connection.id, str(e),
        )

    # Get ShopifyBilling status
    billing_result = await db.execute(
        select(ShopifyBilling).where(
            and_(
                ShopifyBilling.connection_id == connection.id,
                ShopifyBilling.deleted_at == None,
            )
        )
    )
    billing = billing_result.scalar_one_or_none()

    billing_data = {
        "has_subscription": False,
        "plan_name": "FREE",
        "billing_status": None,
        "start_date": None,
        "end_date": None,
        "test": False,
    }
    if billing:
        billing_data = {
            "has_subscription": True,
            "plan_name": billing.plan_name or "FREE",
            "billing_status": billing.billing_status,
            "start_date": billing.start_date.isoformat() if billing.start_date else None,
            "end_date": billing.end_date.isoformat() if billing.end_date else None,
            "test": billing.test,
        }

    return {
        "connection": {
            "id": connection.id,
            "connection_name": connection.connection_name,
            "store_url": connection.store_url,
            "platform": connection.platform,
            "is_active": connection.is_active,
            "created_at": connection.created_at.isoformat() if connection.created_at else None,
        },
        "stats": {
            "products_count": products_count,
            "orders_count": orders_count,
        },
        "billing": billing_data,
    }


# ==========================================
# POST /init — Initialize / Auto-Provision
# ==========================================

@router.post("/init")
async def init_embedded(
    request: Request,
    db: AsyncSession = Depends(get_session),
):
    """
    Initialize the embedded app for a Shopify merchant.

    Called on every embedded app load. Handles two cases:
    - Existing connection: refreshes access token via Token Exchange, returns dashboard
    - No connection (first install): auto-provisions User + Org + Connection, returns dashboard

    This endpoint does NOT use get_shopify_connection dependency because
    it may need to CREATE the connection (auto-provision).

    This endpoint:
    1. Extract session token from Authorization: Bearer header
    2. Verify JWT signature, expiration, audience
    3. Extract shop domain from dest claim
    4. Look up existing connection by shop domain
    5a. If found → refresh access token via Token Exchange → return dashboard
    5b. If not found → Token Exchange → auto-provision → return dashboard
    """
    try:
        # Step 1: Extract session token
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid Authorization header",
                headers=SHOPIFY_RETRY_HEADER,
            )
        token = auth_header[7:]  # Strip "Bearer "

        # Step 2: Verify session token
        decoded = verify_shopify_session_token(token)

        # Step 3: Extract shop domain
        shop_domain = extract_shop_domain(decoded)

        logger.info("Embedded init: shop=%s", shop_domain)

        # Step 4: Look up existing connection
        result = await db.execute(
            select(EcommerceConnection).where(
                and_(
                    EcommerceConnection.store_url == shop_domain,
                    EcommerceConnection.platform == "shopify",
                    EcommerceConnection.is_active == True,
                    EcommerceConnection.deleted_at == None,
                )
            )
            .order_by(EcommerceConnection.created_at.desc())
            .limit(1)
        )
        connection = result.scalar_one_or_none()

        if connection:
            # Step 5a: Existing connection — refresh access token
            try:
                access_token = await exchange_session_for_access_token(
                    shop_domain, token,
                )
                connection.api_secret = access_token
                await db.commit()
                logger.info(
                    "Embedded init: refreshed token for connection_id=%s, shop=%s",
                    connection.id, shop_domain,
                )
            except Exception as e:
                # Token Exchange failed — continue with existing token
                # This can happen if the session token is valid but Token Exchange
                # requires additional scopes or the store is on a plan that doesn't support it
                logger.warning(
                    "Embedded init: Token Exchange failed for shop=%s, using existing token: %s",
                    shop_domain, str(e),
                )
        else:
            # Step 5b: No connection — auto-provision
            access_token = await exchange_session_for_access_token(
                shop_domain, token,
            )
            connection = await auto_provision_shopify_merchant(
                shop_domain, access_token, db,
            )

        # Build and return dashboard response
        response = await _build_dashboard_response(connection, db)
        return response

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error("Embedded init error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


# ==========================================
# GET /dashboard — Dashboard Data
# ==========================================

@router.get("/dashboard")
async def get_dashboard(
    connection: EcommerceConnection = Depends(get_shopify_connection),
    db: AsyncSession = Depends(get_session),
):
    """
    Get dashboard data for the embedded app.

    Returns connection info, product/order counts, and billing status.
    Same response shape as POST /init but without the Token Exchange.

    This endpoint:
    1. Get connection via get_shopify_connection dependency (session token auth)
    2. Fetch product/order counts from store adapter
    3. Fetch ShopifyBilling status from database
    4. Return combined response
    """
    try:
        response = await _build_dashboard_response(connection, db)
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Embedded dashboard error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


# ==========================================
# GET /products — Product List for Admin Dropdown
# ==========================================

@router.get("/products")
async def get_products(
    connection: EcommerceConnection = Depends(get_shopify_connection),
    db: AsyncSession = Depends(get_session),
):
    """
    Get a simplified product list for the admin Components page dropdown.

    Returns product_id, title, and image_url for each active product.
    On the ungated router — FREE tier merchants can preview widgets too.

    This endpoint:
    1. Get connection via get_shopify_connection dependency (session token auth)
    2. Get adapter for the connection
    3. Fetch products from the store (limit=250)
    4. Return simplified list: product_id, title, image_url
    """
    try:
        # Step 2–3: Fetch products from store adapter
        adapter = get_adapter(connection, db)
        raw_products = await adapter.get_products(limit=250)

        # Step 4: Return simplified list for dropdown
        products = [
            {
                "product_id": p.get("product_id", ""),
                "title": p.get("title", ""),
                "image_url": p.get("image_url", ""),
            }
            for p in raw_products
        ]

        return {"products": products, "count": len(products)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Embedded products error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


# ==========================================
# GET /settings — Get Recommendation Settings
# ==========================================

@_gated.get("/settings", response_model=RecommendationSettingsResponse)
async def get_settings(
    connection: EcommerceConnection = Depends(get_shopify_connection),
    db: AsyncSession = Depends(get_session),
):
    """
    Get recommendation settings for the embedded app's connection.

    No connection_id needed — auto-resolved from session token.

    This endpoint:
    1. Get connection via get_shopify_connection dependency (session token auth)
    2. Look up RecommendationSettings by connection.id
    3. If found → return settings
    4. If not found → return default values
    """
    try:
        # Look up settings for this connection
        result = await db.execute(
            select(RecommendationSettings).where(
                RecommendationSettings.connection_id == connection.id
            )
        )
        existing_settings = result.scalar_one_or_none()

        if existing_settings:
            return RecommendationSettingsResponse(
                success=True,
                data=RecommendationSettingsDetail.model_validate(
                    existing_settings, from_attributes=True
                ),
            )

        # No saved settings — return defaults (settings always "exist" conceptually)
        return RecommendationSettingsResponse(
            success=True,
            data=RecommendationSettingsDetail(
                id=0,
                connection_id=connection.id,
                bestseller_method="volume",
                bestseller_lookback_days=30,
                crosssell_lookback_days=30,
                max_recommendations=10,
                min_price_increase_percent=10,
                shop_base_url=None,
                product_url_template=None,
                created_at=datetime.now(timezone.utc),
                updated_at=None,
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to get settings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# PUT /settings — Create/Update Settings
# ==========================================

@_gated.put("/settings", response_model=RecommendationSettingsResponse)
async def update_settings(
    payload: RecommendationSettingsCreate,
    connection: EcommerceConnection = Depends(get_shopify_connection),
    db: AsyncSession = Depends(get_session),
):
    """
    Create or update recommendation settings for the embedded app's connection.

    No connection_id needed — auto-resolved from session token.

    This endpoint:
    1. Get connection via get_shopify_connection dependency (session token auth)
    2. Check if settings already exist for this connection
    3. Update existing settings or create new ones
    4. Return the settings details
    """
    try:
        # Check if settings already exist
        result = await db.execute(
            select(RecommendationSettings).where(
                RecommendationSettings.connection_id == connection.id
            )
        )
        existing_settings = result.scalar_one_or_none()

        if existing_settings:
            # Update only fields that were explicitly provided (partial update)
            update_data = payload.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                if hasattr(value, 'value'):
                    value = value.value
                setattr(existing_settings, field, value)

            await db.commit()
            await db.refresh(existing_settings)
            return RecommendationSettingsResponse(
                success=True,
                data=RecommendationSettingsDetail.model_validate(
                    existing_settings, from_attributes=True
                ),
            )
        else:
            # Create new settings
            new_settings = RecommendationSettings(
                connection_id=connection.id,
                bestseller_method=payload.bestseller_method.value,
                bestseller_lookback_days=payload.bestseller_lookback_days,
                crosssell_lookback_days=payload.crosssell_lookback_days,
                max_recommendations=payload.max_recommendations,
                min_price_increase_percent=payload.min_price_increase_percent,
                shop_base_url=payload.shop_base_url,
                product_url_template=payload.product_url_template,
                # Group 1: Widget Container
                widget_bg_color=payload.widget_bg_color,
                widget_padding=payload.widget_padding,
                # Group 2: Widget Title
                widget_title=payload.widget_title,
                title_color=payload.title_color,
                title_size=payload.title_size,
                title_alignment=payload.title_alignment,
                # Group 3: Layout
                widget_style=payload.widget_style,
                widget_columns=payload.widget_columns,
                gap=payload.gap,
                # Group 4: Product Card
                card_bg_color=payload.card_bg_color,
                card_border_radius=payload.card_border_radius,
                card_border_width=payload.card_border_width,
                card_border_color=payload.card_border_color,
                card_shadow=payload.card_shadow,
                card_padding=payload.card_padding,
                card_hover=payload.card_hover,
                # Group 5: Product Image
                image_aspect_w=payload.image_aspect_w,
                image_aspect_h=payload.image_aspect_h,
                image_fit=payload.image_fit,
                image_radius=payload.image_radius,
                # Group 6: Product Title in Card
                product_title_color=payload.product_title_color,
                product_title_size=payload.product_title_size,
                product_title_weight=payload.product_title_weight,
                product_title_lines=payload.product_title_lines,
                product_title_alignment=payload.product_title_alignment,
                # Group 7: Price
                show_price=payload.show_price,
                price_color=payload.price_color,
                price_size=payload.price_size,
                # Group 8: CTA Button
                button_text=payload.button_text,
                button_bg_color=payload.button_bg_color,
                button_text_color=payload.button_text_color,
                button_radius=payload.button_radius,
                button_size=payload.button_size,
                button_variant=payload.button_variant,
                button_full_width=payload.button_full_width,
            )
            db.add(new_settings)
            await db.commit()
            await db.refresh(new_settings)
            return RecommendationSettingsResponse(
                success=True,
                data=RecommendationSettingsDetail.model_validate(
                    new_settings, from_attributes=True
                ),
            )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to update settings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# POST /settings/reset — Reset to Defaults
# ==========================================

@_gated.post("/settings/reset", response_model=MessageResponse)
async def reset_settings(
    connection: EcommerceConnection = Depends(get_shopify_connection),
    db: AsyncSession = Depends(get_session),
):
    """
    Reset recommendation settings to default values.

    Deletes existing settings — defaults are applied at query time by GET /settings.

    This endpoint:
    1. Get connection via get_shopify_connection dependency (session token auth)
    2. Delete existing settings if they exist
    3. Return success message
    """
    try:
        # Delete existing settings if they exist
        result = await db.execute(
            select(RecommendationSettings).where(
                RecommendationSettings.connection_id == connection.id
            )
        )
        existing_settings = result.scalar_one_or_none()

        if existing_settings:
            await db.delete(existing_settings)
            await db.commit()

        return MessageResponse(
            success=True,
            message="Settings reset to default values",
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to reset settings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# POST /recommendations/bestsellers
# ==========================================

@_gated_recs.post("/recommendations/bestsellers", response_model=RecommendationResponse)
async def get_bestsellers(
    payload: EmbeddedBestsellerRequest,
    connection: EcommerceConnection = Depends(get_shopify_connection),
    db: AsyncSession = Depends(get_session),
):
    """
    Get bestselling products for the embedded app's connection.

    No connection_id needed — auto-resolved from session token.

    This endpoint:
    1. Get connection via get_shopify_connection dependency (session token auth)
    2. Create platform adapter and recommendation engine
    3. Check cache, generate bestseller recommendations if cache miss
    4. Return the recommendation results
    """
    try:
        # Create adapter and engine
        adapter = get_adapter(connection, db)
        engine = RecommendationEngine(adapter)

        # Check cache first
        cached = await get_cached_recommendations(
            connection.id, "bestseller",
            limit=payload.limit, method=payload.method.value, lookback_days=payload.lookback_days,
        )
        if cached is not None:
            recommendations = cached
        else:
            # Generate bestseller recommendations (cache miss)
            recommendations = await engine.get_bestsellers(
                limit=payload.limit,
                method=payload.method,
                lookback_days=payload.lookback_days,
            )
            # Cache for next request
            await set_cached_recommendations(
                connection.id, "bestseller", recommendations,
                limit=payload.limit, method=payload.method.value, lookback_days=payload.lookback_days,
            )

        return RecommendationResponse(
            success=True,
            data=RecommendationResult(
                recommendations=recommendations,
                count=len(recommendations),
                method=payload.method.value,
                lookback_days=payload.lookback_days,
                generated_at=datetime.now(timezone.utc).isoformat(),
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to get bestsellers: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# POST /recommendations/cross-sell
# ==========================================

@_gated_recs.post("/recommendations/cross-sell", response_model=RecommendationResponse)
async def get_cross_sell(
    payload: EmbeddedCrossSellRequest,
    connection: EcommerceConnection = Depends(get_shopify_connection),
    db: AsyncSession = Depends(get_session),
):
    """
    Get frequently bought together products for the embedded app's connection.

    No connection_id needed — auto-resolved from session token.

    This endpoint:
    1. Get connection via get_shopify_connection dependency (session token auth)
    2. Create platform adapter and recommendation engine
    3. Check cache, generate cross-sell recommendations if cache miss
    4. Return the recommendation results
    """
    try:
        # Create adapter and engine
        adapter = get_adapter(connection, db)
        engine = RecommendationEngine(adapter)

        # Check cache first
        cached = await get_cached_recommendations(
            connection.id, "cross_sell",
            product_id=payload.product_id, limit=payload.limit, lookback_days=payload.lookback_days,
        )
        if cached is not None:
            recommendations = cached
        else:
            # Generate cross-sell recommendations (cache miss)
            recommendations = await engine.get_cross_sell(
                product_id=payload.product_id,
                limit=payload.limit,
                lookback_days=payload.lookback_days,
            )
            # Cache for next request
            await set_cached_recommendations(
                connection.id, "cross_sell", recommendations,
                product_id=payload.product_id, limit=payload.limit, lookback_days=payload.lookback_days,
            )

        return RecommendationResponse(
            success=True,
            data=RecommendationResult(
                recommendations=recommendations,
                count=len(recommendations),
                method="cross_sell",
                base_product_id=payload.product_id,
                lookback_days=payload.lookback_days,
                generated_at=datetime.now(timezone.utc).isoformat(),
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to get cross sell: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# POST /recommendations/upsell
# ==========================================

@_gated_recs.post("/recommendations/upsell", response_model=RecommendationResponse)
async def get_upsell(
    payload: EmbeddedUpsellRequest,
    connection: EcommerceConnection = Depends(get_shopify_connection),
    db: AsyncSession = Depends(get_session),
):
    """
    Get higher-priced alternatives for the embedded app's connection.

    No connection_id needed — auto-resolved from session token.

    This endpoint:
    1. Get connection via get_shopify_connection dependency (session token auth)
    2. Create platform adapter and recommendation engine
    3. Check cache, generate upsell recommendations if cache miss
    4. Return the recommendation results
    """
    try:
        # Create adapter and engine
        adapter = get_adapter(connection, db)
        engine = RecommendationEngine(adapter)

        # Check cache first
        cached = await get_cached_recommendations(
            connection.id, "upsell",
            product_id=payload.product_id, limit=payload.limit, min_price_increase_percent=payload.min_price_increase_percent,
        )
        if cached is not None:
            recommendations = cached
        else:
            # Generate upsell recommendations (cache miss)
            recommendations = await engine.get_upsell(
                product_id=payload.product_id,
                limit=payload.limit,
                min_price_increase_percent=payload.min_price_increase_percent,
            )
            # Cache for next request
            await set_cached_recommendations(
                connection.id, "upsell", recommendations,
                product_id=payload.product_id, limit=payload.limit, min_price_increase_percent=payload.min_price_increase_percent,
            )

        return RecommendationResponse(
            success=True,
            data=RecommendationResult(
                recommendations=recommendations,
                count=len(recommendations),
                method="upsell",
                base_product_id=payload.product_id,
                lookback_days=payload.lookback_days,
                generated_at=datetime.now(timezone.utc).isoformat(),
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to get upsell: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# POST /recommendations/similar
# ==========================================

@_gated_recs.post("/recommendations/similar", response_model=RecommendationResponse)
async def get_similar_products(
    payload: EmbeddedSimilarRequest,
    connection: EcommerceConnection = Depends(get_shopify_connection),
    db: AsyncSession = Depends(get_session),
):
    """
    Get similar products for the embedded app's connection.

    No connection_id needed — auto-resolved from session token.

    This endpoint:
    1. Get connection via get_shopify_connection dependency (session token auth)
    2. Create platform adapter and recommendation engine
    3. Check cache, generate similar product recommendations if cache miss
    4. Return the recommendation results
    """
    try:
        # Create adapter and engine
        adapter = get_adapter(connection, db)
        engine = RecommendationEngine(adapter)

        # Check cache first
        cached = await get_cached_recommendations(
            connection.id, "similar",
            product_id=payload.product_id, limit=payload.limit,
        )
        if cached is not None:
            recommendations = cached
        else:
            # Generate similar product recommendations (cache miss)
            recommendations = await engine.get_similar(
                product_id=payload.product_id,
                limit=payload.limit,
            )
            # Cache for next request
            await set_cached_recommendations(
                connection.id, "similar", recommendations,
                product_id=payload.product_id, limit=payload.limit,
            )

        return RecommendationResponse(
            success=True,
            data=RecommendationResult(
                recommendations=recommendations,
                count=len(recommendations),
                method="similar",
                base_product_id=payload.product_id,
                lookback_days=payload.lookback_days,
                generated_at=datetime.now(timezone.utc).isoformat(),
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to get similar products: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# GET /components/bestsellers — HTML Preview
# ==========================================

@_gated_recs.get("/components/bestsellers", response_class=HTMLResponse)
async def get_bestsellers_component(
    top: int = Query(4, description="Number of recommendations to show"),
    lookback_days: int = Query(30, description="Number of days to look back for order data"),
    method: str = Query("volume", description="Bestseller calculation method: volume, value, or balanced"),
    device: str = Query("desktop", description="Target device: desktop, mobile"),
    # Group 1: Widget Container
    widget_bg_color: str = Query("#FFFFFF", description="Widget background color hex"),
    widget_padding: int = Query(16, description="Widget padding in pixels"),
    # Group 2: Widget Title
    widget_title: str = Query("", description="Custom widget title (empty = auto-default based on type)"),
    title_color: str = Query("#111827", description="Widget title color hex"),
    title_size: int = Query(24, description="Widget title font-size in pixels"),
    title_alignment: str = Query("left", description="Widget title alignment: left, center"),
    # Group 3: Layout
    widget_style: str = Query("grid", description="Widget layout style: grid, carousel"),
    widget_columns: int = Query(4, description="Max grid columns at full width (2-6)"),
    gap: int = Query(16, description="Gap between cards in pixels"),
    card_min_width: int = Query(200, description="Min card width in pixels"),
    card_max_width: int = Query(0, description="Max card width in pixels (0 = no limit)"),
    # Group 4: Product Card
    card_bg_color: str = Query("#FFFFFF", description="Card background color hex"),
    card_border_radius: int = Query(8, description="Card border radius in pixels"),
    card_border_width: int = Query(1, description="Card border width in pixels"),
    card_border_color: str = Query("#E5E7EB", description="Card border color hex"),
    card_shadow: str = Query("sm", description="Card shadow: none, sm, md, lg"),
    card_padding: int = Query(16, description="Card content padding in pixels"),
    card_hover: str = Query("lift", description="Card hover effect: none, lift, shadow, glow"),
    # Group 5: Product Image
    image_aspect_w: int = Query(1, description="Image aspect ratio width (e.g. 1, 3, 4, 16)"),
    image_aspect_h: int = Query(1, description="Image aspect ratio height (e.g. 1, 4, 5, 9)"),
    image_fit: str = Query("cover", description="Image object-fit: cover, contain"),
    image_radius: int = Query(8, description="Image border radius in pixels"),
    # Group 6: Product Title in Card
    product_title_color: str = Query("#1F2937", description="Product title color hex"),
    product_title_size: int = Query(14, description="Product title font-size in pixels"),
    product_title_weight: int = Query(500, description="CSS font-weight (100-900)"),
    product_title_lines: int = Query(2, description="Product title max lines before truncation (1-3)"),
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
    button_variant: str = Query("solid", description="Button style variant: solid, outline, ghost"),
    button_full_width: bool = Query(False, description="Button stretches to full card width"),
    connection: EcommerceConnection = Depends(get_shopify_connection),
    db: AsyncSession = Depends(get_session),
):
    """
    Get bestsellers HTML widget preview for the embedded app.

    No connection_id needed — auto-resolved from session token.
    Returns a full HTML page with Tailwind CSS for previewing the widget.

    This endpoint:
    1. Get connection via get_shopify_connection dependency (session token auth)
    2. Get shop URL settings from RecommendationSettings
    3. Create adapter and engine, check cache or generate recommendations
    4. Generate HTML widget via generate_recommendation_html
    5. Return HTMLResponse
    """
    try:
        # Get shop URL settings
        settings_result = await db.execute(
            select(RecommendationSettings).where(
                RecommendationSettings.connection_id == connection.id
            )
        )
        rec_settings = settings_result.scalar_one_or_none()

        # Default URLs by platform if not configured
        shop_urls = get_default_shop_urls(connection, rec_settings)

        # Apply visual defaults fallback chain: URL param → DB brand defaults → hardcoded
        vis = apply_visual_defaults(
            rec_settings,
            # Group 1: Widget Container
            widget_bg_color=widget_bg_color, widget_padding=widget_padding,
            # Group 2: Widget Title
            widget_title=widget_title, title_color=title_color, title_size=title_size,
            title_alignment=title_alignment,
            # Group 3: Layout
            widget_style=widget_style, widget_columns=widget_columns, gap=gap,
            card_min_width=card_min_width, card_max_width=card_max_width,
            # Group 4: Product Card
            card_bg_color=card_bg_color, card_border_radius=card_border_radius,
            card_border_width=card_border_width, card_border_color=card_border_color,
            card_shadow=card_shadow, card_padding=card_padding, card_hover=card_hover,
            # Group 5: Product Image
            image_aspect_w=image_aspect_w, image_aspect_h=image_aspect_h, image_fit=image_fit, image_radius=image_radius,
            # Group 6: Product Title in Card
            product_title_color=product_title_color, product_title_size=product_title_size,
            product_title_weight=product_title_weight, product_title_lines=product_title_lines,
            product_title_alignment=product_title_alignment,
            # Group 7: Price
            show_price=show_price, price_color=price_color, price_size=price_size,
            # Group 8: CTA Button
            button_text=button_text, button_bg_color=button_bg_color,
            button_text_color=button_text_color, button_radius=button_radius,
            button_size=button_size, button_variant=button_variant,
            button_full_width=button_full_width,
        )

        adapter = get_adapter(connection, db)
        engine = RecommendationEngine(adapter)

        # Check cache first
        cached = await get_cached_recommendations(
            connection.id, "bestseller",
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
                connection.id, "bestseller", recs,
                limit=top, method=method, lookback_days=lookback_days,
            )

        # Generate HTML component
        html = generate_recommendation_html(
            recommendations=recs, vis=vis,
            rec_type="bestseller", shop_urls=shop_urls,
        )

        return HTMLResponse(content=html)

    except Exception as e:
        logger.exception(f"Failed to get bestsellers component: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# GET /components/cross-sell — HTML Preview
# ==========================================

@_gated_recs.get("/components/cross-sell", response_class=HTMLResponse)
async def get_cross_sell_component(
    product_id: str = Query(..., description="Product ID for cross-sell recommendations"),
    top: int = Query(4, description="Number of recommendations to show"),
    lookback_days: int = Query(30, description="Number of days to look back for order data"),
    device: str = Query("desktop", description="Target device: desktop, mobile"),
    # Group 1: Widget Container
    widget_bg_color: str = Query("#FFFFFF", description="Widget background color hex"),
    widget_padding: int = Query(16, description="Widget padding in pixels"),
    # Group 2: Widget Title
    widget_title: str = Query("", description="Custom widget title (empty = auto-default based on type)"),
    title_color: str = Query("#111827", description="Widget title color hex"),
    title_size: int = Query(24, description="Widget title font-size in pixels"),
    title_alignment: str = Query("left", description="Widget title alignment: left, center"),
    # Group 3: Layout
    widget_style: str = Query("grid", description="Widget layout style: grid, carousel"),
    widget_columns: int = Query(4, description="Max grid columns at full width (2-6)"),
    gap: int = Query(16, description="Gap between cards in pixels"),
    card_min_width: int = Query(200, description="Min card width in pixels"),
    card_max_width: int = Query(0, description="Max card width in pixels (0 = no limit)"),
    # Group 4: Product Card
    card_bg_color: str = Query("#FFFFFF", description="Card background color hex"),
    card_border_radius: int = Query(8, description="Card border radius in pixels"),
    card_border_width: int = Query(1, description="Card border width in pixels"),
    card_border_color: str = Query("#E5E7EB", description="Card border color hex"),
    card_shadow: str = Query("sm", description="Card shadow: none, sm, md, lg"),
    card_padding: int = Query(16, description="Card content padding in pixels"),
    card_hover: str = Query("lift", description="Card hover effect: none, lift, shadow, glow"),
    # Group 5: Product Image
    image_aspect_w: int = Query(1, description="Image aspect ratio width (e.g. 1, 3, 4, 16)"),
    image_aspect_h: int = Query(1, description="Image aspect ratio height (e.g. 1, 4, 5, 9)"),
    image_fit: str = Query("cover", description="Image object-fit: cover, contain"),
    image_radius: int = Query(8, description="Image border radius in pixels"),
    # Group 6: Product Title in Card
    product_title_color: str = Query("#1F2937", description="Product title color hex"),
    product_title_size: int = Query(14, description="Product title font-size in pixels"),
    product_title_weight: int = Query(500, description="CSS font-weight (100-900)"),
    product_title_lines: int = Query(2, description="Product title max lines before truncation (1-3)"),
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
    button_variant: str = Query("solid", description="Button style variant: solid, outline, ghost"),
    button_full_width: bool = Query(False, description="Button stretches to full card width"),
    connection: EcommerceConnection = Depends(get_shopify_connection),
    db: AsyncSession = Depends(get_session),
):
    """
    Get cross-sell HTML widget preview for the embedded app.

    No connection_id needed — auto-resolved from session token.

    This endpoint:
    1. Get connection via get_shopify_connection dependency (session token auth)
    2. Get shop URL settings, create adapter/engine
    3. Check cache or generate cross-sell recommendations
    4. Generate and return HTML widget
    """
    try:
        # Get shop URL settings
        settings_result = await db.execute(
            select(RecommendationSettings).where(
                RecommendationSettings.connection_id == connection.id
            )
        )
        rec_settings = settings_result.scalar_one_or_none()
        shop_urls = get_default_shop_urls(connection, rec_settings)

        # Apply visual defaults fallback chain: URL param → DB brand defaults → hardcoded
        vis = apply_visual_defaults(
            rec_settings,
            # Group 1: Widget Container
            widget_bg_color=widget_bg_color, widget_padding=widget_padding,
            # Group 2: Widget Title
            widget_title=widget_title, title_color=title_color, title_size=title_size,
            title_alignment=title_alignment,
            # Group 3: Layout
            widget_style=widget_style, widget_columns=widget_columns, gap=gap,
            card_min_width=card_min_width, card_max_width=card_max_width,
            # Group 4: Product Card
            card_bg_color=card_bg_color, card_border_radius=card_border_radius,
            card_border_width=card_border_width, card_border_color=card_border_color,
            card_shadow=card_shadow, card_padding=card_padding, card_hover=card_hover,
            # Group 5: Product Image
            image_aspect_w=image_aspect_w, image_aspect_h=image_aspect_h, image_fit=image_fit, image_radius=image_radius,
            # Group 6: Product Title in Card
            product_title_color=product_title_color, product_title_size=product_title_size,
            product_title_weight=product_title_weight, product_title_lines=product_title_lines,
            product_title_alignment=product_title_alignment,
            # Group 7: Price
            show_price=show_price, price_color=price_color, price_size=price_size,
            # Group 8: CTA Button
            button_text=button_text, button_bg_color=button_bg_color,
            button_text_color=button_text_color, button_radius=button_radius,
            button_size=button_size, button_variant=button_variant,
            button_full_width=button_full_width,
        )

        adapter = get_adapter(connection, db)
        engine = RecommendationEngine(adapter)

        # Check cache first
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

        html = generate_recommendation_html(
            recommendations=recs, vis=vis,
            rec_type="cross-sell", shop_urls=shop_urls,
        )

        return HTMLResponse(content=html)

    except Exception as e:
        logger.exception(f"Failed to get cross sell component: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# GET /components/upsell — HTML Preview
# ==========================================

@_gated_recs.get("/components/upsell", response_class=HTMLResponse)
async def get_upsell_component(
    product_id: str = Query(..., description="Product ID for upsell recommendations"),
    top: int = Query(4, description="Number of recommendations to show"),
    min_price_increase_percent: int = Query(10, description="Minimum price increase percentage for upsell candidates"),
    device: str = Query("desktop", description="Target device: desktop, mobile"),
    # Group 1: Widget Container
    widget_bg_color: str = Query("#FFFFFF", description="Widget background color hex"),
    widget_padding: int = Query(16, description="Widget padding in pixels"),
    # Group 2: Widget Title
    widget_title: str = Query("", description="Custom widget title (empty = auto-default based on type)"),
    title_color: str = Query("#111827", description="Widget title color hex"),
    title_size: int = Query(24, description="Widget title font-size in pixels"),
    title_alignment: str = Query("left", description="Widget title alignment: left, center"),
    # Group 3: Layout
    widget_style: str = Query("grid", description="Widget layout style: grid, carousel"),
    widget_columns: int = Query(4, description="Max grid columns at full width (2-6)"),
    gap: int = Query(16, description="Gap between cards in pixels"),
    card_min_width: int = Query(200, description="Min card width in pixels"),
    card_max_width: int = Query(0, description="Max card width in pixels (0 = no limit)"),
    # Group 4: Product Card
    card_bg_color: str = Query("#FFFFFF", description="Card background color hex"),
    card_border_radius: int = Query(8, description="Card border radius in pixels"),
    card_border_width: int = Query(1, description="Card border width in pixels"),
    card_border_color: str = Query("#E5E7EB", description="Card border color hex"),
    card_shadow: str = Query("sm", description="Card shadow: none, sm, md, lg"),
    card_padding: int = Query(16, description="Card content padding in pixels"),
    card_hover: str = Query("lift", description="Card hover effect: none, lift, shadow, glow"),
    # Group 5: Product Image
    image_aspect_w: int = Query(1, description="Image aspect ratio width (e.g. 1, 3, 4, 16)"),
    image_aspect_h: int = Query(1, description="Image aspect ratio height (e.g. 1, 4, 5, 9)"),
    image_fit: str = Query("cover", description="Image object-fit: cover, contain"),
    image_radius: int = Query(8, description="Image border radius in pixels"),
    # Group 6: Product Title in Card
    product_title_color: str = Query("#1F2937", description="Product title color hex"),
    product_title_size: int = Query(14, description="Product title font-size in pixels"),
    product_title_weight: int = Query(500, description="CSS font-weight (100-900)"),
    product_title_lines: int = Query(2, description="Product title max lines before truncation (1-3)"),
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
    button_variant: str = Query("solid", description="Button style variant: solid, outline, ghost"),
    button_full_width: bool = Query(False, description="Button stretches to full card width"),
    connection: EcommerceConnection = Depends(get_shopify_connection),
    db: AsyncSession = Depends(get_session),
):
    """
    Get upsell HTML widget preview for the embedded app.

    No connection_id needed — auto-resolved from session token.

    This endpoint:
    1. Get connection via get_shopify_connection dependency (session token auth)
    2. Get shop URL settings, create adapter/engine
    3. Check cache or generate upsell recommendations
    4. Generate and return HTML widget
    """
    try:
        # Get shop URL settings
        settings_result = await db.execute(
            select(RecommendationSettings).where(
                RecommendationSettings.connection_id == connection.id
            )
        )
        rec_settings = settings_result.scalar_one_or_none()
        shop_urls = get_default_shop_urls(connection, rec_settings)

        # Apply visual defaults fallback chain: URL param → DB brand defaults → hardcoded
        vis = apply_visual_defaults(
            rec_settings,
            # Group 1: Widget Container
            widget_bg_color=widget_bg_color, widget_padding=widget_padding,
            # Group 2: Widget Title
            widget_title=widget_title, title_color=title_color, title_size=title_size,
            title_alignment=title_alignment,
            # Group 3: Layout
            widget_style=widget_style, widget_columns=widget_columns, gap=gap,
            card_min_width=card_min_width, card_max_width=card_max_width,
            # Group 4: Product Card
            card_bg_color=card_bg_color, card_border_radius=card_border_radius,
            card_border_width=card_border_width, card_border_color=card_border_color,
            card_shadow=card_shadow, card_padding=card_padding, card_hover=card_hover,
            # Group 5: Product Image
            image_aspect_w=image_aspect_w, image_aspect_h=image_aspect_h, image_fit=image_fit, image_radius=image_radius,
            # Group 6: Product Title in Card
            product_title_color=product_title_color, product_title_size=product_title_size,
            product_title_weight=product_title_weight, product_title_lines=product_title_lines,
            product_title_alignment=product_title_alignment,
            # Group 7: Price
            show_price=show_price, price_color=price_color, price_size=price_size,
            # Group 8: CTA Button
            button_text=button_text, button_bg_color=button_bg_color,
            button_text_color=button_text_color, button_radius=button_radius,
            button_size=button_size, button_variant=button_variant,
            button_full_width=button_full_width,
        )

        adapter = get_adapter(connection, db)
        engine = RecommendationEngine(adapter)

        # Check cache first
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

        html = generate_recommendation_html(
            recommendations=recs, vis=vis,
            rec_type="upsell", shop_urls=shop_urls,
        )

        return HTMLResponse(content=html)

    except Exception as e:
        logger.exception(f"Failed to get upsell component: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# GET /components/similar — HTML Preview
# ==========================================

@_gated_recs.get("/components/similar", response_class=HTMLResponse)
async def get_similar_component(
    product_id: str = Query(..., description="Product ID for similar product recommendations"),
    top: int = Query(4, description="Number of recommendations to show"),
    device: str = Query("desktop", description="Target device: desktop, mobile"),
    # Group 1: Widget Container
    widget_bg_color: str = Query("#FFFFFF", description="Widget background color hex"),
    widget_padding: int = Query(16, description="Widget padding in pixels"),
    # Group 2: Widget Title
    widget_title: str = Query("", description="Custom widget title (empty = auto-default based on type)"),
    title_color: str = Query("#111827", description="Widget title color hex"),
    title_size: int = Query(24, description="Widget title font-size in pixels"),
    title_alignment: str = Query("left", description="Widget title alignment: left, center"),
    # Group 3: Layout
    widget_style: str = Query("grid", description="Widget layout style: grid, carousel"),
    widget_columns: int = Query(4, description="Max grid columns at full width (2-6)"),
    gap: int = Query(16, description="Gap between cards in pixels"),
    card_min_width: int = Query(200, description="Min card width in pixels"),
    card_max_width: int = Query(0, description="Max card width in pixels (0 = no limit)"),
    # Group 4: Product Card
    card_bg_color: str = Query("#FFFFFF", description="Card background color hex"),
    card_border_radius: int = Query(8, description="Card border radius in pixels"),
    card_border_width: int = Query(1, description="Card border width in pixels"),
    card_border_color: str = Query("#E5E7EB", description="Card border color hex"),
    card_shadow: str = Query("sm", description="Card shadow: none, sm, md, lg"),
    card_padding: int = Query(16, description="Card content padding in pixels"),
    card_hover: str = Query("lift", description="Card hover effect: none, lift, shadow, glow"),
    # Group 5: Product Image
    image_aspect_w: int = Query(1, description="Image aspect ratio width (e.g. 1, 3, 4, 16)"),
    image_aspect_h: int = Query(1, description="Image aspect ratio height (e.g. 1, 4, 5, 9)"),
    image_fit: str = Query("cover", description="Image object-fit: cover, contain"),
    image_radius: int = Query(8, description="Image border radius in pixels"),
    # Group 6: Product Title in Card
    product_title_color: str = Query("#1F2937", description="Product title color hex"),
    product_title_size: int = Query(14, description="Product title font-size in pixels"),
    product_title_weight: int = Query(500, description="CSS font-weight (100-900)"),
    product_title_lines: int = Query(2, description="Product title max lines before truncation (1-3)"),
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
    button_variant: str = Query("solid", description="Button style variant: solid, outline, ghost"),
    button_full_width: bool = Query(False, description="Button stretches to full card width"),
    connection: EcommerceConnection = Depends(get_shopify_connection),
    db: AsyncSession = Depends(get_session),
):
    """
    Get similar products HTML widget preview for the embedded app.

    No connection_id needed — auto-resolved from session token.

    This endpoint:
    1. Get connection via get_shopify_connection dependency (session token auth)
    2. Get shop URL settings, create adapter/engine
    3. Check cache or generate similar product recommendations
    4. Generate and return HTML widget
    """
    try:
        # Get shop URL settings
        settings_result = await db.execute(
            select(RecommendationSettings).where(
                RecommendationSettings.connection_id == connection.id
            )
        )
        rec_settings = settings_result.scalar_one_or_none()
        shop_urls = get_default_shop_urls(connection, rec_settings)

        # Apply visual defaults fallback chain: URL param → DB brand defaults → hardcoded
        vis = apply_visual_defaults(
            rec_settings,
            # Group 1: Widget Container
            widget_bg_color=widget_bg_color, widget_padding=widget_padding,
            # Group 2: Widget Title
            widget_title=widget_title, title_color=title_color, title_size=title_size,
            title_alignment=title_alignment,
            # Group 3: Layout
            widget_style=widget_style, widget_columns=widget_columns, gap=gap,
            card_min_width=card_min_width, card_max_width=card_max_width,
            # Group 4: Product Card
            card_bg_color=card_bg_color, card_border_radius=card_border_radius,
            card_border_width=card_border_width, card_border_color=card_border_color,
            card_shadow=card_shadow, card_padding=card_padding, card_hover=card_hover,
            # Group 5: Product Image
            image_aspect_w=image_aspect_w, image_aspect_h=image_aspect_h, image_fit=image_fit, image_radius=image_radius,
            # Group 6: Product Title in Card
            product_title_color=product_title_color, product_title_size=product_title_size,
            product_title_weight=product_title_weight, product_title_lines=product_title_lines,
            product_title_alignment=product_title_alignment,
            # Group 7: Price
            show_price=show_price, price_color=price_color, price_size=price_size,
            # Group 8: CTA Button
            button_text=button_text, button_bg_color=button_bg_color,
            button_text_color=button_text_color, button_radius=button_radius,
            button_size=button_size, button_variant=button_variant,
            button_full_width=button_full_width,
        )

        adapter = get_adapter(connection, db)
        engine = RecommendationEngine(adapter)

        # Check cache first
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

        html = generate_recommendation_html(
            recommendations=recs, vis=vis,
            rec_type="similar", shop_urls=shop_urls,
        )

        return HTMLResponse(content=html)

    except Exception as e:
        logger.exception(f"Failed to get similar component: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# POST /billing/subscribe — Create Subscription
# ==========================================
# NOTE: This endpoint uses the Billing API (appSubscriptionCreate).
# Currently NOT used — app is configured with Managed Pricing in the Partner Dashboard.
# Managed Pricing handles subscriptions through Shopify's hosted pricing page.
# Kept here in case we switch back to Manual Pricing (Billing API) in the future.
# To switch: Partner Dashboard → Distribution → Manage listing → Pricing content → Settings.

@router.post("/billing/subscribe")
async def billing_subscribe(
    plan_name: str = Query(..., description="Plan tier: PRO or ENTERPRISE"),
    connection: EcommerceConnection = Depends(get_shopify_connection),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a Shopify app subscription charge for the embedded app's connection.

    No connection_id needed — auto-resolved from session token.
    Uses the SAME billing callback endpoint as standalone (redirect from Shopify,
    no JWT needed). Passes embedded=true so callback redirects to /shopify/billing.

    This endpoint:
    1. Get connection via get_shopify_connection dependency (session token auth)
    2. Validate plan_name is PRO or ENTERPRISE
    3. Block if ACTIVE billing already exists
    4. Clean up stale PENDING records from abandoned billing flows
    5. Call create_shopify_subscription with return_url pointing to callback
    6. Create ShopifyBilling record with PENDING status
    7. Return confirmation_url for frontend to redirect merchant
    """
    try:
        # Step 2: Validate plan_name
        if plan_name not in SHOPIFY_PLAN_PRICES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid plan_name: '{plan_name}'. Must be one of: {list(SHOPIFY_PLAN_PRICES.keys())}",
            )

        # Step 3: Block if ACTIVE billing already exists
        active_result = await db.execute(
            select(ShopifyBilling).where(
                and_(
                    ShopifyBilling.connection_id == connection.id,
                    ShopifyBilling.billing_status == "ACTIVE",
                    ShopifyBilling.deleted_at == None,
                )
            )
        )
        if active_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Connection already has an ACTIVE billing record",
            )

        # Step 4: Clean up stale PENDING records (abandoned billing flows)
        stale_result = await db.execute(
            select(ShopifyBilling).where(
                and_(
                    ShopifyBilling.connection_id == connection.id,
                    ShopifyBilling.billing_status == "PENDING",
                    ShopifyBilling.deleted_at == None,
                )
            )
        )
        stale_pending = stale_result.scalars().all()
        for stale in stale_pending:
            await db.delete(stale)
        if stale_pending:
            await db.flush()
            logger.info(
                "Embedded billing: cleaned up %d stale PENDING record(s) for connection_id=%s",
                len(stale_pending), connection.id,
            )

        # Step 5: Create Shopify subscription charge
        # Uses the SAME callback as standalone but passes embedded=true
        # so callback knows to redirect to /shopify/billing instead of /connections
        return_url = (
            f"{settings.SERVER_URL}/ecommerce/shopify/billing/callback"
            f"?connection_id={connection.id}&embedded=true"
        )

        subscription_result = await create_shopify_subscription(
            store_domain=connection.store_url,
            access_token=connection.api_secret,
            plan_name=plan_name,
            return_url=return_url,
            test=settings.DEBUG,
        )

        # Step 6: Create ShopifyBilling record with PENDING status
        billing = ShopifyBilling(
            connection_id=connection.id,
            organization_id=connection.organization_id,
            shopify_subscription_gid=subscription_result["subscription_gid"],
            plan_name=plan_name,
            billing_status="PENDING",
            test=settings.DEBUG,
        )
        db.add(billing)
        await db.commit()

        logger.info(
            "Embedded billing: created PENDING record for connection_id=%s, plan=%s, gid=%s",
            connection.id, plan_name, subscription_result["subscription_gid"],
        )

        # Step 7: Return confirmation URL
        return {
            "success": True,
            "confirmation_url": subscription_result["confirmation_url"],
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to billing subscribe: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# POST /billing/cancel — Cancel Subscription
# ==========================================
# NOTE: This endpoint uses the Billing API (cancel_shopify_subscription).
# Currently NOT used — app is configured with Managed Pricing in the Partner Dashboard.
# With Managed Pricing, merchants cancel through Shopify's interface, not our endpoint.
# Kept here in case we switch back to Manual Pricing (Billing API) in the future.

@router.post("/billing/cancel")
async def billing_cancel(
    connection: EcommerceConnection = Depends(get_shopify_connection),
    db: AsyncSession = Depends(get_session),
):
    """
    Cancel an active Shopify app subscription for the embedded app's connection.

    No connection_id needed — auto-resolved from session token.

    This endpoint:
    1. Get connection via get_shopify_connection dependency (session token auth)
    2. Get active ShopifyBilling for this connection
    3. Call cancel_shopify_subscription with stored shopify_subscription_gid
    4. Update DB: billing_status=CANCELED, end_date=now()
    """
    try:
        # Step 2: Get active ShopifyBilling
        billing_result = await db.execute(
            select(ShopifyBilling).where(
                and_(
                    ShopifyBilling.connection_id == connection.id,
                    ShopifyBilling.billing_status == "ACTIVE",
                    ShopifyBilling.deleted_at == None,
                )
            )
        )
        billing = billing_result.scalar_one_or_none()
        if not billing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active Shopify billing found for this connection",
            )

        # Step 3: Cancel on Shopify
        await cancel_shopify_subscription(
            store_domain=connection.store_url,
            access_token=connection.api_secret,
            subscription_gid=billing.shopify_subscription_gid,
        )

        # Step 4: Update DB
        billing.billing_status = "CANCELED"
        billing.end_date = datetime.now(timezone.utc)
        await db.commit()

        logger.info(
            "Embedded billing: canceled for connection_id=%s, gid=%s",
            connection.id, billing.shopify_subscription_gid,
        )

        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to billing cancel: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# GET /billing/status — Billing Status
# ==========================================

@router.get("/billing/status")
async def billing_status(
    connection: EcommerceConnection = Depends(get_shopify_connection),
    db: AsyncSession = Depends(get_session),
):
    """
    Get Shopify billing status for the embedded app's connection.

    No connection_id needed — auto-resolved from session token.

    This endpoint:
    1. Get connection via get_shopify_connection dependency (session token auth)
    2. Get ShopifyBilling for this connection
    3. Return billing details from DB
    4. If no record exists → return FREE tier with has_subscription=false
    """
    try:
        # Get ShopifyBilling (exclude soft-deleted)
        billing_result = await db.execute(
            select(ShopifyBilling).where(
                and_(
                    ShopifyBilling.connection_id == connection.id,
                    ShopifyBilling.deleted_at == None,
                )
            )
        )
        billing = billing_result.scalar_one_or_none()

        # Return billing details or FREE defaults
        if not billing:
            return {
                "has_subscription": False,
                "plan_name": "FREE",
                "billing_status": None,
                "start_date": None,
                "end_date": None,
                "test": False,
            }

        return {
            "has_subscription": True,
            "plan_name": billing.plan_name or "FREE",
            "billing_status": billing.billing_status,
            "start_date": billing.start_date.isoformat() if billing.start_date else None,
            "end_date": billing.end_date.isoformat() if billing.end_date else None,
            "test": billing.test,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to billing status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# POST /billing/verify-charge — Verify + Activate Charge
# ==========================================

@router.post("/billing/verify-charge")
async def billing_verify_charge(
    charge_id: int = Query(..., description="Shopify charge ID from billing callback URL"),
    connection: EcommerceConnection = Depends(get_shopify_connection),
    db: AsyncSession = Depends(get_session),
):
    """
    Verify a Shopify charge and activate the billing record.

    Called by the embedded billing callback page after Shopify redirects
    back with a charge_id. Works with both Managed Pricing and Manual Pricing.

    With Managed Pricing, Shopify creates the subscription without our
    appSubscriptionCreate call — so there's no PENDING ShopifyBilling record.
    This endpoint queries Shopify's API directly to verify the charge status,
    then creates or updates the ShopifyBilling record accordingly.

    This endpoint:
    1. Get connection via get_shopify_connection dependency (session token auth)
    2. Construct subscription GID from charge_id
    3. Query Shopify API for subscription status via get_shopify_subscription_status()
    4. If ACTIVE → create or update ShopifyBilling record with ACTIVE status
    5. If not ACTIVE → create or update record with mapped status (CANCELED, PAST_DUE)
    6. Return billing status JSON for the callback page
    """
    try:
        # Construct Shopify subscription GID from numeric charge_id
        subscription_gid = f"gid://shopify/AppSubscription/{charge_id}"

        # Query Shopify API for the subscription status
        subscription = await get_shopify_subscription_status(
            store_domain=connection.store_url,
            access_token=connection.api_secret,
            subscription_gid=subscription_gid,
        )

        if not subscription:
            raise HTTPException(
                status_code=404,
                detail=f"Subscription not found on Shopify for charge_id {charge_id}",
            )

        # Extract subscription details from Shopify response
        shopify_status = subscription.get("status", "")
        shopify_plan_name = subscription.get("name", "")
        is_test = subscription.get("test", False)
        created_at_str = subscription.get("createdAt")

        # Map Shopify status to our billing status
        billing_status = SHOPIFY_STATUS_MAP.get(shopify_status, "CANCELED")

        # Map Shopify plan name ("Pro", "Enterprise") to our tier ("PRO", "ENTERPRISE")
        plan_tier = map_shopify_plan_to_tier(shopify_plan_name)

        # Look for existing ShopifyBilling by GID first, then by connection_id
        # (a new subscription has a different GID, but connection_id has a unique constraint)
        existing_result = await db.execute(
            select(ShopifyBilling).where(
                and_(
                    ShopifyBilling.shopify_subscription_gid == subscription_gid,
                    ShopifyBilling.deleted_at == None,
                )
            )
        )
        existing_billing = existing_result.scalar_one_or_none()

        # If no match by GID, check if a record exists for this connection
        # (merchant re-subscribed → new GID, same connection_id)
        if not existing_billing:
            conn_result = await db.execute(
                select(ShopifyBilling).where(
                    and_(
                        ShopifyBilling.connection_id == connection.id,
                        ShopifyBilling.deleted_at == None,
                    )
                )
            )
            existing_billing = conn_result.scalar_one_or_none()

        if existing_billing:
            # Update existing record (GID may change when merchant re-subscribes)
            existing_billing.shopify_subscription_gid = subscription_gid
            existing_billing.billing_status = billing_status
            existing_billing.plan_name = plan_tier
            existing_billing.test = is_test
            if billing_status == "ACTIVE":
                existing_billing.end_date = None
            else:
                existing_billing.end_date = datetime.now(timezone.utc)

            logger.info(
                "Updated ShopifyBilling %s → %s for connection %s",
                subscription_gid, billing_status, connection.id,
            )
        else:
            # No existing record (first subscription via Managed Pricing) — create new one
            new_billing = ShopifyBilling(
                connection_id=connection.id,
                organization_id=connection.organization_id,
                shopify_subscription_gid=subscription_gid,
                plan_name=plan_tier,
                billing_status=billing_status,
                test=is_test,
                start_date=datetime.fromisoformat(created_at_str.replace("Z", "+00:00")) if created_at_str else datetime.now(timezone.utc),
                end_date=None if billing_status == "ACTIVE" else datetime.now(timezone.utc),
            )
            db.add(new_billing)

            logger.info(
                "Created ShopifyBilling %s → %s for connection %s (Managed Pricing)",
                subscription_gid, billing_status, connection.id,
            )

        await db.commit()

        return {
            "success": True,
            "plan_name": plan_tier,
            "billing_status": billing_status,
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to billing verify charge: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# Mount Gated Sub-Routers
# ==========================================

# Settings — subscription + rate limit
router.include_router(_gated)

# Recommendations + Components — subscription + rate limit + monthly order limit
router.include_router(_gated_recs)
