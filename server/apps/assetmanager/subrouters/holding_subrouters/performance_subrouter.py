"""
Performance Subrouter

FastAPI router for computed performance endpoints.
These endpoints compute metrics ON THE FLY from raw data — no CRUD operations.

Endpoints:
- GET /entity/{entity_id} — entity/fund level performance
- GET /holdings/{entity_id} — per-holding breakdown
- GET /stakeholders/{entity_id} — per-stakeholder returns
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from ...utils.dependency_utils import get_entity_access
from ...services.performance_service import (
    get_entity_performance,
    get_holdings_performance,
    get_stakeholder_returns,
)
from apps.accounts.utils.auth_utils import get_current_user
from apps.accounts.models import User

router = APIRouter(tags=["Performance (Computed)"])


# ==========================================
# Entity/Fund Performance
# ==========================================

@router.get("/entity/{entity_id}")
async def entity_performance(
    entity_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Compute entity-level performance metrics from holding cash flows, fees, and holdings.

    Returns: total_invested, total_returned, fair_value, total_fees,
             irr, tvpi, dpi, rvpi, fees_breakdown
    """
    try:
        # Check entity access
        entity_access = await get_entity_access(user.id, entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        data = await get_entity_performance(entity_id, session)
        return {"success": True, "data": data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute entity performance: {str(e)}")


# ==========================================
# Holdings Performance (per-holding breakdown)
# ==========================================

@router.get("/holdings/{entity_id}")
async def holdings_performance(
    entity_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Compute per-holding performance metrics from holding cash flows and holdings.

    Returns: Array of per-holding metrics (investment_name, total_invested, fair_value, irr, tvpi, moic)
    """
    try:
        # Check entity access
        entity_access = await get_entity_access(user.id, entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        data = await get_holdings_performance(entity_id, session)
        return {"success": True, "data": data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute holdings performance: {str(e)}")


# ==========================================
# Stakeholder Returns
# ==========================================

@router.get("/stakeholders/{entity_id}")
async def stakeholder_returns(
    entity_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Compute per-stakeholder performance metrics from security transactions and holdings NAV.

    Returns: Array of per-stakeholder metrics (stakeholder_name, ownership%, irr, tvpi, dpi, rvpi)
    """
    try:
        # Check entity access
        entity_access = await get_entity_access(user.id, entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        data = await get_stakeholder_returns(entity_id, session)
        return {"success": True, "data": data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute stakeholder returns: {str(e)}")
