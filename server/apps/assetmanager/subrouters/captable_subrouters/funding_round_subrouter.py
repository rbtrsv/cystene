"""
FundingRound Subrouter

FastAPI router for FundingRound model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import date

from core.db import get_session
from ...models.captable_models import FundingRound
from ...schemas.captable_schemas.funding_round_schemas import (
    FundingRound as FundingRoundSchema,
    FundingRoundCreate, FundingRoundUpdate,
    FundingRoundResponse, FundingRoundsResponse,
    RoundType
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

router = APIRouter(tags=["Funding Rounds"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=FundingRoundsResponse)
async def list_funding_rounds(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    round_type: Optional[RoundType] = Query(None, description="Filter by round type"),
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List funding rounds for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access (user's org → EntityOrganizationMember)
    3. Returns a paginated list of funding rounds
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return FundingRoundsResponse(success=True, data=[])

        # Build query - filter by accessible entities
        query = select(FundingRound).filter(
            FundingRound.entity_id.in_(accessible_entity_ids)
        )
        query = apply_soft_delete_filter(query, FundingRound)

        # Apply filters
        if entity_id:
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(FundingRound.entity_id == entity_id)

        if round_type:
            query = query.filter(FundingRound.round_type == round_type.value)

        if start_date:
            query = query.filter(FundingRound.date >= start_date)

        if end_date:
            query = query.filter(FundingRound.date <= end_date)

        # Apply pagination
        query = query.order_by(FundingRound.date.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        funding_rounds = result.scalars().all()

        return FundingRoundsResponse(
            success=True,
            data=[FundingRoundSchema.model_validate(round) for round in funding_rounds]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list funding rounds: {str(e)}")

# ==========================================
# Individual FundingRound Operations
# ==========================================

@router.get("/{funding_round_id}", response_model=FundingRoundResponse)
async def get_funding_round(
    funding_round_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get funding round details - requires VIEW permission on entity

    This endpoint:
    1. Retrieves a funding round by ID (excludes soft-deleted)
    2. Returns the funding round details
    """
    try:
        funding_round = await get_record_or_404(
            session, FundingRound, funding_round_id, "Funding round"
        )

        # Check entity access
        entity_access = await get_entity_access(user.id, funding_round.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return FundingRoundResponse(
            success=True,
            data=FundingRoundSchema.model_validate(funding_round)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get funding round: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=FundingRoundResponse)
async def create_funding_round(
    data: FundingRoundCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create funding round - requires EDITOR, ADMIN, or OWNER role on entity.

    This endpoint:
    1. Creates a new funding round with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created funding round details
    """
    try:
        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        funding_round = await create_with_audit(
            db=session,
            model=FundingRound,
            table_name="funding_rounds",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(funding_round)

        return FundingRoundResponse(
            success=True,
            data=FundingRoundSchema.model_validate(funding_round)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create funding round: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{funding_round_id}", response_model=FundingRoundResponse)
async def update_funding_round(
    funding_round_id: int,
    data: FundingRoundUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update funding round - requires EDITOR, ADMIN, or OWNER role on entity

    This endpoint:
    1. Updates a funding round with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated funding round details
    """
    try:
        funding_round = await get_record_or_404(
            session, FundingRound, funding_round_id, "Funding round"
        )

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, funding_round.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # If entity_id is being changed, verify access + role + subscription on new entity
        if data.entity_id is not None and data.entity_id != funding_round.entity_id:
            await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        await update_with_audit(
            db=session,
            item=funding_round,
            table_name="funding_rounds",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(funding_round)

        return FundingRoundResponse(
            success=True,
            data=FundingRoundSchema.model_validate(funding_round)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update funding round: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{funding_round_id}")
async def delete_funding_round(
    funding_round_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete funding round - requires ADMIN or OWNER role on entity

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        funding_round = await get_record_or_404(
            session, FundingRound, funding_round_id, "Funding round"
        )

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, funding_round.entity_id, session, ['ADMIN', 'OWNER'])

        name = funding_round.name

        await soft_delete_with_audit(
            db=session,
            item=funding_round,
            table_name="funding_rounds",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": f"Funding round '{name}' has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete funding round: {str(e)}")
