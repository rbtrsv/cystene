from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ..models import EcommerceConnection, RecommendationSettings
from ..schemas.recommendation_settings_schemas import (
    RecommendationSettingsCreate,
    RecommendationSettingsDetail,
    RecommendationSettingsResponse,
    ConnectionSettingsDetail,
    RecommendationSettingsListResponse,
    MessageResponse,
)
from ..utils.dependency_utils import get_user_connection
import logging

# ==========================================
# Recommendation Settings Router
# ==========================================

router = APIRouter(prefix="/settings", tags=["Recommendation Settings"])
logger = logging.getLogger(__name__)


@router.post("/{connection_id}", response_model=RecommendationSettingsResponse)
async def create_or_update_settings(
    connection_id: int,
    payload: RecommendationSettingsCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create or update recommendation settings for a connection

    This endpoint:
    1. Validates the user owns the connection
    2. Checks if settings already exist for this connection
    3. Updates existing settings or creates new ones
    4. Returns the settings details
    """
    try:
        # Validate user owns the connection
        await get_user_connection(connection_id, user.id, db)

        # Check if settings already exist
        existing_result = await db.execute(
            select(RecommendationSettings).where(
                RecommendationSettings.connection_id == connection_id
            )
        )
        existing_settings = existing_result.scalar_one_or_none()

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
                data=RecommendationSettingsDetail.model_validate(existing_settings, from_attributes=True),
            )
        else:
            # Create new settings
            new_settings = RecommendationSettings(
                connection_id=connection_id,
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
                image_aspect=payload.image_aspect,
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
                data=RecommendationSettingsDetail.model_validate(new_settings, from_attributes=True),
            )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to create or update settings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{connection_id}", response_model=RecommendationSettingsResponse)
async def get_settings(
    connection_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get recommendation settings for a connection

    This endpoint:
    1. Validates the user owns the connection
    2. Retrieves the settings for the connection
    3. Returns the settings details
    """
    try:
        # Validate user owns the connection
        await get_user_connection(connection_id, user.id, db)

        # Get settings for this connection (returns saved or defaults)
        result = await db.execute(
            select(RecommendationSettings).where(
                RecommendationSettings.connection_id == connection_id
            )
        )
        settings = result.scalar_one_or_none()

        if settings:
            return RecommendationSettingsResponse(
                success=True,
                data=RecommendationSettingsDetail.model_validate(settings, from_attributes=True),
            )

        # No saved settings — return defaults (settings always "exist" conceptually)
        return RecommendationSettingsResponse(
            success=True,
            data=RecommendationSettingsDetail(
                id=0,
                connection_id=connection_id,
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


@router.get("/", response_model=RecommendationSettingsListResponse)
async def list_connection_settings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List settings for all user connections

    This endpoint:
    1. Queries all connections owned by the user
    2. Retrieves settings for each connection
    3. Returns a list of connections with their settings
    """
    try:
        # Get all user connections (exclude soft-deleted)
        connections_result = await db.execute(
            select(EcommerceConnection).where(
                and_(
                    EcommerceConnection.user_id == user.id,
                    EcommerceConnection.deleted_at == None,
                )
            ).order_by(EcommerceConnection.created_at.desc())
        )
        connections = connections_result.scalars().all()

        # Build response with settings for each connection
        response = []
        for connection in connections:
            settings_result = await db.execute(
                select(RecommendationSettings).where(
                    RecommendationSettings.connection_id == connection.id
                )
            )
            settings = settings_result.scalar_one_or_none()

            response.append(ConnectionSettingsDetail(
                connection_id=connection.id,
                connection_name=connection.connection_name,
                platform=connection.platform,
                settings=RecommendationSettingsDetail.model_validate(settings, from_attributes=True) if settings else None,
            ))

        return RecommendationSettingsListResponse(
            success=True,
            data=response,
            count=len(response),
        )
    except Exception as e:
        logger.exception(f"Failed to list connection settings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{connection_id}", response_model=MessageResponse)
async def delete_settings(
    connection_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Delete recommendation settings for a connection

    This endpoint:
    1. Validates the user owns the connection
    2. Deletes the settings record
    3. Returns a success message
    """
    try:
        # Validate user owns the connection
        await get_user_connection(connection_id, user.id, db)

        # Get settings for this connection
        result = await db.execute(
            select(RecommendationSettings).where(
                RecommendationSettings.connection_id == connection_id
            )
        )
        settings = result.scalar_one_or_none()
        if not settings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Settings not found for this connection"
            )

        # Delete settings
        await db.delete(settings)
        await db.commit()

        return MessageResponse(
            success=True,
            message="Settings have been deleted"
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to delete settings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{connection_id}/reset", response_model=MessageResponse)
async def reset_settings_to_default(
    connection_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Reset recommendation settings to default values

    This endpoint:
    1. Validates the user owns the connection
    2. Deletes existing settings (defaults are applied at query time)
    3. Returns a success message
    """
    try:
        # Validate user owns the connection
        await get_user_connection(connection_id, user.id, db)

        # Delete existing settings if they exist
        existing_result = await db.execute(
            select(RecommendationSettings).where(
                RecommendationSettings.connection_id == connection_id
            )
        )
        existing_settings = existing_result.scalar_one_or_none()

        if existing_settings:
            await db.delete(existing_settings)
            await db.commit()

        return MessageResponse(
            success=True,
            message="Settings reset to default values"
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to reset settings to default: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
