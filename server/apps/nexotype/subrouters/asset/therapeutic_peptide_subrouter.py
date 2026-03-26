from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import TherapeuticPeptide
from ...schemas.asset.therapeutic_peptide_schemas import (
    MessageResponse,
    TherapeuticPeptideCreate,
    TherapeuticPeptideDetail,
    TherapeuticPeptideListResponse,
    TherapeuticPeptideResponse,
    TherapeuticPeptideUpdate,
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
# Therapeutic Peptides Router
# ==========================================

router = APIRouter(tags=["TherapeuticPeptides"])


@router.get("/", response_model=TherapeuticPeptideListResponse)
async def list_therapeutic_peptides(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List therapeutic peptides with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of therapeutic peptides
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total therapeutic peptides (with filters applied)
        count_query = select(func.count(TherapeuticPeptide.id))
        count_query = apply_default_filters(count_query, TherapeuticPeptide, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get therapeutic peptides with pagination (with filters applied)
        data_query = select(TherapeuticPeptide).order_by(TherapeuticPeptide.name).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, TherapeuticPeptide, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return TherapeuticPeptideListResponse(
            success=True,
            data=[TherapeuticPeptideDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{therapeutic_peptide_id}", response_model=TherapeuticPeptideResponse)
async def get_therapeutic_peptide(
    therapeutic_peptide_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific therapeutic peptide

    This endpoint:
    1. Retrieves a therapeutic peptide by ID (excludes soft-deleted, enforces ownership)
    2. Returns the therapeutic peptide details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=TherapeuticPeptide,
            item_id=therapeutic_peptide_id,
            user_org_id=org_id,
            entity_label="TherapeuticPeptide",
        )
        return TherapeuticPeptideResponse(
            success=True,
            data=TherapeuticPeptideDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=TherapeuticPeptideResponse)
async def create_therapeutic_peptide(
    payload: TherapeuticPeptideCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new therapeutic peptide

    This endpoint:
    1. Creates a new therapeutic peptide with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created therapeutic peptide details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=TherapeuticPeptide,
            filters={"uid": payload.uid},
            entity_label="TherapeuticPeptide",
        )

        item = await create_with_audit(
            db=db,
            model=TherapeuticPeptide,
            table_name="therapeutic_peptides",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return TherapeuticPeptideResponse(
            success=True,
            data=TherapeuticPeptideDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{therapeutic_peptide_id}", response_model=TherapeuticPeptideResponse)
async def update_therapeutic_peptide(
    therapeutic_peptide_id: int,
    payload: TherapeuticPeptideUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a therapeutic peptide

    This endpoint:
    1. Updates a therapeutic peptide with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated therapeutic peptide details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=TherapeuticPeptide,
            item_id=therapeutic_peptide_id,
            user_org_id=org_id,
            entity_label="TherapeuticPeptide",
        )

        # Check if new uid conflicts with another therapeutic peptide
        if payload.uid and payload.uid != item.uid:
            await check_duplicate(
                db=db,
                model=TherapeuticPeptide,
                filters={"uid": payload.uid},
                entity_label="TherapeuticPeptide",
                exclude_id=therapeutic_peptide_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="therapeutic_peptides",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return TherapeuticPeptideResponse(
            success=True,
            data=TherapeuticPeptideDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{therapeutic_peptide_id}", response_model=MessageResponse)
async def delete_therapeutic_peptide(
    therapeutic_peptide_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a therapeutic peptide

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=TherapeuticPeptide,
            item_id=therapeutic_peptide_id,
            user_org_id=org_id,
            entity_label="TherapeuticPeptide",
        )

        label = item.name
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="therapeutic_peptides",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"TherapeuticPeptide {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
