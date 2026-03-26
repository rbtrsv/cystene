from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Pathway
from ...schemas.clinical.pathway_schemas import (
    MessageResponse,
    PathwayCreate,
    PathwayDetail,
    PathwayListResponse,
    PathwayResponse,
    PathwayUpdate,
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
# Pathways Router
# ==========================================

router = APIRouter(tags=["Pathways"])


@router.get("/", response_model=PathwayListResponse)
async def list_pathways(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List pathways with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of pathways
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total pathways (with filters applied)
        count_query = select(func.count(Pathway.id))
        count_query = apply_default_filters(count_query, Pathway, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get pathways with pagination (with filters applied)
        data_query = select(Pathway).order_by(Pathway.name).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Pathway, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return PathwayListResponse(
            success=True,
            data=[PathwayDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{pathway_id}", response_model=PathwayResponse)
async def get_pathway(
    pathway_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific pathway

    This endpoint:
    1. Retrieves a pathway by ID (excludes soft-deleted, enforces ownership)
    2. Returns the pathway details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Pathway,
            item_id=pathway_id,
            user_org_id=org_id,
            entity_label="Pathway",
        )
        return PathwayResponse(
            success=True,
            data=PathwayDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=PathwayResponse)
async def create_pathway(
    payload: PathwayCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new pathway

    This endpoint:
    1. Creates a new pathway with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created pathway details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Check if pathway already exists with the same KEGG ID
        if payload.kegg_id:
            await check_duplicate(
                db=db,
                model=Pathway,
                filters={"kegg_id": payload.kegg_id},
                entity_label="Pathway",
            )

        item = await create_with_audit(
            db=db,
            model=Pathway,
            table_name="pathways",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return PathwayResponse(
            success=True,
            data=PathwayDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{pathway_id}", response_model=PathwayResponse)
async def update_pathway(
    pathway_id: int,
    payload: PathwayUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a pathway

    This endpoint:
    1. Updates a pathway with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated pathway details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Pathway,
            item_id=pathway_id,
            user_org_id=org_id,
            entity_label="Pathway",
        )

        # Check if new kegg_id conflicts with another pathway
        if payload.kegg_id and payload.kegg_id != item.kegg_id:
            await check_duplicate(
                db=db,
                model=Pathway,
                filters={"kegg_id": payload.kegg_id},
                entity_label="Pathway",
                exclude_id=pathway_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="pathways",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return PathwayResponse(
            success=True,
            data=PathwayDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{pathway_id}", response_model=MessageResponse)
async def delete_pathway(
    pathway_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a pathway

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Pathway,
            item_id=pathway_id,
            user_org_id=org_id,
            entity_label="Pathway",
        )

        label = item.name
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="pathways",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Pathway {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
