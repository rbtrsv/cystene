from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Transcript
from ...schemas.omics.transcript_schemas import (
    MessageResponse,
    TranscriptCreate,
    TranscriptDetail,
    TranscriptListResponse,
    TranscriptResponse,
    TranscriptUpdate,
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
# Transcripts Router
# ==========================================

router = APIRouter(tags=["Transcripts"])


@router.get("/", response_model=TranscriptListResponse)
async def list_transcripts(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List transcripts with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of transcripts
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total transcripts (with filters applied)
        count_query = select(func.count(Transcript.id))
        count_query = apply_default_filters(count_query, Transcript, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get transcripts with pagination (with filters applied)
        data_query = select(Transcript).order_by(Transcript.ensembl_transcript_id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Transcript, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return TranscriptListResponse(
            success=True,
            data=[TranscriptDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{transcript_id}", response_model=TranscriptResponse)
async def get_transcript(
    transcript_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific transcript

    This endpoint:
    1. Retrieves a transcript by ID (excludes soft-deleted, enforces ownership)
    2. Returns the transcript details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Transcript,
            item_id=transcript_id,
            user_org_id=org_id,
            entity_label="Transcript",
        )
        return TranscriptResponse(
            success=True,
            data=TranscriptDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=TranscriptResponse)
async def create_transcript(
    payload: TranscriptCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new transcript

    This endpoint:
    1. Creates a new transcript with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created transcript details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=Transcript,
            filters={"ensembl_transcript_id": payload.ensembl_transcript_id},
            entity_label="Transcript",
        )

        item = await create_with_audit(
            db=db,
            model=Transcript,
            table_name="transcripts",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return TranscriptResponse(
            success=True,
            data=TranscriptDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{transcript_id}", response_model=TranscriptResponse)
async def update_transcript(
    transcript_id: int,
    payload: TranscriptUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a transcript

    This endpoint:
    1. Updates a transcript with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated transcript details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Transcript,
            item_id=transcript_id,
            user_org_id=org_id,
            entity_label="Transcript",
        )

        # Check if new ensembl_transcript_id conflicts with another transcript
        if payload.ensembl_transcript_id and payload.ensembl_transcript_id != item.ensembl_transcript_id:
            await check_duplicate(
                db=db,
                model=Transcript,
                filters={"ensembl_transcript_id": payload.ensembl_transcript_id},
                entity_label="Transcript",
                exclude_id=transcript_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="transcripts",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return TranscriptResponse(
            success=True,
            data=TranscriptDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{transcript_id}", response_model=MessageResponse)
async def delete_transcript(
    transcript_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a transcript

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Transcript,
            item_id=transcript_id,
            user_org_id=org_id,
            entity_label="Transcript",
        )

        label = item.ensembl_transcript_id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="transcripts",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Transcript {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
