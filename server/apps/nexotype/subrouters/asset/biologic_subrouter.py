from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Biologic
from ...schemas.asset.biologic_schemas import (
    BiologicCreate,
    BiologicDetail,
    BiologicListResponse,
    BiologicResponse,
    BiologicUpdate,
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
# Biologics Router
# ==========================================

router = APIRouter(tags=["Biologics"])


@router.get("/", response_model=BiologicListResponse)
async def list_biologics(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List biologics with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of biologics
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total biologics (with filters applied)
        count_query = select(func.count(Biologic.id))
        count_query = apply_default_filters(count_query, Biologic, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get biologics with pagination (with filters applied)
        data_query = select(Biologic).order_by(Biologic.name).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Biologic, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return BiologicListResponse(
            success=True,
            data=[BiologicDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{biologic_id}", response_model=BiologicResponse)
async def get_biologic(
    biologic_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific biologic

    This endpoint:
    1. Retrieves a biologic by ID (excludes soft-deleted, enforces ownership)
    2. Returns the biologic details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Biologic,
            item_id=biologic_id,
            user_org_id=org_id,
            entity_label="Biologic",
        )
        return BiologicResponse(
            success=True,
            data=BiologicDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=BiologicResponse)
async def create_biologic(
    payload: BiologicCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new biologic

    This endpoint:
    1. Creates a new biologic with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created biologic details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=Biologic,
            filters={"uid": payload.uid},
            entity_label="Biologic",
        )

        item = await create_with_audit(
            db=db,
            model=Biologic,
            table_name="biologics",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return BiologicResponse(
            success=True,
            data=BiologicDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{biologic_id}", response_model=BiologicResponse)
async def update_biologic(
    biologic_id: int,
    payload: BiologicUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a biologic

    This endpoint:
    1. Updates a biologic with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated biologic details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Biologic,
            item_id=biologic_id,
            user_org_id=org_id,
            entity_label="Biologic",
        )

        # Check if new uid conflicts with another biologic
        if payload.uid and payload.uid != item.uid:
            await check_duplicate(
                db=db,
                model=Biologic,
                filters={"uid": payload.uid},
                entity_label="Biologic",
                exclude_id=biologic_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="biologics",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return BiologicResponse(
            success=True,
            data=BiologicDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{biologic_id}", response_model=MessageResponse)
async def delete_biologic(
    biologic_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a biologic

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Biologic,
            item_id=biologic_id,
            user_org_id=org_id,
            entity_label="Biologic",
        )

        label = item.name
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="biologics",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Biologic {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
