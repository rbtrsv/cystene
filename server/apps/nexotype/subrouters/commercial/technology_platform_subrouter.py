from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import TechnologyPlatform
from ...schemas.commercial.technology_platform_schemas import (
    TechnologyPlatformCreate,
    TechnologyPlatformDetail,
    TechnologyPlatformListResponse,
    TechnologyPlatformResponse,
    TechnologyPlatformUpdate,
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
# Technology Platforms Router
# ==========================================

router = APIRouter(tags=["TechnologyPlatforms"])


@router.get("/", response_model=TechnologyPlatformListResponse)
async def list_technology_platforms(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List technology platforms with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of technology platforms
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total technology platforms (with filters applied)
        count_query = select(func.count(TechnologyPlatform.id))
        count_query = apply_default_filters(count_query, TechnologyPlatform, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get technology platforms with pagination (with filters applied)
        data_query = select(TechnologyPlatform).order_by(TechnologyPlatform.name).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, TechnologyPlatform, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return TechnologyPlatformListResponse(
            success=True,
            data=[TechnologyPlatformDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{platform_id}", response_model=TechnologyPlatformResponse)
async def get_technology_platform(
    platform_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific technology platform

    This endpoint:
    1. Retrieves a technology platform by ID (excludes soft-deleted, enforces ownership)
    2. Returns the technology platform details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=TechnologyPlatform,
            item_id=platform_id,
            user_org_id=org_id,
            entity_label="TechnologyPlatform",
        )
        return TechnologyPlatformResponse(
            success=True,
            data=TechnologyPlatformDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=TechnologyPlatformResponse)
async def create_technology_platform(
    payload: TechnologyPlatformCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new technology platform

    This endpoint:
    1. Checks for duplicate name
    2. Creates a new technology platform with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created technology platform details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Check duplicate name (single unique)
        await check_duplicate(
            db=db,
            model=TechnologyPlatform,
            filters={"name": payload.name},
            entity_label="TechnologyPlatform",
        )

        item = await create_with_audit(
            db=db,
            model=TechnologyPlatform,
            table_name="technology_platforms",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return TechnologyPlatformResponse(
            success=True,
            data=TechnologyPlatformDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{platform_id}", response_model=TechnologyPlatformResponse)
async def update_technology_platform(
    platform_id: int,
    payload: TechnologyPlatformUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a technology platform

    This endpoint:
    1. Updates a technology platform with the provided data
    2. Checks for duplicate name (excluding self, only if name is changing)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated technology platform details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=TechnologyPlatform,
            item_id=platform_id,
            user_org_id=org_id,
            entity_label="TechnologyPlatform",
        )

        update_data = payload.model_dump(exclude_unset=True)

        # Check duplicate name if name is changing
        if "name" in update_data and update_data["name"] != item.name:
            await check_duplicate(
                db=db,
                model=TechnologyPlatform,
                filters={"name": update_data["name"]},
                entity_label="TechnologyPlatform",
                exclude_id=platform_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="technology_platforms",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return TechnologyPlatformResponse(
            success=True,
            data=TechnologyPlatformDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{platform_id}", response_model=MessageResponse)
async def delete_technology_platform(
    platform_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a technology platform

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=TechnologyPlatform,
            item_id=platform_id,
            user_org_id=org_id,
            entity_label="TechnologyPlatform",
        )

        label = item.name
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="technology_platforms",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"TechnologyPlatform {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
