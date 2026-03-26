from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import UnitOfMeasure
from ...schemas.standardization.unit_of_measure_schemas import (
    MessageResponse,
    UnitOfMeasureCreate,
    UnitOfMeasureDetail,
    UnitOfMeasureListResponse,
    UnitOfMeasureResponse,
    UnitOfMeasureUpdate,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.filtering_utils import apply_default_filters
from ...utils.crud_utils import (
    check_duplicate,
    create_or_restore_with_audit,
    get_owned_record_or_404,
    soft_delete_with_audit,
    update_with_audit,
)

# ==========================================
# Units of Measure Router
# ==========================================

router = APIRouter(tags=["UnitsOfMeasure"])


@router.get("/", response_model=UnitOfMeasureListResponse)
async def list_units_of_measure(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List units of measure with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of units of measure
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total units of measure (with filters applied)
        count_query = select(func.count(UnitOfMeasure.id))
        count_query = apply_default_filters(count_query, UnitOfMeasure, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get units of measure with pagination (with filters applied)
        data_query = select(UnitOfMeasure).order_by(UnitOfMeasure.name).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, UnitOfMeasure, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return UnitOfMeasureListResponse(
            success=True,
            data=[UnitOfMeasureDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{unit_of_measure_id}", response_model=UnitOfMeasureResponse)
async def get_unit_of_measure(
    unit_of_measure_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific unit of measure

    This endpoint:
    1. Retrieves a unit of measure by ID (excludes soft-deleted, enforces ownership)
    2. Returns the unit of measure details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=UnitOfMeasure,
            item_id=unit_of_measure_id,
            user_org_id=org_id,
            entity_label="UnitOfMeasure",
        )
        return UnitOfMeasureResponse(
            success=True,
            data=UnitOfMeasureDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=UnitOfMeasureResponse)
async def create_unit_of_measure(
    payload: UnitOfMeasureCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new unit of measure

    This endpoint:
    1. Creates a new unit of measure or restores a soft-deleted one with same symbol
    2. Sets created_by and organization_id from user context
    3. Logs the creation (INSERT) or restoration (RESTORE) to the audit log
    4. Returns the created/restored unit of measure details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Create new or restore soft-deleted record with same symbol
        item = await create_or_restore_with_audit(
            db=db,
            model=UnitOfMeasure,
            table_name="units_of_measure",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
            unique_fields={"symbol": payload.symbol},
            entity_label="UnitOfMeasure",
        )

        await db.commit()
        await db.refresh(item)
        return UnitOfMeasureResponse(
            success=True,
            data=UnitOfMeasureDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{unit_of_measure_id}", response_model=UnitOfMeasureResponse)
async def update_unit_of_measure(
    unit_of_measure_id: int,
    payload: UnitOfMeasureUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a unit of measure

    This endpoint:
    1. Updates a unit of measure with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated unit of measure details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=UnitOfMeasure,
            item_id=unit_of_measure_id,
            user_org_id=org_id,
            entity_label="UnitOfMeasure",
        )

        # Check if new symbol conflicts with another unit of measure
        if payload.symbol and payload.symbol != item.symbol:
            await check_duplicate(
                db=db,
                model=UnitOfMeasure,
                filters={"symbol": payload.symbol},
                entity_label="UnitOfMeasure",
                exclude_id=unit_of_measure_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="units_of_measure",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return UnitOfMeasureResponse(
            success=True,
            data=UnitOfMeasureDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{unit_of_measure_id}", response_model=MessageResponse)
async def delete_unit_of_measure(
    unit_of_measure_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a unit of measure

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=UnitOfMeasure,
            item_id=unit_of_measure_id,
            user_org_id=org_id,
            entity_label="UnitOfMeasure",
        )

        label = item.name
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="units_of_measure",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"UnitOfMeasure {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
