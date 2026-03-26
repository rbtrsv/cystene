from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ..schemas.recommendation_schemas import (
    BestsellerRequest,
    CrossSellRequest,
    UpsellRequest,
    SimilarProductsRequest,
    RecommendationResult,
    RecommendationResponse,
)
from ..adapters.factory import get_adapter
from ..engine.engine import RecommendationEngine
from ..utils.dependency_utils import get_active_connection, enforce_monthly_order_limit
from ..utils.cache_utils import get_cached_recommendations, set_cached_recommendations

# ==========================================
# Product Recommendations Router
# ==========================================

router = APIRouter(
    prefix="/recommendations",
    tags=["Product Recommendations"],
    dependencies=[Depends(enforce_monthly_order_limit)],
)


@router.post("/bestsellers", response_model=RecommendationResponse)
async def get_bestsellers(
    payload: BestsellerRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get bestselling products

    This endpoint:
    1. Validates the user owns an active connection
    2. Creates the platform adapter and recommendation engine
    3. Generates bestseller recommendations using volume, value, or balanced method
    4. Returns the recommendation results
    """
    try:
        # Validate user owns an active connection
        connection = await get_active_connection(payload.connection_id, user.id, db)

        # Create adapter and engine
        adapter = get_adapter(connection, db)
        engine = RecommendationEngine(adapter)

        # Check cache first
        cached = await get_cached_recommendations(
            payload.connection_id, "bestseller",
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
                payload.connection_id, "bestseller", recommendations,
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
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")


@router.post("/cross-sell", response_model=RecommendationResponse)
async def get_cross_sell(
    payload: CrossSellRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get frequently bought together products

    This endpoint:
    1. Validates the user owns an active connection
    2. Creates the platform adapter and recommendation engine
    3. Generates cross-sell recommendations using market basket analysis
    4. Returns the recommendation results
    """
    try:
        # Validate user owns an active connection
        connection = await get_active_connection(payload.connection_id, user.id, db)

        # Create adapter and engine
        adapter = get_adapter(connection, db)
        engine = RecommendationEngine(adapter)

        # Check cache first
        cached = await get_cached_recommendations(
            payload.connection_id, "cross_sell",
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
                payload.connection_id, "cross_sell", recommendations,
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
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")


@router.post("/upsell", response_model=RecommendationResponse)
async def get_upsell(
    payload: UpsellRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get higher-priced alternatives in same category

    This endpoint:
    1. Validates the user owns an active connection
    2. Creates the platform adapter and recommendation engine
    3. Generates upsell recommendations above the price threshold
    4. Returns the recommendation results
    """
    try:
        # Validate user owns an active connection
        connection = await get_active_connection(payload.connection_id, user.id, db)

        # Create adapter and engine
        adapter = get_adapter(connection, db)
        engine = RecommendationEngine(adapter)

        # Check cache first
        cached = await get_cached_recommendations(
            payload.connection_id, "upsell",
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
                payload.connection_id, "upsell", recommendations,
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
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")


@router.post("/similar", response_model=RecommendationResponse)
async def get_similar_products(
    payload: SimilarProductsRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get similar products based on category, vendor, and attributes

    This endpoint:
    1. Validates the user owns an active connection
    2. Creates the platform adapter and recommendation engine
    3. Generates similar product recommendations
    4. Returns the recommendation results
    """
    try:
        # Validate user owns an active connection
        connection = await get_active_connection(payload.connection_id, user.id, db)

        # Create adapter and engine
        adapter = get_adapter(connection, db)
        engine = RecommendationEngine(adapter)

        # Check cache first
        cached = await get_cached_recommendations(
            payload.connection_id, "similar",
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
                payload.connection_id, "similar", recommendations,
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
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")
