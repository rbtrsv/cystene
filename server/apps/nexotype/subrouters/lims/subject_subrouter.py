from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Subject
from ...schemas.lims.subject_schemas import (
    MessageResponse,
    SubjectCreate,
    SubjectDetail,
    SubjectListResponse,
    SubjectResponse,
    SubjectUpdate,
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
# Subjects Router
# ==========================================

router = APIRouter(tags=["Subjects"])


@router.get("/", response_model=SubjectListResponse)
async def list_subjects(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List subjects with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of subjects
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total subjects (with filters applied)
        count_query = select(func.count(Subject.id))
        count_query = apply_default_filters(count_query, Subject, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get subjects with pagination (with filters applied)
        data_query = select(Subject).order_by(Subject.subject_identifier).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Subject, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return SubjectListResponse(
            success=True,
            data=[SubjectDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(
    subject_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific subject

    This endpoint:
    1. Retrieves a subject by ID (excludes soft-deleted, enforces ownership)
    2. Returns the subject details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Subject,
            item_id=subject_id,
            user_org_id=org_id,
            entity_label="Subject",
        )
        return SubjectResponse(
            success=True,
            data=SubjectDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=SubjectResponse)
async def create_subject(
    payload: SubjectCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new subject

    This endpoint:
    1. Creates a new subject with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created subject details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=Subject,
            filters={"subject_identifier": payload.subject_identifier},
            entity_label="Subject",
        )

        item = await create_with_audit(
            db=db,
            model=Subject,
            table_name="subjects",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return SubjectResponse(
            success=True,
            data=SubjectDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a subject

    This endpoint:
    1. Updates a subject with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated subject details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Subject,
            item_id=subject_id,
            user_org_id=org_id,
            entity_label="Subject",
        )

        # Check if new subject_identifier conflicts with another subject
        if payload.subject_identifier and payload.subject_identifier != item.subject_identifier:
            await check_duplicate(
                db=db,
                model=Subject,
                filters={"subject_identifier": payload.subject_identifier},
                entity_label="Subject",
                exclude_id=subject_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="subjects",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return SubjectResponse(
            success=True,
            data=SubjectDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{subject_id}", response_model=MessageResponse)
async def delete_subject(
    subject_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a subject

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Subject,
            item_id=subject_id,
            user_org_id=org_id,
            entity_label="Subject",
        )

        label = item.subject_identifier
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="subjects",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Subject {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
