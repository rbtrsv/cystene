"""
Fee Subrouter

FastAPI router for Fee model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.captable_models import Fee, FundingRound
from ...schemas.captable_schemas.fee_schemas import (
    Fee as FeeSchema,
    FeeCreate, FeeUpdate,
    FeeResponse, FeesResponse,
    FeeType, Scenario
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

router = APIRouter(tags=["Fees"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=FeesResponse)
async def list_fees(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    funding_round_id: Optional[int] = Query(None, description="Filter by funding round"),
    fee_type: Optional[FeeType] = Query(None, description="Filter by fee type"),
    scenario: Optional[Scenario] = Query(None, description="Filter by scenario"),
    year: Optional[int] = Query(None, description="Filter by year"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List fees for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access (user's org → EntityOrganizationMember)
    3. Returns a paginated list of fees
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return FeesResponse(success=True, data=[])

        # Build query - filter by accessible entities
        query = select(Fee).filter(
            Fee.entity_id.in_(accessible_entity_ids)
        )
        query = apply_soft_delete_filter(query, Fee)

        # Apply filters
        if entity_id:
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(Fee.entity_id == entity_id)

        if funding_round_id:
            query = query.filter(Fee.funding_round_id == funding_round_id)

        if fee_type:
            query = query.filter(Fee.fee_type == fee_type.value)

        if scenario:
            query = query.filter(Fee.scenario == scenario.value)

        if year:
            query = query.filter(Fee.year == year)

        # Apply pagination
        query = query.order_by(Fee.created_at.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        fees = result.scalars().all()

        return FeesResponse(
            success=True,
            data=[FeeSchema.model_validate(fee) for fee in fees]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list fees: {str(e)}")

# ==========================================
# Individual Fee Operations
# ==========================================

@router.get("/{fee_id}", response_model=FeeResponse)
async def get_fee(
    fee_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get fee details - requires VIEW permission on entity

    This endpoint:
    1. Retrieves a fee by ID (excludes soft-deleted)
    2. Returns the fee details
    """
    try:
        fee = await get_record_or_404(session, Fee, fee_id, "Fee")

        # Check entity access
        entity_access = await get_entity_access(user.id, fee.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return FeeResponse(
            success=True,
            data=FeeSchema.model_validate(fee)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get fee: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=FeeResponse)
async def create_fee(
    data: FeeCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create fee - requires EDITOR, ADMIN, or OWNER role on entity.

    This endpoint:
    1. Creates a new fee with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created fee details
    """
    try:
        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # Verify funding round exists if provided
        if data.funding_round_id is not None:
            funding_round = await session.get(FundingRound, data.funding_round_id)
            if not funding_round:
                raise HTTPException(status_code=404, detail="Funding round not found")

        fee = await create_with_audit(
            db=session,
            model=Fee,
            table_name="fees",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(fee)

        return FeeResponse(
            success=True,
            data=FeeSchema.model_validate(fee)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create fee: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{fee_id}", response_model=FeeResponse)
async def update_fee(
    fee_id: int,
    data: FeeUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update fee - requires EDITOR, ADMIN, or OWNER role on entity

    This endpoint:
    1. Updates a fee with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated fee details
    """
    try:
        fee = await get_record_or_404(session, Fee, fee_id, "Fee")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, fee.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # If entity_id is being changed, verify access + role + subscription on new entity
        if data.entity_id is not None and data.entity_id != fee.entity_id:
            await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # Verify funding round exists if being changed
        if data.funding_round_id is not None and data.funding_round_id != fee.funding_round_id:
            if data.funding_round_id:  # Allow setting to None
                funding_round = await session.get(FundingRound, data.funding_round_id)
                if not funding_round:
                    raise HTTPException(status_code=404, detail="New funding round not found")

        await update_with_audit(
            db=session,
            item=fee,
            table_name="fees",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(fee)

        return FeeResponse(
            success=True,
            data=FeeSchema.model_validate(fee)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update fee: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{fee_id}")
async def delete_fee(
    fee_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete fee - requires ADMIN or OWNER role on entity

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        fee = await get_record_or_404(session, Fee, fee_id, "Fee")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, fee.entity_id, session, ['ADMIN', 'OWNER'])

        fee_type = fee.fee_type

        await soft_delete_with_audit(
            db=session,
            item=fee,
            table_name="fees",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": f"Fee '{fee_type}' has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete fee: {str(e)}")
