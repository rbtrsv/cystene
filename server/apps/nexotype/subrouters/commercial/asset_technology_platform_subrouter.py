from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import AssetTechnologyPlatform
from ...schemas.commercial.asset_technology_platform_schemas import (
    AssetTechnologyPlatformCreate,
    AssetTechnologyPlatformDetail,
    AssetTechnologyPlatformListResponse,
    AssetTechnologyPlatformResponse,
    AssetTechnologyPlatformUpdate,
    MessageResponse,
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
# Asset Technology Platforms Router
# ==========================================

router = APIRouter(tags=["AssetTechnologyPlatforms"])


@router.get("/", response_model=AssetTechnologyPlatformListResponse)
async def list_asset_technology_platforms(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List asset technology platform links with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of asset technology platform links
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total asset technology platforms (with filters applied)
        count_query = select(func.count(AssetTechnologyPlatform.id))
        count_query = apply_default_filters(count_query, AssetTechnologyPlatform, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get asset technology platforms with pagination (with filters applied)
        data_query = select(AssetTechnologyPlatform).order_by(AssetTechnologyPlatform.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, AssetTechnologyPlatform, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return AssetTechnologyPlatformListResponse(
            success=True,
            data=[AssetTechnologyPlatformDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{link_id}", response_model=AssetTechnologyPlatformResponse)
async def get_asset_technology_platform(
    link_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific asset technology platform link

    This endpoint:
    1. Retrieves an asset technology platform link by ID (excludes soft-deleted, enforces ownership)
    2. Returns the asset technology platform link details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=AssetTechnologyPlatform,
            item_id=link_id,
            user_org_id=org_id,
            entity_label="AssetTechnologyPlatform",
        )
        return AssetTechnologyPlatformResponse(
            success=True,
            data=AssetTechnologyPlatformDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=AssetTechnologyPlatformResponse)
async def create_asset_technology_platform(
    payload: AssetTechnologyPlatformCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new asset technology platform link

    This endpoint:
    1. Checks for duplicate asset_id + technology_platform_id combination
    2. Creates a new asset technology platform link with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created asset technology platform link details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Check duplicate asset_id + technology_platform_id (composite unique)
        await check_duplicate(
            db=db,
            model=AssetTechnologyPlatform,
            filters={"asset_id": payload.asset_id, "technology_platform_id": payload.technology_platform_id},
            entity_label="AssetTechnologyPlatform",
        )

        item = await create_with_audit(
            db=db,
            model=AssetTechnologyPlatform,
            table_name="asset_technology_platforms",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return AssetTechnologyPlatformResponse(
            success=True,
            data=AssetTechnologyPlatformDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{link_id}", response_model=AssetTechnologyPlatformResponse)
async def update_asset_technology_platform(
    link_id: int,
    payload: AssetTechnologyPlatformUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update an asset technology platform link

    This endpoint:
    1. Updates an asset technology platform link with the provided data
    2. Checks for duplicate asset_id + technology_platform_id (excluding self, only if either is changing)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated asset technology platform link details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=AssetTechnologyPlatform,
            item_id=link_id,
            user_org_id=org_id,
            entity_label="AssetTechnologyPlatform",
        )

        update_data = payload.model_dump(exclude_unset=True)

        # Check duplicate composite key if either FK is changing
        if "asset_id" in update_data or "technology_platform_id" in update_data:
            new_asset_id = update_data.get("asset_id", item.asset_id)
            new_technology_platform_id = update_data.get("technology_platform_id", item.technology_platform_id)
            if new_asset_id != item.asset_id or new_technology_platform_id != item.technology_platform_id:
                await check_duplicate(
                    db=db,
                    model=AssetTechnologyPlatform,
                    filters={"asset_id": new_asset_id, "technology_platform_id": new_technology_platform_id},
                    entity_label="AssetTechnologyPlatform",
                    exclude_id=link_id,
                )

        await update_with_audit(
            db=db,
            item=item,
            table_name="asset_technology_platforms",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return AssetTechnologyPlatformResponse(
            success=True,
            data=AssetTechnologyPlatformDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{link_id}", response_model=MessageResponse)
async def delete_asset_technology_platform(
    link_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete an asset technology platform link

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=AssetTechnologyPlatform,
            item_id=link_id,
            user_org_id=org_id,
            entity_label="AssetTechnologyPlatform",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="asset_technology_platforms",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"AssetTechnologyPlatform {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
