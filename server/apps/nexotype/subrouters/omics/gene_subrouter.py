from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Gene
from ...schemas.omics.gene_schemas import (
    GeneCreate,
    GeneDetail,
    GeneListResponse,
    GeneResponse,
    GeneUpdate,
    MessageResponse,
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
# Genes Router
# ==========================================

router = APIRouter(tags=["Genes"])


@router.get("/", response_model=GeneListResponse)
async def list_genes(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List genes with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of genes
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total genes (with filters applied)
        count_query = select(func.count(Gene.id))
        count_query = apply_default_filters(count_query, Gene, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get genes with pagination (with filters applied)
        data_query = select(Gene).order_by(Gene.hgnc_symbol).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Gene, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return GeneListResponse(
            success=True,
            data=[GeneDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{gene_id}", response_model=GeneResponse)
async def get_gene(
    gene_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific gene

    This endpoint:
    1. Retrieves a gene by ID (excludes soft-deleted, enforces ownership)
    2. Returns the gene details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Gene,
            item_id=gene_id,
            user_org_id=org_id,
            entity_label="Gene",
        )
        return GeneResponse(
            success=True,
            data=GeneDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=GeneResponse)
async def create_gene(
    payload: GeneCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new gene

    This endpoint:
    1. Creates a new gene with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created gene details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=Gene,
            filters={"ensembl_gene_id": payload.ensembl_gene_id},
            entity_label="Gene",
        )

        item = await create_with_audit(
            db=db,
            model=Gene,
            table_name="genes",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return GeneResponse(
            success=True,
            data=GeneDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{gene_id}", response_model=GeneResponse)
async def update_gene(
    gene_id: int,
    payload: GeneUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a gene

    This endpoint:
    1. Updates a gene with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated gene details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Gene,
            item_id=gene_id,
            user_org_id=org_id,
            entity_label="Gene",
        )

        # Check if new ensembl_gene_id conflicts with another gene
        if payload.ensembl_gene_id and payload.ensembl_gene_id != item.ensembl_gene_id:
            await check_duplicate(
                db=db,
                model=Gene,
                filters={"ensembl_gene_id": payload.ensembl_gene_id},
                entity_label="Gene",
                exclude_id=gene_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="genes",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return GeneResponse(
            success=True,
            data=GeneDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{gene_id}", response_model=MessageResponse)
async def delete_gene(
    gene_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a gene

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Gene,
            item_id=gene_id,
            user_org_id=org_id,
            entity_label="Gene",
        )

        label = item.hgnc_symbol
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="genes",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Gene {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
