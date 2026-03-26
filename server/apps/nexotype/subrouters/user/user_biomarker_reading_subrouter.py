from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import UserBiomarkerReading
from ...schemas.user.user_biomarker_reading_schemas import (
    UserBiomarkerReadingCreate,
    UserBiomarkerReadingDetail,
    UserBiomarkerReadingListResponse,
    UserBiomarkerReadingResponse,
    UserBiomarkerReadingUpdate,
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
# User Biomarker Readings Router
# ==========================================

router = APIRouter(tags=["UserBiomarkerReadings"])


@router.get("/", response_model=UserBiomarkerReadingListResponse)
async def list_user_biomarker_readings(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List user biomarker readings with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of user biomarker readings
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total user biomarker readings (with filters applied)
        count_query = select(func.count(UserBiomarkerReading.id))
        count_query = apply_default_filters(count_query, UserBiomarkerReading, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get user biomarker readings with pagination (with filters applied)
        data_query = select(UserBiomarkerReading).order_by(UserBiomarkerReading.measured_at).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, UserBiomarkerReading, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return UserBiomarkerReadingListResponse(
            success=True,
            data=[UserBiomarkerReadingDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{reading_id}", response_model=UserBiomarkerReadingResponse)
async def get_user_biomarker_reading(
    reading_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific user biomarker reading

    This endpoint:
    1. Retrieves a user biomarker reading by ID (excludes soft-deleted, enforces ownership)
    2. Returns the user biomarker reading details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=UserBiomarkerReading,
            item_id=reading_id,
            user_org_id=org_id,
            entity_label="UserBiomarkerReading",
        )
        return UserBiomarkerReadingResponse(
            success=True,
            data=UserBiomarkerReadingDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=UserBiomarkerReadingResponse)
async def create_user_biomarker_reading(
    payload: UserBiomarkerReadingCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new user biomarker reading

    This endpoint:
    1. Creates a new user biomarker reading with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created user biomarker reading details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=UserBiomarkerReading,
            table_name="user_biomarker_readings",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return UserBiomarkerReadingResponse(
            success=True,
            data=UserBiomarkerReadingDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{reading_id}", response_model=UserBiomarkerReadingResponse)
async def update_user_biomarker_reading(
    reading_id: int,
    payload: UserBiomarkerReadingUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a user biomarker reading

    This endpoint:
    1. Updates a user biomarker reading with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated user biomarker reading details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=UserBiomarkerReading,
            item_id=reading_id,
            user_org_id=org_id,
            entity_label="UserBiomarkerReading",
        )

        update_data = payload.model_dump(exclude_unset=True)

        await update_with_audit(
            db=db,
            item=item,
            table_name="user_biomarker_readings",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return UserBiomarkerReadingResponse(
            success=True,
            data=UserBiomarkerReadingDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{reading_id}", response_model=MessageResponse)
async def delete_user_biomarker_reading(
    reading_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a user biomarker reading

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=UserBiomarkerReading,
            item_id=reading_id,
            user_org_id=org_id,
            entity_label="UserBiomarkerReading",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="user_biomarker_readings",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"UserBiomarkerReading {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
