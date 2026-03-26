from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Organism
from ...schemas.omics.organism_schemas import (
    MessageResponse,
    OrganismCreate,
    OrganismDetail,
    OrganismListResponse,
    OrganismResponse,
    OrganismUpdate,
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
# Organisms Router
# ==========================================

router = APIRouter(tags=["Organisms"])


@router.get("/", response_model=OrganismListResponse)
async def list_organisms(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List organisms with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of organisms
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total organisms (with filters applied)
        count_query = select(func.count(Organism.id))
        count_query = apply_default_filters(count_query, Organism, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get organisms with pagination (with filters applied)
        data_query = select(Organism).order_by(Organism.scientific_name).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Organism, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return OrganismListResponse(
            success=True,
            data=[OrganismDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{organism_id}", response_model=OrganismResponse)
async def get_organism(
    organism_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific organism

    This endpoint:
    1. Retrieves an organism by ID (excludes soft-deleted, enforces ownership)
    2. Returns the organism details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Organism,
            item_id=organism_id,
            user_org_id=org_id,
            entity_label="Organism",
        )
        return OrganismResponse(
            success=True,
            data=OrganismDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=OrganismResponse)
async def create_organism(
    payload: OrganismCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new organism

    This endpoint:
    1. Creates a new organism with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created organism details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=Organism,
            filters={"ncbi_taxonomy_id": payload.ncbi_taxonomy_id},
            entity_label="Organism",
        )

        item = await create_with_audit(
            db=db,
            model=Organism,
            table_name="organisms",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return OrganismResponse(
            success=True,
            data=OrganismDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{organism_id}", response_model=OrganismResponse)
async def update_organism(
    organism_id: int,
    payload: OrganismUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update an organism

    This endpoint:
    1. Updates an organism with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated organism details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Organism,
            item_id=organism_id,
            user_org_id=org_id,
            entity_label="Organism",
        )

        # Check if new ncbi_taxonomy_id conflicts with another organism
        if payload.ncbi_taxonomy_id and payload.ncbi_taxonomy_id != item.ncbi_taxonomy_id:
            await check_duplicate(
                db=db,
                model=Organism,
                filters={"ncbi_taxonomy_id": payload.ncbi_taxonomy_id},
                entity_label="Organism",
                exclude_id=organism_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="organisms",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return OrganismResponse(
            success=True,
            data=OrganismDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{organism_id}", response_model=MessageResponse)
async def delete_organism(
    organism_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete an organism

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Organism,
            item_id=organism_id,
            user_org_id=org_id,
            entity_label="Organism",
        )

        label = item.scientific_name
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="organisms",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Organism {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
