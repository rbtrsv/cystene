from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Biomarker
from ...schemas.clinical.biomarker_schemas import (
    BiomarkerCreate,
    BiomarkerDetail,
    BiomarkerListResponse,
    BiomarkerResponse,
    BiomarkerUpdate,
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
# Biomarkers Router
# ==========================================

router = APIRouter(tags=["Biomarkers"])


@router.get("/", response_model=BiomarkerListResponse)
async def list_biomarkers(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List biomarkers with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of biomarkers
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total biomarkers (with filters applied)
        count_query = select(func.count(Biomarker.id))
        count_query = apply_default_filters(count_query, Biomarker, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get biomarkers with pagination (with filters applied)
        data_query = select(Biomarker).order_by(Biomarker.name).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Biomarker, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return BiomarkerListResponse(
            success=True,
            data=[BiomarkerDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{biomarker_id}", response_model=BiomarkerResponse)
async def get_biomarker(
    biomarker_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific biomarker

    This endpoint:
    1. Retrieves a biomarker by ID (excludes soft-deleted, enforces ownership)
    2. Returns the biomarker details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Biomarker,
            item_id=biomarker_id,
            user_org_id=org_id,
            entity_label="Biomarker",
        )
        return BiomarkerResponse(
            success=True,
            data=BiomarkerDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=BiomarkerResponse)
async def create_biomarker(
    payload: BiomarkerCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new biomarker

    This endpoint:
    1. Creates a new biomarker with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created biomarker details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=Biomarker,
            table_name="biomarkers",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return BiomarkerResponse(
            success=True,
            data=BiomarkerDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{biomarker_id}", response_model=BiomarkerResponse)
async def update_biomarker(
    biomarker_id: int,
    payload: BiomarkerUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a biomarker

    This endpoint:
    1. Updates a biomarker with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated biomarker details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Biomarker,
            item_id=biomarker_id,
            user_org_id=org_id,
            entity_label="Biomarker",
        )

        await update_with_audit(
            db=db,
            item=item,
            table_name="biomarkers",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return BiomarkerResponse(
            success=True,
            data=BiomarkerDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{biomarker_id}", response_model=MessageResponse)
async def delete_biomarker(
    biomarker_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a biomarker

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Biomarker,
            item_id=biomarker_id,
            user_org_id=org_id,
            entity_label="Biomarker",
        )

        label = item.name
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="biomarkers",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Biomarker {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
