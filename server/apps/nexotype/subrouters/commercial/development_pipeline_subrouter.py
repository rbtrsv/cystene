from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import DevelopmentPipeline
from ...schemas.commercial.development_pipeline_schemas import (
    DevelopmentPipelineCreate,
    DevelopmentPipelineDetail,
    DevelopmentPipelineListResponse,
    DevelopmentPipelineResponse,
    DevelopmentPipelineUpdate,
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
# Development Pipelines Router
# ==========================================

router = APIRouter(tags=["DevelopmentPipelines"])


@router.get("/", response_model=DevelopmentPipelineListResponse)
async def list_development_pipelines(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List development pipelines with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of development pipelines
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total development pipelines (with filters applied)
        count_query = select(func.count(DevelopmentPipeline.id))
        count_query = apply_default_filters(count_query, DevelopmentPipeline, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get development pipelines with pagination (with filters applied)
        data_query = select(DevelopmentPipeline).order_by(DevelopmentPipeline.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, DevelopmentPipeline, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return DevelopmentPipelineListResponse(
            success=True,
            data=[DevelopmentPipelineDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{pipeline_id}", response_model=DevelopmentPipelineResponse)
async def get_development_pipeline(
    pipeline_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific development pipeline

    This endpoint:
    1. Retrieves a development pipeline by ID (excludes soft-deleted, enforces ownership)
    2. Returns the development pipeline details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=DevelopmentPipeline,
            item_id=pipeline_id,
            user_org_id=org_id,
            entity_label="DevelopmentPipeline",
        )
        return DevelopmentPipelineResponse(
            success=True,
            data=DevelopmentPipelineDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=DevelopmentPipelineResponse)
async def create_development_pipeline(
    payload: DevelopmentPipelineCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new development pipeline

    This endpoint:
    1. Checks for duplicate asset_id + indication_id combination
    2. Creates a new development pipeline with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created development pipeline details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Check duplicate asset_id + indication_id (composite unique)
        await check_duplicate(
            db=db,
            model=DevelopmentPipeline,
            filters={"asset_id": payload.asset_id, "indication_id": payload.indication_id},
            entity_label="DevelopmentPipeline",
        )

        item = await create_with_audit(
            db=db,
            model=DevelopmentPipeline,
            table_name="development_pipelines",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return DevelopmentPipelineResponse(
            success=True,
            data=DevelopmentPipelineDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{pipeline_id}", response_model=DevelopmentPipelineResponse)
async def update_development_pipeline(
    pipeline_id: int,
    payload: DevelopmentPipelineUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a development pipeline

    This endpoint:
    1. Updates a development pipeline with the provided data
    2. Checks for duplicate asset_id + indication_id (excluding self, only if either is changing)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated development pipeline details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=DevelopmentPipeline,
            item_id=pipeline_id,
            user_org_id=org_id,
            entity_label="DevelopmentPipeline",
        )

        update_data = payload.model_dump(exclude_unset=True)

        # Check duplicate composite key if either FK is changing
        if "asset_id" in update_data or "indication_id" in update_data:
            new_asset_id = update_data.get("asset_id", item.asset_id)
            new_indication_id = update_data.get("indication_id", item.indication_id)
            if new_asset_id != item.asset_id or new_indication_id != item.indication_id:
                await check_duplicate(
                    db=db,
                    model=DevelopmentPipeline,
                    filters={"asset_id": new_asset_id, "indication_id": new_indication_id},
                    entity_label="DevelopmentPipeline",
                    exclude_id=pipeline_id,
                )

        await update_with_audit(
            db=db,
            item=item,
            table_name="development_pipelines",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return DevelopmentPipelineResponse(
            success=True,
            data=DevelopmentPipelineDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{pipeline_id}", response_model=MessageResponse)
async def delete_development_pipeline(
    pipeline_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a development pipeline

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=DevelopmentPipeline,
            item_id=pipeline_id,
            user_org_id=org_id,
            entity_label="DevelopmentPipeline",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="development_pipelines",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"DevelopmentPipeline {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
