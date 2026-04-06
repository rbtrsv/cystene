"""
DealPipeline Subrouter

FastAPI router for DealPipeline model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.holding_models import DealPipeline
from ...models.entity_models import Entity
from ...schemas.holding_schemas.deal_pipeline_schemas import (
    DealPipeline as DealPipelineSchema,
    DealPipelineCreate, DealPipelineUpdate,
    DealPipelineResponse, DealPipelinesResponse,
    PipelineStatus, PipelinePriority
)
from ...utils.dependency_utils import get_entity_access, require_write_access
from ...utils.filtering_utils import get_user_entity_ids, apply_soft_delete_filter
from ...utils.crud_utils import (
    get_record_or_404,
    create_with_audit,
    update_with_audit,
    soft_delete_with_audit,
)
from apps.accounts.utils.auth_utils import get_current_user
from apps.accounts.models import User

router = APIRouter(tags=["Deal Pipeline"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=DealPipelinesResponse)
async def list_deal_pipelines(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    status: Optional[str] = Query(None, description="Filter by pipeline status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List deal pipeline entries for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access via get_user_entity_ids
    3. Returns a paginated list of deal pipeline entries
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return DealPipelinesResponse(success=True, data=[])

        # Build query with soft-delete filter
        query = (
            select(DealPipeline)
            .filter(DealPipeline.entity_id.in_(accessible_entity_ids))
        )
        query = apply_soft_delete_filter(query, DealPipeline)

        # Apply filters
        if entity_id:
            # Verify entity exists (soft-delete aware) and is accessible
            await get_record_or_404(session, Entity, entity_id, "Entity")
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(DealPipeline.entity_id == entity_id)

        if status:
            query = query.filter(DealPipeline.status == status)

        if priority:
            query = query.filter(DealPipeline.priority == priority)

        # Apply pagination
        query = query.order_by(DealPipeline.id.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        pipelines = result.scalars().all()

        return DealPipelinesResponse(
            success=True,
            data=[DealPipelineSchema.model_validate(p) for p in pipelines]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list deal pipeline entries: {str(e)}")

# ==========================================
# Individual DealPipeline Operations
# ==========================================

@router.get("/{pipeline_id}", response_model=DealPipelineResponse)
async def get_deal_pipeline(
    pipeline_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get deal pipeline entry details - requires VIEW permission on entity.

    This endpoint:
    1. Retrieves a deal pipeline entry by ID (excludes soft-deleted)
    2. Returns the deal pipeline entry details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        pipeline = await get_record_or_404(session, DealPipeline, pipeline_id, "Deal pipeline entry")

        # Check entity access
        entity_access = await get_entity_access(user.id, pipeline.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return DealPipelineResponse(
            success=True,
            data=DealPipelineSchema.model_validate(pipeline)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get deal pipeline entry: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=DealPipelineResponse)
async def create_deal_pipeline(
    data: DealPipelineCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create deal pipeline entry - requires EDIT permission on entity.

    This endpoint:
    1. Creates a new deal pipeline entry with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created deal pipeline entry details
    """
    try:
        # Verify entity exists (soft-delete aware)
        await get_record_or_404(session, Entity, data.entity_id, "Entity")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # Verify target_entity FK if provided (soft-delete aware)
        if data.target_entity_id is not None:
            await get_record_or_404(session, Entity, data.target_entity_id, "Target entity")


        # create_with_audit handles: model(**payload, created_by=user_id) + flush + INSERT audit
        pipeline = await create_with_audit(
            db=session,
            model=DealPipeline,
            table_name="deal_pipeline",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(pipeline)

        return DealPipelineResponse(
            success=True,
            data=DealPipelineSchema.model_validate(pipeline)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create deal pipeline entry: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{pipeline_id}", response_model=DealPipelineResponse)
async def update_deal_pipeline(
    pipeline_id: int,
    data: DealPipelineUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update deal pipeline entry - requires EDIT permission on entity.

    This endpoint:
    1. Updates a deal pipeline entry with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated deal pipeline entry details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        pipeline = await get_record_or_404(session, DealPipeline, pipeline_id, "Deal pipeline entry")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, pipeline.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # If updating entity_id, verify it exists (soft-delete aware)
        if data.entity_id is not None and data.entity_id != pipeline.entity_id:
            await get_record_or_404(session, Entity, data.entity_id, "New entity")

        # If updating target_entity_id, verify it exists (soft-delete aware)
        if data.target_entity_id is not None and data.target_entity_id != pipeline.target_entity_id:
            await get_record_or_404(session, Entity, data.target_entity_id, "New target entity")


        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        await update_with_audit(
            db=session,
            item=pipeline,
            table_name="deal_pipeline",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(pipeline)

        return DealPipelineResponse(
            success=True,
            data=DealPipelineSchema.model_validate(pipeline)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update deal pipeline entry: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{pipeline_id}")
async def delete_deal_pipeline(
    pipeline_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete deal pipeline entry - requires ADMIN permission on entity.

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        pipeline = await get_record_or_404(session, DealPipeline, pipeline_id, "Deal pipeline entry")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, pipeline.entity_id, session, ['ADMIN', 'OWNER'])


        # soft_delete_with_audit handles: old snapshot + deleted_at/deleted_by + DELETE audit
        await soft_delete_with_audit(
            db=session,
            item=pipeline,
            table_name="deal_pipeline",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "Deal pipeline entry has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete deal pipeline entry: {str(e)}")
