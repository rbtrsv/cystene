from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import OrganizationTechnologyPlatform
from ...schemas.commercial.organization_technology_platform_schemas import (
    OrganizationTechnologyPlatformCreate,
    OrganizationTechnologyPlatformDetail,
    OrganizationTechnologyPlatformListResponse,
    OrganizationTechnologyPlatformResponse,
    OrganizationTechnologyPlatformUpdate,
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
# Organization Technology Platforms Router
# ==========================================

router = APIRouter(tags=["OrganizationTechnologyPlatforms"])


@router.get("/", response_model=OrganizationTechnologyPlatformListResponse)
async def list_organization_technology_platforms(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List organization technology platform links with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of organization technology platform links
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total organization technology platforms (with filters applied)
        count_query = select(func.count(OrganizationTechnologyPlatform.id))
        count_query = apply_default_filters(count_query, OrganizationTechnologyPlatform, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get organization technology platforms with pagination (with filters applied)
        data_query = select(OrganizationTechnologyPlatform).order_by(OrganizationTechnologyPlatform.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, OrganizationTechnologyPlatform, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return OrganizationTechnologyPlatformListResponse(
            success=True,
            data=[OrganizationTechnologyPlatformDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{link_id}", response_model=OrganizationTechnologyPlatformResponse)
async def get_organization_technology_platform(
    link_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific organization technology platform link

    This endpoint:
    1. Retrieves an organization technology platform link by ID (excludes soft-deleted, enforces ownership)
    2. Returns the organization technology platform link details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=OrganizationTechnologyPlatform,
            item_id=link_id,
            user_org_id=org_id,
            entity_label="OrganizationTechnologyPlatform",
        )
        return OrganizationTechnologyPlatformResponse(
            success=True,
            data=OrganizationTechnologyPlatformDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=OrganizationTechnologyPlatformResponse)
async def create_organization_technology_platform(
    payload: OrganizationTechnologyPlatformCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new organization technology platform link

    This endpoint:
    1. Checks for duplicate market_organization_id + technology_platform_id combination
    2. Creates a new organization technology platform link with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created organization technology platform link details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Check duplicate market_organization_id + technology_platform_id (composite unique)
        await check_duplicate(
            db=db,
            model=OrganizationTechnologyPlatform,
            filters={"market_organization_id": payload.market_organization_id, "technology_platform_id": payload.technology_platform_id},
            entity_label="OrganizationTechnologyPlatform",
        )

        item = await create_with_audit(
            db=db,
            model=OrganizationTechnologyPlatform,
            table_name="organization_technology_platforms",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return OrganizationTechnologyPlatformResponse(
            success=True,
            data=OrganizationTechnologyPlatformDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{link_id}", response_model=OrganizationTechnologyPlatformResponse)
async def update_organization_technology_platform(
    link_id: int,
    payload: OrganizationTechnologyPlatformUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update an organization technology platform link

    This endpoint:
    1. Updates an organization technology platform link with the provided data
    2. Checks for duplicate market_organization_id + technology_platform_id (excluding self, only if either is changing)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated organization technology platform link details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=OrganizationTechnologyPlatform,
            item_id=link_id,
            user_org_id=org_id,
            entity_label="OrganizationTechnologyPlatform",
        )

        update_data = payload.model_dump(exclude_unset=True)

        # Check duplicate composite key if either FK is changing
        if "market_organization_id" in update_data or "technology_platform_id" in update_data:
            new_market_organization_id = update_data.get("market_organization_id", item.market_organization_id)
            new_technology_platform_id = update_data.get("technology_platform_id", item.technology_platform_id)
            if new_market_organization_id != item.market_organization_id or new_technology_platform_id != item.technology_platform_id:
                await check_duplicate(
                    db=db,
                    model=OrganizationTechnologyPlatform,
                    filters={"market_organization_id": new_market_organization_id, "technology_platform_id": new_technology_platform_id},
                    entity_label="OrganizationTechnologyPlatform",
                    exclude_id=link_id,
                )

        await update_with_audit(
            db=db,
            item=item,
            table_name="organization_technology_platforms",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return OrganizationTechnologyPlatformResponse(
            success=True,
            data=OrganizationTechnologyPlatformDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{link_id}", response_model=MessageResponse)
async def delete_organization_technology_platform(
    link_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete an organization technology platform link

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=OrganizationTechnologyPlatform,
            item_id=link_id,
            user_org_id=org_id,
            entity_label="OrganizationTechnologyPlatform",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="organization_technology_platforms",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"OrganizationTechnologyPlatform {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
