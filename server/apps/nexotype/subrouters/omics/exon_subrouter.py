from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Exon
from ...schemas.omics.exon_schemas import (
    ExonCreate,
    ExonDetail,
    ExonListResponse,
    ExonResponse,
    ExonUpdate,
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
# Exons Router
# ==========================================

router = APIRouter(tags=["Exons"])


@router.get("/", response_model=ExonListResponse)
async def list_exons(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List exons with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of exons
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total exons (with filters applied)
        count_query = select(func.count(Exon.id))
        count_query = apply_default_filters(count_query, Exon, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get exons with pagination (with filters applied)
        data_query = select(Exon).order_by(Exon.ensembl_exon_id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Exon, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return ExonListResponse(
            success=True,
            data=[ExonDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{exon_id}", response_model=ExonResponse)
async def get_exon(
    exon_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific exon

    This endpoint:
    1. Retrieves an exon by ID (excludes soft-deleted, enforces ownership)
    2. Returns the exon details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Exon,
            item_id=exon_id,
            user_org_id=org_id,
            entity_label="Exon",
        )
        return ExonResponse(
            success=True,
            data=ExonDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=ExonResponse)
async def create_exon(
    payload: ExonCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new exon

    This endpoint:
    1. Creates a new exon with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created exon details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=Exon,
            table_name="exons",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return ExonResponse(
            success=True,
            data=ExonDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{exon_id}", response_model=ExonResponse)
async def update_exon(
    exon_id: int,
    payload: ExonUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update an exon

    This endpoint:
    1. Updates an exon with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated exon details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Exon,
            item_id=exon_id,
            user_org_id=org_id,
            entity_label="Exon",
        )

        await update_with_audit(
            db=db,
            item=item,
            table_name="exons",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return ExonResponse(
            success=True,
            data=ExonDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{exon_id}", response_model=MessageResponse)
async def delete_exon(
    exon_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete an exon

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Exon,
            item_id=exon_id,
            user_org_id=org_id,
            entity_label="Exon",
        )

        label = item.ensembl_exon_id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="exons",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Exon {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
