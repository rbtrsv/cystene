from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Biospecimen
from ...schemas.lims.biospecimen_schemas import (
    BiospecimenCreate,
    BiospecimenDetail,
    BiospecimenListResponse,
    BiospecimenResponse,
    BiospecimenUpdate,
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
# Biospecimens Router
# ==========================================

router = APIRouter(tags=["Biospecimens"])


@router.get("/", response_model=BiospecimenListResponse)
async def list_biospecimens(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List biospecimens with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of biospecimens
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total biospecimens (with filters applied)
        count_query = select(func.count(Biospecimen.id))
        count_query = apply_default_filters(count_query, Biospecimen, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get biospecimens with pagination (with filters applied)
        data_query = select(Biospecimen).order_by(Biospecimen.barcode).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Biospecimen, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return BiospecimenListResponse(
            success=True,
            data=[BiospecimenDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{biospecimen_id}", response_model=BiospecimenResponse)
async def get_biospecimen(
    biospecimen_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific biospecimen

    This endpoint:
    1. Retrieves a biospecimen by ID (excludes soft-deleted, enforces ownership)
    2. Returns the biospecimen details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Biospecimen,
            item_id=biospecimen_id,
            user_org_id=org_id,
            entity_label="Biospecimen",
        )
        return BiospecimenResponse(
            success=True,
            data=BiospecimenDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=BiospecimenResponse)
async def create_biospecimen(
    payload: BiospecimenCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new biospecimen

    This endpoint:
    1. Creates a new biospecimen with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created biospecimen details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=Biospecimen,
            filters={"barcode": payload.barcode},
            entity_label="Biospecimen",
        )

        item = await create_with_audit(
            db=db,
            model=Biospecimen,
            table_name="biospecimens",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return BiospecimenResponse(
            success=True,
            data=BiospecimenDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{biospecimen_id}", response_model=BiospecimenResponse)
async def update_biospecimen(
    biospecimen_id: int,
    payload: BiospecimenUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a biospecimen

    This endpoint:
    1. Updates a biospecimen with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated biospecimen details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Biospecimen,
            item_id=biospecimen_id,
            user_org_id=org_id,
            entity_label="Biospecimen",
        )

        # Check if new barcode conflicts with another biospecimen
        if payload.barcode and payload.barcode != item.barcode:
            await check_duplicate(
                db=db,
                model=Biospecimen,
                filters={"barcode": payload.barcode},
                entity_label="Biospecimen",
                exclude_id=biospecimen_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="biospecimens",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return BiospecimenResponse(
            success=True,
            data=BiospecimenDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{biospecimen_id}", response_model=MessageResponse)
async def delete_biospecimen(
    biospecimen_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a biospecimen

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Biospecimen,
            item_id=biospecimen_id,
            user_org_id=org_id,
            entity_label="Biospecimen",
        )

        label = item.barcode
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="biospecimens",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Biospecimen {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
