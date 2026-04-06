"""
FinancialMetrics Subrouter

FastAPI router for FinancialMetrics model CRUD operations.
Consolidated model merging ratios, revenue, customer, operational, and team metrics.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.financial_models import FinancialMetrics
from ...models.entity_models import Entity
from ...schemas.financial_schemas.financial_metrics_schemas import (
    FinancialMetrics as FinancialMetricsSchema,
    FinancialMetricsCreate, FinancialMetricsUpdate,
    FinancialMetricsResponse, FinancialMetricsListResponse
)
from ...utils.dependency_utils import get_entity_access, require_write_access
from ...utils.filtering_utils import get_user_entity_ids, apply_soft_delete_filter
from ...utils.crud_utils import (
    get_record_or_404,
    check_duplicate,
    create_with_audit,
    update_with_audit,
    soft_delete_with_audit,
)
from apps.accounts.utils.auth_utils import get_current_user
from apps.accounts.models import User

router = APIRouter(tags=["Financial Metrics"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=FinancialMetricsListResponse)
async def list_financial_metrics(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    scenario: Optional[str] = Query(None, description="Filter by scenario"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List financial metrics for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access via get_user_entity_ids
    3. Returns a paginated list of financial metrics
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return FinancialMetricsListResponse(success=True, data=[])

        # Build query with soft-delete filter
        query = (
            select(FinancialMetrics)
            .filter(FinancialMetrics.entity_id.in_(accessible_entity_ids))
        )
        query = apply_soft_delete_filter(query, FinancialMetrics)

        # Apply filters
        if entity_id:
            # Verify entity exists (soft-delete aware) and is accessible
            await get_record_or_404(session, Entity, entity_id, "Entity")
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(FinancialMetrics.entity_id == entity_id)

        if scenario:
            query = query.filter(FinancialMetrics.scenario == scenario)

        # Apply pagination
        query = query.order_by(FinancialMetrics.id.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        metrics = result.scalars().all()

        return FinancialMetricsListResponse(
            success=True,
            data=[FinancialMetricsSchema.model_validate(m) for m in metrics]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list financial metrics: {str(e)}")

# ==========================================
# Individual FinancialMetrics Operations
# ==========================================

@router.get("/{metrics_id}", response_model=FinancialMetricsResponse)
async def get_financial_metrics(
    metrics_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get financial metrics details - requires VIEW permission on entity.

    This endpoint:
    1. Retrieves financial metrics by ID (excludes soft-deleted)
    2. Returns the financial metrics details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        metrics = await get_record_or_404(session, FinancialMetrics, metrics_id, "Financial metrics")

        # Check entity access
        entity_access = await get_entity_access(user.id, metrics.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return FinancialMetricsResponse(
            success=True,
            data=FinancialMetricsSchema.model_validate(metrics)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get financial metrics: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=FinancialMetricsResponse)
async def create_financial_metrics(
    data: FinancialMetricsCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create financial metrics - requires EDIT permission on entity.

    This endpoint:
    1. Creates a new financial metrics snapshot with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created financial metrics details
    """
    try:
        # Verify entity exists (soft-delete aware)
        await get_record_or_404(session, Entity, data.entity_id, "Entity")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # check_duplicate handles: composite key check + soft-delete filter + 409
        await check_duplicate(
            db=session,
            model=FinancialMetrics,
            filters={"entity_id": data.entity_id, "period_end": data.period_end, "scenario": data.scenario},
            entity_label="Financial metrics",
        )


        # create_with_audit handles: model(**payload, created_by=user_id) + flush + INSERT audit
        metrics = await create_with_audit(
            db=session,
            model=FinancialMetrics,
            table_name="financial_metrics",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(metrics)

        return FinancialMetricsResponse(
            success=True,
            data=FinancialMetricsSchema.model_validate(metrics)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create financial metrics: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{metrics_id}", response_model=FinancialMetricsResponse)
async def update_financial_metrics(
    metrics_id: int,
    data: FinancialMetricsUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update financial metrics - requires EDIT permission on entity.

    This endpoint:
    1. Updates financial metrics with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated financial metrics details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        metrics = await get_record_or_404(session, FinancialMetrics, metrics_id, "Financial metrics")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, metrics.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # If updating entity_id, verify it exists (soft-delete aware)
        if data.entity_id is not None and data.entity_id != metrics.entity_id:
            await get_record_or_404(session, Entity, data.entity_id, "New entity")

        # Re-check duplicate if any unique constraint fields are changing
        if data.entity_id is not None or data.period_end is not None or data.scenario is not None:
            check_entity_id = data.entity_id if data.entity_id is not None else metrics.entity_id
            check_period_end = data.period_end if data.period_end is not None else metrics.period_end
            check_scenario = data.scenario if data.scenario is not None else metrics.scenario

            await check_duplicate(
                db=session,
                model=FinancialMetrics,
                filters={"entity_id": check_entity_id, "period_end": check_period_end, "scenario": check_scenario},
                entity_label="Financial metrics",
                exclude_id=metrics_id,
            )


        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        await update_with_audit(
            db=session,
            item=metrics,
            table_name="financial_metrics",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(metrics)

        return FinancialMetricsResponse(
            success=True,
            data=FinancialMetricsSchema.model_validate(metrics)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update financial metrics: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{metrics_id}")
async def delete_financial_metrics(
    metrics_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete financial metrics - requires ADMIN permission on entity.

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        metrics = await get_record_or_404(session, FinancialMetrics, metrics_id, "Financial metrics")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, metrics.entity_id, session, ['ADMIN', 'OWNER'])


        # soft_delete_with_audit handles: old snapshot + deleted_at/deleted_by + DELETE audit
        await soft_delete_with_audit(
            db=session,
            item=metrics,
            table_name="financial_metrics",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "Financial metrics have been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete financial metrics: {str(e)}")
