from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Phenotype
from ...schemas.clinical.phenotype_schemas import (
    MessageResponse,
    PhenotypeCreate,
    PhenotypeDetail,
    PhenotypeListResponse,
    PhenotypeResponse,
    PhenotypeUpdate,
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
# Phenotypes Router
# ==========================================

router = APIRouter(tags=["Phenotypes"])


@router.get("/", response_model=PhenotypeListResponse)
async def list_phenotypes(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List phenotypes with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of phenotypes
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total phenotypes (with filters applied)
        count_query = select(func.count(Phenotype.id))
        count_query = apply_default_filters(count_query, Phenotype, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get phenotypes with pagination (with filters applied)
        data_query = select(Phenotype).order_by(Phenotype.name).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Phenotype, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return PhenotypeListResponse(
            success=True,
            data=[PhenotypeDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{phenotype_id}", response_model=PhenotypeResponse)
async def get_phenotype(
    phenotype_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific phenotype

    This endpoint:
    1. Retrieves a phenotype by ID (excludes soft-deleted, enforces ownership)
    2. Returns the phenotype details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Phenotype,
            item_id=phenotype_id,
            user_org_id=org_id,
            entity_label="Phenotype",
        )
        return PhenotypeResponse(
            success=True,
            data=PhenotypeDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=PhenotypeResponse)
async def create_phenotype(
    payload: PhenotypeCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new phenotype

    This endpoint:
    1. Creates a new phenotype with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created phenotype details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=Phenotype,
            table_name="phenotypes",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return PhenotypeResponse(
            success=True,
            data=PhenotypeDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{phenotype_id}", response_model=PhenotypeResponse)
async def update_phenotype(
    phenotype_id: int,
    payload: PhenotypeUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a phenotype

    This endpoint:
    1. Updates a phenotype with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated phenotype details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Phenotype,
            item_id=phenotype_id,
            user_org_id=org_id,
            entity_label="Phenotype",
        )

        await update_with_audit(
            db=db,
            item=item,
            table_name="phenotypes",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return PhenotypeResponse(
            success=True,
            data=PhenotypeDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{phenotype_id}", response_model=MessageResponse)
async def delete_phenotype(
    phenotype_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a phenotype

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Phenotype,
            item_id=phenotype_id,
            user_org_id=org_id,
            entity_label="Phenotype",
        )

        label = item.name
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="phenotypes",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Phenotype {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
