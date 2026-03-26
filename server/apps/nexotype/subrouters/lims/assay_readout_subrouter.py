from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import AssayReadout
from ...schemas.lims.assay_readout_schemas import (
    AssayReadoutCreate,
    AssayReadoutDetail,
    AssayReadoutListResponse,
    AssayReadoutResponse,
    AssayReadoutUpdate,
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
# Assay Readouts Router
# ==========================================

router = APIRouter(tags=["AssayReadouts"])


@router.get("/", response_model=AssayReadoutListResponse)
async def list_assay_readouts(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List assay readouts with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of assay readouts
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total assay readouts (with filters applied)
        count_query = select(func.count(AssayReadout.id))
        count_query = apply_default_filters(count_query, AssayReadout, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get assay readouts with pagination (with filters applied)
        data_query = select(AssayReadout).order_by(AssayReadout.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, AssayReadout, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return AssayReadoutListResponse(
            success=True,
            data=[AssayReadoutDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{assay_readout_id}", response_model=AssayReadoutResponse)
async def get_assay_readout(
    assay_readout_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific assay readout

    This endpoint:
    1. Retrieves an assay readout by ID (excludes soft-deleted, enforces ownership)
    2. Returns the assay readout details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=AssayReadout,
            item_id=assay_readout_id,
            user_org_id=org_id,
            entity_label="AssayReadout",
        )
        return AssayReadoutResponse(
            success=True,
            data=AssayReadoutDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=AssayReadoutResponse)
async def create_assay_readout(
    payload: AssayReadoutCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new assay readout

    This endpoint:
    1. Creates a new assay readout with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created assay readout details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=AssayReadout,
            table_name="assay_readouts",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return AssayReadoutResponse(
            success=True,
            data=AssayReadoutDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{assay_readout_id}", response_model=AssayReadoutResponse)
async def update_assay_readout(
    assay_readout_id: int,
    payload: AssayReadoutUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update an assay readout

    This endpoint:
    1. Updates an assay readout with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated assay readout details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=AssayReadout,
            item_id=assay_readout_id,
            user_org_id=org_id,
            entity_label="AssayReadout",
        )

        await update_with_audit(
            db=db,
            item=item,
            table_name="assay_readouts",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return AssayReadoutResponse(
            success=True,
            data=AssayReadoutDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{assay_readout_id}", response_model=MessageResponse)
async def delete_assay_readout(
    assay_readout_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete an assay readout

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=AssayReadout,
            item_id=assay_readout_id,
            user_org_id=org_id,
            entity_label="AssayReadout",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="assay_readouts",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"AssayReadout {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
