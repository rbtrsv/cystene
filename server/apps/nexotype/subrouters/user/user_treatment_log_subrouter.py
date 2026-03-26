from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import UserTreatmentLog
from ...schemas.user.user_treatment_log_schemas import (
    UserTreatmentLogCreate,
    UserTreatmentLogDetail,
    UserTreatmentLogListResponse,
    UserTreatmentLogResponse,
    UserTreatmentLogUpdate,
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
# User Treatment Logs Router
# ==========================================

router = APIRouter(tags=["UserTreatmentLogs"])


@router.get("/", response_model=UserTreatmentLogListResponse)
async def list_user_treatment_logs(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List user treatment logs with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of user treatment logs
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total user treatment logs (with filters applied)
        count_query = select(func.count(UserTreatmentLog.id))
        count_query = apply_default_filters(count_query, UserTreatmentLog, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get user treatment logs with pagination (with filters applied)
        data_query = select(UserTreatmentLog).order_by(UserTreatmentLog.started_at).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, UserTreatmentLog, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return UserTreatmentLogListResponse(
            success=True,
            data=[UserTreatmentLogDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{log_id}", response_model=UserTreatmentLogResponse)
async def get_user_treatment_log(
    log_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific user treatment log

    This endpoint:
    1. Retrieves a user treatment log by ID (excludes soft-deleted, enforces ownership)
    2. Returns the user treatment log details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=UserTreatmentLog,
            item_id=log_id,
            user_org_id=org_id,
            entity_label="UserTreatmentLog",
        )
        return UserTreatmentLogResponse(
            success=True,
            data=UserTreatmentLogDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=UserTreatmentLogResponse)
async def create_user_treatment_log(
    payload: UserTreatmentLogCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new user treatment log

    This endpoint:
    1. Creates a new user treatment log with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created user treatment log details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=UserTreatmentLog,
            table_name="user_treatment_logs",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return UserTreatmentLogResponse(
            success=True,
            data=UserTreatmentLogDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{log_id}", response_model=UserTreatmentLogResponse)
async def update_user_treatment_log(
    log_id: int,
    payload: UserTreatmentLogUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a user treatment log

    This endpoint:
    1. Updates a user treatment log with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated user treatment log details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=UserTreatmentLog,
            item_id=log_id,
            user_org_id=org_id,
            entity_label="UserTreatmentLog",
        )

        update_data = payload.model_dump(exclude_unset=True)

        await update_with_audit(
            db=db,
            item=item,
            table_name="user_treatment_logs",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return UserTreatmentLogResponse(
            success=True,
            data=UserTreatmentLogDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{log_id}", response_model=MessageResponse)
async def delete_user_treatment_log(
    log_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a user treatment log

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=UserTreatmentLog,
            item_id=log_id,
            user_org_id=org_id,
            entity_label="UserTreatmentLog",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="user_treatment_logs",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"UserTreatmentLog {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
