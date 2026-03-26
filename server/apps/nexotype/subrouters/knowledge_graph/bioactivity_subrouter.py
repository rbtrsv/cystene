from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import BioActivity
from ...schemas.knowledge_graph.bioactivity_schemas import (
    BioActivityCreate,
    BioActivityDetail,
    BioActivityListResponse,
    BioActivityResponse,
    BioActivityUpdate,
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
# BioActivities Router
# ==========================================

router = APIRouter(tags=["BioActivities"])


@router.get("/", response_model=BioActivityListResponse)
async def list_bioactivities(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List bioactivities with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of bioactivities
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total bioactivities (with filters applied)
        count_query = select(func.count(BioActivity.id))
        count_query = apply_default_filters(count_query, BioActivity, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get bioactivities with pagination (with filters applied)
        data_query = select(BioActivity).order_by(BioActivity.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, BioActivity, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return BioActivityListResponse(
            success=True,
            data=[BioActivityDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{bioactivity_id}", response_model=BioActivityResponse)
async def get_bioactivity(
    bioactivity_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific bioactivity

    This endpoint:
    1. Retrieves a bioactivity by ID (excludes soft-deleted, enforces ownership)
    2. Returns the bioactivity details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=BioActivity,
            item_id=bioactivity_id,
            user_org_id=org_id,
            entity_label="BioActivity",
        )
        return BioActivityResponse(
            success=True,
            data=BioActivityDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=BioActivityResponse)
async def create_bioactivity(
    payload: BioActivityCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new bioactivity

    This endpoint:
    1. Checks for duplicate asset_id + pathway_id combination
    2. Creates a new bioactivity with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created bioactivity details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=BioActivity,
            filters={"asset_id": payload.asset_id, "pathway_id": payload.pathway_id},
            entity_label="BioActivity",
        )

        item = await create_with_audit(
            db=db,
            model=BioActivity,
            table_name="bio_activities",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return BioActivityResponse(
            success=True,
            data=BioActivityDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{bioactivity_id}", response_model=BioActivityResponse)
async def update_bioactivity(
    bioactivity_id: int,
    payload: BioActivityUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a bioactivity

    This endpoint:
    1. Updates a bioactivity with the provided data
    2. Checks for duplicate asset_id + pathway_id combination (excluding self)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated bioactivity details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=BioActivity,
            item_id=bioactivity_id,
            user_org_id=org_id,
            entity_label="BioActivity",
        )

        # Check if composite key fields are changing
        update_data = payload.model_dump(exclude_unset=True)
        new_asset_id = update_data.get("asset_id", item.asset_id)
        new_pathway_id = update_data.get("pathway_id", item.pathway_id)
        if new_asset_id != item.asset_id or new_pathway_id != item.pathway_id:
            await check_duplicate(
                db=db,
                model=BioActivity,
                filters={"asset_id": new_asset_id, "pathway_id": new_pathway_id},
                entity_label="BioActivity",
                exclude_id=bioactivity_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="bio_activities",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return BioActivityResponse(
            success=True,
            data=BioActivityDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{bioactivity_id}", response_model=MessageResponse)
async def delete_bioactivity(
    bioactivity_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a bioactivity

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=BioActivity,
            item_id=bioactivity_id,
            user_org_id=org_id,
            entity_label="BioActivity",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="bio_activities",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"BioActivity {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
