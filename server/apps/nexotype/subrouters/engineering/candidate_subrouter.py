from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Candidate
from ...schemas.engineering.candidate_schemas import (
    CandidateCreate,
    CandidateDetail,
    CandidateListResponse,
    CandidateResponse,
    CandidateUpdate,
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
# Candidates Router
# ==========================================

router = APIRouter(tags=["Candidates"])


@router.get("/", response_model=CandidateListResponse)
async def list_candidates(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List candidates with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of candidates
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total candidates (with filters applied)
        count_query = select(func.count(Candidate.id))
        count_query = apply_default_filters(count_query, Candidate, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get candidates with pagination (with filters applied)
        data_query = select(Candidate).order_by(Candidate.version_number).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Candidate, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return CandidateListResponse(
            success=True,
            data=[CandidateDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(
    candidate_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific candidate

    This endpoint:
    1. Retrieves a candidate by ID (excludes soft-deleted, enforces ownership)
    2. Returns the candidate details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Candidate,
            item_id=candidate_id,
            user_org_id=org_id,
            entity_label="Candidate",
        )
        return CandidateResponse(
            success=True,
            data=CandidateDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=CandidateResponse)
async def create_candidate(
    payload: CandidateCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new candidate

    This endpoint:
    1. Creates a new candidate with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created candidate details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=Candidate,
            table_name="candidates",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return CandidateResponse(
            success=True,
            data=CandidateDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(
    candidate_id: int,
    payload: CandidateUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a candidate

    This endpoint:
    1. Updates a candidate with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated candidate details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Candidate,
            item_id=candidate_id,
            user_org_id=org_id,
            entity_label="Candidate",
        )

        await update_with_audit(
            db=db,
            item=item,
            table_name="candidates",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return CandidateResponse(
            success=True,
            data=CandidateDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{candidate_id}", response_model=MessageResponse)
async def delete_candidate(
    candidate_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a candidate

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Candidate,
            item_id=candidate_id,
            user_org_id=org_id,
            entity_label="Candidate",
        )

        label = item.version_number
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="candidates",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Candidate {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
