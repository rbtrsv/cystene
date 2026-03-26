from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Construct
from ...schemas.engineering.construct_schemas import (
    ConstructCreate,
    ConstructDetail,
    ConstructListResponse,
    ConstructResponse,
    ConstructUpdate,
    MessageResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.filtering_utils import apply_default_filters
from ...utils.crud_utils import (
    create_with_audit,
    get_owned_record_or_404,
    soft_delete_with_audit,
    update_with_audit,
)

# ==========================================
# Constructs Router
# ==========================================

router = APIRouter(tags=["Constructs"])


@router.get("/", response_model=ConstructListResponse)
async def list_constructs(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List constructs with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of constructs
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total constructs (with filters applied)
        count_query = select(func.count(Construct.id))
        count_query = apply_default_filters(count_query, Construct, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get constructs with pagination (with filters applied)
        data_query = select(Construct).order_by(Construct.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Construct, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return ConstructListResponse(
            success=True,
            data=[ConstructDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{construct_id}", response_model=ConstructResponse)
async def get_construct(
    construct_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific construct

    This endpoint:
    1. Retrieves a construct by ID (excludes soft-deleted, enforces ownership)
    2. Returns the construct details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Construct,
            item_id=construct_id,
            user_org_id=org_id,
            entity_label="Construct",
        )
        return ConstructResponse(
            success=True,
            data=ConstructDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=ConstructResponse)
async def create_construct(
    payload: ConstructCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new construct

    This endpoint:
    1. Creates a new construct with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created construct details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=Construct,
            table_name="constructs",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return ConstructResponse(
            success=True,
            data=ConstructDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{construct_id}", response_model=ConstructResponse)
async def update_construct(
    construct_id: int,
    payload: ConstructUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a construct

    This endpoint:
    1. Updates a construct with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated construct details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Construct,
            item_id=construct_id,
            user_org_id=org_id,
            entity_label="Construct",
        )

        await update_with_audit(
            db=db,
            item=item,
            table_name="constructs",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return ConstructResponse(
            success=True,
            data=ConstructDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{construct_id}", response_model=MessageResponse)
async def delete_construct(
    construct_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a construct

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Construct,
            item_id=construct_id,
            user_org_id=org_id,
            entity_label="Construct",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="constructs",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Construct {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
