"""
Holding Subrouter

FastAPI router for Holding model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.holding_models import Holding
from ...models.entity_models import Entity
from ...models.captable_models import FundingRound
from ...schemas.holding_schemas.holding_schemas import (
    Holding as HoldingSchema,
    HoldingCreate, HoldingUpdate,
    HoldingResponse, HoldingsResponse,
    InvestmentStatus, ListingStatus
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

router = APIRouter(tags=["Holdings"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=HoldingsResponse)
async def list_holdings(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    investment_status: Optional[str] = Query(None, description="Filter by investment status"),
    listing_status: Optional[str] = Query(None, description="Filter by listing status"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List holdings for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access via get_user_entity_ids
    3. Returns a paginated list of holdings
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return HoldingsResponse(success=True, data=[])

        # Build query with soft-delete filter
        query = (
            select(Holding)
            .filter(Holding.entity_id.in_(accessible_entity_ids))
        )
        query = apply_soft_delete_filter(query, Holding)

        # Apply filters
        if entity_id:
            # Verify entity exists (soft-delete aware) and is accessible
            await get_record_or_404(session, Entity, entity_id, "Entity")
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(Holding.entity_id == entity_id)

        if investment_status:
            query = query.filter(Holding.investment_status == investment_status)

        if listing_status:
            query = query.filter(Holding.listing_status == listing_status)

        # Apply pagination
        query = query.order_by(Holding.id.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        holdings = result.scalars().all()

        return HoldingsResponse(
            success=True,
            data=[HoldingSchema.model_validate(h) for h in holdings]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list holdings: {str(e)}")

# ==========================================
# Individual Holding Operations
# ==========================================

@router.get("/{holding_id}", response_model=HoldingResponse)
async def get_holding(
    holding_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get holding details - requires VIEW permission on entity.

    This endpoint:
    1. Retrieves a holding by ID (excludes soft-deleted)
    2. Returns the holding details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        holding = await get_record_or_404(session, Holding, holding_id, "Holding")

        # Check entity access
        entity_access = await get_entity_access(user.id, holding.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return HoldingResponse(
            success=True,
            data=HoldingSchema.model_validate(holding)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get holding: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=HoldingResponse)
async def create_holding(
    data: HoldingCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create holding - requires EDIT permission on entity.

    This endpoint:
    1. Creates a new holding with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created holding details
    """
    try:
        # Verify entity exists (soft-delete aware)
        await get_record_or_404(session, Entity, data.entity_id, "Entity")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # Verify target_entity FK if provided (soft-delete aware)
        if data.target_entity_id is not None:
            await get_record_or_404(session, Entity, data.target_entity_id, "Target entity")

        # Verify funding_round FK if provided (soft-delete aware)
        if data.funding_round_id is not None:
            await get_record_or_404(session, FundingRound, data.funding_round_id, "Funding round")

        # check_duplicate handles: composite key check + soft-delete filter + 409
        await check_duplicate(
            db=session,
            model=Holding,
            filters={"entity_id": data.entity_id, "target_entity_id": data.target_entity_id, "funding_round_id": data.funding_round_id},
            entity_label="Holding",
        )


        # create_with_audit handles: model(**payload, created_by=user_id) + flush + INSERT audit
        holding = await create_with_audit(
            db=session,
            model=Holding,
            table_name="holdings",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(holding)

        return HoldingResponse(
            success=True,
            data=HoldingSchema.model_validate(holding)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create holding: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{holding_id}", response_model=HoldingResponse)
async def update_holding(
    holding_id: int,
    data: HoldingUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update holding - requires EDIT permission on entity.

    This endpoint:
    1. Updates a holding with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated holding details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        holding = await get_record_or_404(session, Holding, holding_id, "Holding")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, holding.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # If updating entity_id, verify it exists (soft-delete aware)
        if data.entity_id is not None and data.entity_id != holding.entity_id:
            await get_record_or_404(session, Entity, data.entity_id, "New entity")

        # If updating target_entity_id, verify it exists (soft-delete aware)
        if data.target_entity_id is not None and data.target_entity_id != holding.target_entity_id:
            await get_record_or_404(session, Entity, data.target_entity_id, "New target entity")

        # If updating funding_round_id, verify it exists (soft-delete aware)
        if data.funding_round_id is not None and data.funding_round_id != holding.funding_round_id:
            await get_record_or_404(session, FundingRound, data.funding_round_id, "New funding round")

        # Re-check duplicate if any unique constraint fields are changing
        if data.entity_id is not None or data.target_entity_id is not None or data.funding_round_id is not None:
            check_entity_id = data.entity_id if data.entity_id is not None else holding.entity_id
            check_target_entity_id = data.target_entity_id if data.target_entity_id is not None else holding.target_entity_id
            check_funding_round_id = data.funding_round_id if data.funding_round_id is not None else holding.funding_round_id

            await check_duplicate(
                db=session,
                model=Holding,
                filters={"entity_id": check_entity_id, "target_entity_id": check_target_entity_id, "funding_round_id": check_funding_round_id},
                entity_label="Holding",
                exclude_id=holding_id,
            )


        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        await update_with_audit(
            db=session,
            item=holding,
            table_name="holdings",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(holding)

        return HoldingResponse(
            success=True,
            data=HoldingSchema.model_validate(holding)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update holding: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{holding_id}")
async def delete_holding(
    holding_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete holding - requires ADMIN permission on entity.

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        holding = await get_record_or_404(session, Holding, holding_id, "Holding")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, holding.entity_id, session, ['ADMIN', 'OWNER'])


        # soft_delete_with_audit handles: old snapshot + deleted_at/deleted_by + DELETE audit
        await soft_delete_with_audit(
            db=session,
            item=holding,
            table_name="holdings",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "Holding has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete holding: {str(e)}")
