"""
Stakeholder Position Subrouter

FastAPI router for computed stakeholder position endpoints (investor side).
These endpoints compute positions ON THE FLY from raw data — no CRUD operations.
Same pattern as performance_subrouter.py — read-only computed, own router, own prefix.
3 endpoints: list, detail, track-as-holding.

Endpoints:
- GET / — list all positions for a source entity across all cap tables
- GET /{entity_id} — single position detail with full transaction history
- POST /{entity_id}/track-as-holding — create Holding + HoldingCashFlows from position data
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from ...utils.dependency_utils import get_entity_access, require_write_access
from ...schemas.entity_schemas.stakeholder_position_schemas import (
    StakeholderPositionsResponse,
    StakeholderPositionResponse,
    TrackAsHoldingResponse,
)
from ...services.stakeholder_position_service import (
    get_my_positions,
    get_my_position,
)
from ...services.holding_generation_service import track_position_as_holding
from apps.accounts.utils.auth_utils import get_current_user
from apps.accounts.models import User

router = APIRouter(tags=["Stakeholder Positions (Computed)"])


# ==========================================
# List Positions (all cap tables for one investor)
# ==========================================

@router.get("/", response_model=StakeholderPositionsResponse)
async def list_stakeholder_positions(
    source_entity_id: int = Query(..., description="Source entity ID (the investing entity)"),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    List all positions for a source entity (investor view) — requires VIEW permission on source entity.

    This endpoint:
    1. Verifies user has EntityOrganizationMember access to source_entity_id (their own entity)
    2. Delegates to stakeholder_position_service.get_my_positions() for cross-model computation
    3. Returns array of position summaries (entity_name, ownership%, total_units, total_invested)

    No access needed to target cap table entities — investor reads only their own position data.
    """
    try:
        # Auth: verify user has access to the source entity (their own entity)
        entity_access = await get_entity_access(user.id, source_entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        # get_my_positions handles: Stakeholder lookup → SecurityTransaction aggregation → ownership % calculation
        positions = await get_my_positions(source_entity_id, session)
        return StakeholderPositionsResponse(success=True, data=positions)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list stakeholder positions: {str(e)}")


# ==========================================
# Position Detail (single cap table with transactions)
# ==========================================

@router.get("/{entity_id}", response_model=StakeholderPositionResponse)
async def get_stakeholder_position(
    entity_id: int,
    source_entity_id: int = Query(..., description="Source entity ID (the investing entity)"),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get position detail for a source entity on a specific cap table — requires VIEW permission on source entity.

    This endpoint:
    1. Verifies user has EntityOrganizationMember access to source_entity_id (their own entity)
    2. Delegates to stakeholder_position_service.get_my_position() for cross-model computation
    3. Returns position summary with full SecurityTransaction list for this stakeholder
    """
    try:
        # Auth: verify user has access to the source entity (their own entity)
        entity_access = await get_entity_access(user.id, source_entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        # get_my_position handles: single Stakeholder lookup → SecurityTransactions + ownership % → serialize with transactions
        position = await get_my_position(source_entity_id, entity_id, session)
        if not position:
            raise HTTPException(status_code=404, detail="Position not found")

        return StakeholderPositionResponse(success=True, data=position)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stakeholder position: {str(e)}")


# ==========================================
# Track Position as Holding
# ==========================================

@router.post("/{entity_id}/track-as-holding", response_model=TrackAsHoldingResponse)
async def track_as_holding(
    entity_id: int,
    source_entity_id: int = Query(..., description="Source entity ID (the investing entity)"),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Create or update a Holding + HoldingCashFlows from this position's cap table data — requires EDITOR permission on source entity.

    This endpoint:
    1. Verifies user has EDITOR+ access to source_entity_id (their own entity)
    2. Delegates to holding_generation_service.track_position_as_holding() for cross-model creation
    3. Returns count of holdings and cash flows created

    Idempotent — calling multiple times won't duplicate cash flows (matched via cash_transaction_id).
    """
    try:
        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, source_entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # track_position_as_holding handles: find stakeholder → read transactions →
        # create/update Holding → create HoldingCashFlows (with inverted debit/credit)
        holdings_created, cash_flows_created = await track_position_as_holding(
            source_entity_id=source_entity_id,
            entity_id=entity_id,
            user_id=user.id,
            organization_id=entity_access.organization_id,
            session=session,
        )

        # Build response message
        parts = []
        if holdings_created > 0:
            parts.append(f"Created {holdings_created} holding")
        else:
            parts.append("Holding already existed (updated)")
        if cash_flows_created > 0:
            parts.append(f"{cash_flows_created} new cash flow(s) added")
        else:
            parts.append("no new cash flows")
        message = " — ".join(parts)

        return TrackAsHoldingResponse(
            success=True,
            holdings_created=holdings_created,
            cash_flows_created=cash_flows_created,
            message=message,
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to track as holding: {str(e)}")
