from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import TherapeuticAsset
from ...schemas.asset.therapeutic_asset_schemas import (
    MessageResponse,
    TherapeuticAssetCreate,
    TherapeuticAssetDetail,
    TherapeuticAssetListResponse,
    TherapeuticAssetResponse,
    TherapeuticAssetUpdate,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.filtering_utils import apply_default_filters
from ...utils.crud_utils import (
    check_duplicate,
    create_with_audit,
    get_owned_record_or_404,
    soft_delete_with_audit,
    update_with_audit,
)

# ==========================================
# Therapeutic Assets Router
# ==========================================

router = APIRouter(tags=["TherapeuticAssets"])


@router.get("/", response_model=TherapeuticAssetListResponse)
async def list_therapeutic_assets(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List therapeutic assets with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of therapeutic assets
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total therapeutic assets (with filters applied)
        count_query = select(func.count(TherapeuticAsset.id))
        count_query = apply_default_filters(count_query, TherapeuticAsset, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get therapeutic assets with pagination (with filters applied)
        data_query = select(TherapeuticAsset).order_by(TherapeuticAsset.name).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, TherapeuticAsset, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return TherapeuticAssetListResponse(
            success=True,
            data=[TherapeuticAssetDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{therapeutic_asset_id}", response_model=TherapeuticAssetResponse)
async def get_therapeutic_asset(
    therapeutic_asset_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific therapeutic asset

    This endpoint:
    1. Retrieves a therapeutic asset by ID (excludes soft-deleted, enforces ownership)
    2. Returns the therapeutic asset details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=TherapeuticAsset,
            item_id=therapeutic_asset_id,
            user_org_id=org_id,
            entity_label="TherapeuticAsset",
        )
        return TherapeuticAssetResponse(
            success=True,
            data=TherapeuticAssetDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=TherapeuticAssetResponse)
async def create_therapeutic_asset(
    payload: TherapeuticAssetCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new therapeutic asset

    This endpoint:
    1. Creates a new therapeutic asset with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created therapeutic asset details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=TherapeuticAsset,
            filters={"uid": payload.uid},
            entity_label="TherapeuticAsset",
        )

        item = await create_with_audit(
            db=db,
            model=TherapeuticAsset,
            table_name="therapeutic_assets",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return TherapeuticAssetResponse(
            success=True,
            data=TherapeuticAssetDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{therapeutic_asset_id}", response_model=TherapeuticAssetResponse)
async def update_therapeutic_asset(
    therapeutic_asset_id: int,
    payload: TherapeuticAssetUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a therapeutic asset

    This endpoint:
    1. Updates a therapeutic asset with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated therapeutic asset details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=TherapeuticAsset,
            item_id=therapeutic_asset_id,
            user_org_id=org_id,
            entity_label="TherapeuticAsset",
        )

        # Check if new uid conflicts with another therapeutic asset
        if payload.uid and payload.uid != item.uid:
            await check_duplicate(
                db=db,
                model=TherapeuticAsset,
                filters={"uid": payload.uid},
                entity_label="TherapeuticAsset",
                exclude_id=therapeutic_asset_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="therapeutic_assets",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return TherapeuticAssetResponse(
            success=True,
            data=TherapeuticAssetDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{therapeutic_asset_id}", response_model=MessageResponse)
async def delete_therapeutic_asset(
    therapeutic_asset_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a therapeutic asset

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=TherapeuticAsset,
            item_id=therapeutic_asset_id,
            user_org_id=org_id,
            entity_label="TherapeuticAsset",
        )

        label = item.name
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="therapeutic_assets",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"TherapeuticAsset {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
