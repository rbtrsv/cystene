from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import AssayRun
from ...schemas.lims.assay_run_schemas import (
    AssayRunCreate,
    AssayRunDetail,
    AssayRunListResponse,
    AssayRunResponse,
    AssayRunUpdate,
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
# Assay Runs Router
# ==========================================

router = APIRouter(tags=["AssayRuns"])


@router.get("/", response_model=AssayRunListResponse)
async def list_assay_runs(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List assay runs with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of assay runs
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total assay runs (with filters applied)
        count_query = select(func.count(AssayRun.id))
        count_query = apply_default_filters(count_query, AssayRun, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get assay runs with pagination (with filters applied)
        data_query = select(AssayRun).order_by(AssayRun.run_date).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, AssayRun, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return AssayRunListResponse(
            success=True,
            data=[AssayRunDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{assay_run_id}", response_model=AssayRunResponse)
async def get_assay_run(
    assay_run_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific assay run

    This endpoint:
    1. Retrieves an assay run by ID (excludes soft-deleted, enforces ownership)
    2. Returns the assay run details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=AssayRun,
            item_id=assay_run_id,
            user_org_id=org_id,
            entity_label="AssayRun",
        )
        return AssayRunResponse(
            success=True,
            data=AssayRunDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=AssayRunResponse)
async def create_assay_run(
    payload: AssayRunCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new assay run

    This endpoint:
    1. Creates a new assay run with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created assay run details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=AssayRun,
            table_name="assay_runs",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return AssayRunResponse(
            success=True,
            data=AssayRunDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{assay_run_id}", response_model=AssayRunResponse)
async def update_assay_run(
    assay_run_id: int,
    payload: AssayRunUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update an assay run

    This endpoint:
    1. Updates an assay run with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated assay run details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=AssayRun,
            item_id=assay_run_id,
            user_org_id=org_id,
            entity_label="AssayRun",
        )

        await update_with_audit(
            db=db,
            item=item,
            table_name="assay_runs",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return AssayRunResponse(
            success=True,
            data=AssayRunDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{assay_run_id}", response_model=MessageResponse)
async def delete_assay_run(
    assay_run_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete an assay run

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=AssayRun,
            item_id=assay_run_id,
            user_org_id=org_id,
            entity_label="AssayRun",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="assay_runs",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"AssayRun {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
