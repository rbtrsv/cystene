from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import ProteinDomain
from ...schemas.omics.protein_domain_schemas import (
    MessageResponse,
    ProteinDomainCreate,
    ProteinDomainDetail,
    ProteinDomainListResponse,
    ProteinDomainResponse,
    ProteinDomainUpdate,
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
# Protein Domains Router
# ==========================================

router = APIRouter(tags=["Protein Domains"])


@router.get("/", response_model=ProteinDomainListResponse)
async def list_protein_domains(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List protein domains with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of protein domains
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total protein domains (with filters applied)
        count_query = select(func.count(ProteinDomain.id))
        count_query = apply_default_filters(count_query, ProteinDomain, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get protein domains with pagination (with filters applied)
        data_query = select(ProteinDomain).order_by(ProteinDomain.name).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, ProteinDomain, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return ProteinDomainListResponse(
            success=True,
            data=[ProteinDomainDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{protein_domain_id}", response_model=ProteinDomainResponse)
async def get_protein_domain(
    protein_domain_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific protein domain

    This endpoint:
    1. Retrieves a protein domain by ID (excludes soft-deleted, enforces ownership)
    2. Returns the protein domain details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=ProteinDomain,
            item_id=protein_domain_id,
            user_org_id=org_id,
            entity_label="ProteinDomain",
        )
        return ProteinDomainResponse(
            success=True,
            data=ProteinDomainDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=ProteinDomainResponse)
async def create_protein_domain(
    payload: ProteinDomainCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new protein domain

    This endpoint:
    1. Creates a new protein domain with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created protein domain details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=ProteinDomain,
            filters={"pfam_id": payload.pfam_id},
            entity_label="ProteinDomain",
        )

        item = await create_with_audit(
            db=db,
            model=ProteinDomain,
            table_name="protein_domains",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return ProteinDomainResponse(
            success=True,
            data=ProteinDomainDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{protein_domain_id}", response_model=ProteinDomainResponse)
async def update_protein_domain(
    protein_domain_id: int,
    payload: ProteinDomainUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a protein domain

    This endpoint:
    1. Updates a protein domain with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated protein domain details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=ProteinDomain,
            item_id=protein_domain_id,
            user_org_id=org_id,
            entity_label="ProteinDomain",
        )

        # Check if new pfam_id conflicts with another protein domain
        if payload.pfam_id and payload.pfam_id != item.pfam_id:
            await check_duplicate(
                db=db,
                model=ProteinDomain,
                filters={"pfam_id": payload.pfam_id},
                entity_label="ProteinDomain",
                exclude_id=protein_domain_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="protein_domains",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return ProteinDomainResponse(
            success=True,
            data=ProteinDomainDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{protein_domain_id}", response_model=MessageResponse)
async def delete_protein_domain(
    protein_domain_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a protein domain

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=ProteinDomain,
            item_id=protein_domain_id,
            user_org_id=org_id,
            entity_label="ProteinDomain",
        )

        label = item.name
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="protein_domains",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"ProteinDomain {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
