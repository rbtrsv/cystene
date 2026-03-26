from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Indication
from ...schemas.clinical.indication_schemas import (
    IndicationCreate,
    IndicationDetail,
    IndicationListResponse,
    IndicationResponse,
    IndicationUpdate,
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
# Indications Router
# ==========================================

router = APIRouter(tags=["Indications"])


@router.get("/", response_model=IndicationListResponse)
async def list_indications(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List indications with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of indications
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total indications (with filters applied)
        count_query = select(func.count(Indication.id))
        count_query = apply_default_filters(count_query, Indication, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get indications with pagination (with filters applied)
        data_query = select(Indication).order_by(Indication.name).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Indication, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return IndicationListResponse(
            success=True,
            data=[IndicationDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{indication_id}", response_model=IndicationResponse)
async def get_indication(
    indication_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific indication

    This endpoint:
    1. Retrieves an indication by ID (excludes soft-deleted, enforces ownership)
    2. Returns the indication details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Indication,
            item_id=indication_id,
            user_org_id=org_id,
            entity_label="Indication",
        )
        return IndicationResponse(
            success=True,
            data=IndicationDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=IndicationResponse)
async def create_indication(
    payload: IndicationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new indication

    This endpoint:
    1. Creates a new indication with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created indication details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=Indication,
            table_name="indications",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return IndicationResponse(
            success=True,
            data=IndicationDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{indication_id}", response_model=IndicationResponse)
async def update_indication(
    indication_id: int,
    payload: IndicationUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update an indication

    This endpoint:
    1. Updates an indication with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated indication details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Indication,
            item_id=indication_id,
            user_org_id=org_id,
            entity_label="Indication",
        )

        await update_with_audit(
            db=db,
            item=item,
            table_name="indications",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return IndicationResponse(
            success=True,
            data=IndicationDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{indication_id}", response_model=MessageResponse)
async def delete_indication(
    indication_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete an indication

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Indication,
            item_id=indication_id,
            user_org_id=org_id,
            entity_label="Indication",
        )

        label = item.name
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="indications",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Indication {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
