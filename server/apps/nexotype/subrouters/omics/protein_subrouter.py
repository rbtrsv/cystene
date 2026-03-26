from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Protein
from ...schemas.omics.protein_schemas import (
    MessageResponse,
    ProteinCreate,
    ProteinDetail,
    ProteinListResponse,
    ProteinResponse,
    ProteinUpdate,
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
# Proteins Router
# ==========================================

router = APIRouter(tags=["Proteins"])


@router.get("/", response_model=ProteinListResponse)
async def list_proteins(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List proteins with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of proteins
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total proteins (with filters applied)
        count_query = select(func.count(Protein.id))
        count_query = apply_default_filters(count_query, Protein, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get proteins with pagination (with filters applied)
        data_query = select(Protein).order_by(Protein.uniprot_accession).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Protein, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return ProteinListResponse(
            success=True,
            data=[ProteinDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{protein_id}", response_model=ProteinResponse)
async def get_protein(
    protein_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific protein

    This endpoint:
    1. Retrieves a protein by ID (excludes soft-deleted, enforces ownership)
    2. Returns the protein details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Protein,
            item_id=protein_id,
            user_org_id=org_id,
            entity_label="Protein",
        )
        return ProteinResponse(
            success=True,
            data=ProteinDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=ProteinResponse)
async def create_protein(
    payload: ProteinCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new protein

    This endpoint:
    1. Creates a new protein with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created protein details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=Protein,
            filters={"uniprot_accession": payload.uniprot_accession},
            entity_label="Protein",
        )

        item = await create_with_audit(
            db=db,
            model=Protein,
            table_name="proteins",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return ProteinResponse(
            success=True,
            data=ProteinDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{protein_id}", response_model=ProteinResponse)
async def update_protein(
    protein_id: int,
    payload: ProteinUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a protein

    This endpoint:
    1. Updates a protein with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated protein details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Protein,
            item_id=protein_id,
            user_org_id=org_id,
            entity_label="Protein",
        )

        # Check if new uniprot_accession conflicts with another protein
        if payload.uniprot_accession and payload.uniprot_accession != item.uniprot_accession:
            await check_duplicate(
                db=db,
                model=Protein,
                filters={"uniprot_accession": payload.uniprot_accession},
                entity_label="Protein",
                exclude_id=protein_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="proteins",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return ProteinResponse(
            success=True,
            data=ProteinDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{protein_id}", response_model=MessageResponse)
async def delete_protein(
    protein_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a protein

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Protein,
            item_id=protein_id,
            user_org_id=org_id,
            entity_label="Protein",
        )

        label = item.uniprot_accession
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="proteins",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Protein {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
