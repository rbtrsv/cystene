"""
HoldingPerformance Subrouter

FastAPI router for HoldingPerformance model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.holding_models import HoldingPerformance
from ...models.entity_models import Entity
from ...models.captable_models import FundingRound
from ...schemas.holding_schemas.holding_performance_schemas import (
    HoldingPerformance as HoldingPerformanceSchema,
    HoldingPerformanceCreate, HoldingPerformanceUpdate,
    HoldingPerformanceResponse, HoldingPerformancesResponse
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

router = APIRouter(tags=["Holding Performance"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=HoldingPerformancesResponse)
async def list_holding_performances(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List holding performance records for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access via get_user_entity_ids
    3. Returns a paginated list of holding performance records
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return HoldingPerformancesResponse(success=True, data=[])

        # Build query with soft-delete filter
        query = (
            select(HoldingPerformance)
            .filter(HoldingPerformance.entity_id.in_(accessible_entity_ids))
        )
        query = apply_soft_delete_filter(query, HoldingPerformance)

        # Apply filters
        if entity_id:
            # Verify entity exists (soft-delete aware) and is accessible
            await get_record_or_404(session, Entity, entity_id, "Entity")
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(HoldingPerformance.entity_id == entity_id)

        # Apply pagination
        query = query.order_by(HoldingPerformance.report_date.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        performances = result.scalars().all()

        return HoldingPerformancesResponse(
            success=True,
            data=[HoldingPerformanceSchema.model_validate(p) for p in performances]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list holding performance records: {str(e)}")

# ==========================================
# Individual HoldingPerformance Operations
# ==========================================

@router.get("/{performance_id}", response_model=HoldingPerformanceResponse)
async def get_holding_performance(
    performance_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get holding performance details - requires VIEW permission on entity.

    This endpoint:
    1. Retrieves a holding performance record by ID (excludes soft-deleted)
    2. Returns the holding performance details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        performance = await get_record_or_404(session, HoldingPerformance, performance_id, "Holding performance record")

        # Check entity access
        entity_access = await get_entity_access(user.id, performance.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return HoldingPerformanceResponse(
            success=True,
            data=HoldingPerformanceSchema.model_validate(performance)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get holding performance record: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=HoldingPerformanceResponse)
async def create_holding_performance(
    data: HoldingPerformanceCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create holding performance record - requires EDIT permission on entity.

    This endpoint:
    1. Creates a new holding performance record with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created holding performance details
    """
    try:
        # Verify entity exists (soft-delete aware)
        await get_record_or_404(session, Entity, data.entity_id, "Entity")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # Verify funding_round FK if provided (soft-delete aware)
        if data.funding_round_id is not None:
            await get_record_or_404(session, FundingRound, data.funding_round_id, "Funding round")

        # check_duplicate handles: composite key check + soft-delete filter + 409
        await check_duplicate(
            db=session,
            model=HoldingPerformance,
            filters={"entity_id": data.entity_id, "funding_round_id": data.funding_round_id, "report_date": data.report_date},
            entity_label="Holding performance record",
        )


        # create_with_audit handles: model(**payload, created_by=user_id) + flush + INSERT audit
        performance = await create_with_audit(
            db=session,
            model=HoldingPerformance,
            table_name="holding_performances",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(performance)

        return HoldingPerformanceResponse(
            success=True,
            data=HoldingPerformanceSchema.model_validate(performance)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create holding performance record: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{performance_id}", response_model=HoldingPerformanceResponse)
async def update_holding_performance(
    performance_id: int,
    data: HoldingPerformanceUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update holding performance record - requires EDIT permission on entity.

    This endpoint:
    1. Updates a holding performance record with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated holding performance details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        performance = await get_record_or_404(session, HoldingPerformance, performance_id, "Holding performance record")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, performance.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # If updating entity_id, verify it exists (soft-delete aware)
        if data.entity_id is not None and data.entity_id != performance.entity_id:
            await get_record_or_404(session, Entity, data.entity_id, "New entity")

        # If updating funding_round_id, verify it exists (soft-delete aware)
        if data.funding_round_id is not None and data.funding_round_id != performance.funding_round_id:
            await get_record_or_404(session, FundingRound, data.funding_round_id, "New funding round")

        # Re-check duplicate if any unique constraint fields are changing
        if data.entity_id is not None or data.funding_round_id is not None or data.report_date is not None:
            check_entity_id = data.entity_id if data.entity_id is not None else performance.entity_id
            check_funding_round_id = data.funding_round_id if data.funding_round_id is not None else performance.funding_round_id
            check_report_date = data.report_date if data.report_date is not None else performance.report_date

            await check_duplicate(
                db=session,
                model=HoldingPerformance,
                filters={"entity_id": check_entity_id, "funding_round_id": check_funding_round_id, "report_date": check_report_date},
                entity_label="Holding performance record",
                exclude_id=performance_id,
            )


        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        await update_with_audit(
            db=session,
            item=performance,
            table_name="holding_performances",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(performance)

        return HoldingPerformanceResponse(
            success=True,
            data=HoldingPerformanceSchema.model_validate(performance)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update holding performance record: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{performance_id}")
async def delete_holding_performance(
    performance_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete holding performance record - requires ADMIN permission on entity.

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        performance = await get_record_or_404(session, HoldingPerformance, performance_id, "Holding performance record")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, performance.entity_id, session, ['ADMIN', 'OWNER'])


        # soft_delete_with_audit handles: old snapshot + deleted_at/deleted_by + DELETE audit
        await soft_delete_with_audit(
            db=session,
            item=performance,
            table_name="holding_performances",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "Holding performance record has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete holding performance record: {str(e)}")
