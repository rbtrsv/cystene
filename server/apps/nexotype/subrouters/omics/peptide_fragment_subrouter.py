from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import PeptideFragment
from ...schemas.omics.peptide_fragment_schemas import (
    MessageResponse,
    PeptideFragmentCreate,
    PeptideFragmentDetail,
    PeptideFragmentListResponse,
    PeptideFragmentResponse,
    PeptideFragmentUpdate,
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
# Peptide Fragments Router
# ==========================================

router = APIRouter(tags=["PeptideFragments"])


@router.get("/", response_model=PeptideFragmentListResponse)
async def list_peptide_fragments(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List peptide fragments with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of peptide fragments
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total peptide fragments (with filters applied)
        count_query = select(func.count(PeptideFragment.id))
        count_query = apply_default_filters(count_query, PeptideFragment, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get peptide fragments with pagination (with filters applied)
        data_query = select(PeptideFragment).order_by(PeptideFragment.sequence).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, PeptideFragment, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return PeptideFragmentListResponse(
            success=True,
            data=[PeptideFragmentDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{peptide_fragment_id}", response_model=PeptideFragmentResponse)
async def get_peptide_fragment(
    peptide_fragment_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific peptide fragment

    This endpoint:
    1. Retrieves a peptide fragment by ID (excludes soft-deleted, enforces ownership)
    2. Returns the peptide fragment details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=PeptideFragment,
            item_id=peptide_fragment_id,
            user_org_id=org_id,
            entity_label="PeptideFragment",
        )
        return PeptideFragmentResponse(
            success=True,
            data=PeptideFragmentDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=PeptideFragmentResponse)
async def create_peptide_fragment(
    payload: PeptideFragmentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new peptide fragment

    This endpoint:
    1. Creates a new peptide fragment with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created peptide fragment details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=PeptideFragment,
            table_name="peptide_fragments",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return PeptideFragmentResponse(
            success=True,
            data=PeptideFragmentDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{peptide_fragment_id}", response_model=PeptideFragmentResponse)
async def update_peptide_fragment(
    peptide_fragment_id: int,
    payload: PeptideFragmentUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a peptide fragment

    This endpoint:
    1. Updates a peptide fragment with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated peptide fragment details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=PeptideFragment,
            item_id=peptide_fragment_id,
            user_org_id=org_id,
            entity_label="PeptideFragment",
        )

        await update_with_audit(
            db=db,
            item=item,
            table_name="peptide_fragments",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return PeptideFragmentResponse(
            success=True,
            data=PeptideFragmentDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{peptide_fragment_id}", response_model=MessageResponse)
async def delete_peptide_fragment(
    peptide_fragment_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a peptide fragment

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=PeptideFragment,
            item_id=peptide_fragment_id,
            user_org_id=org_id,
            entity_label="PeptideFragment",
        )

        label = item.sequence
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="peptide_fragments",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"PeptideFragment {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
