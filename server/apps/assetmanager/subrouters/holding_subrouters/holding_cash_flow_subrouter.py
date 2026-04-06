"""
HoldingCashFlow Subrouter

FastAPI router for HoldingCashFlow model CRUD operations.
Child of Holding — access control through entity_id directly.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.holding_models import HoldingCashFlow, Holding
from ...models.entity_models import Entity
from ...models.captable_models import FundingRound, SecurityTransaction
from ...schemas.holding_schemas.holding_cash_flow_schemas import (
    HoldingCashFlow as HoldingCashFlowSchema,
    HoldingCashFlowCreate, HoldingCashFlowUpdate,
    HoldingCashFlowResponse, HoldingCashFlowsResponse
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

router = APIRouter(tags=["Holding Cash Flows"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=HoldingCashFlowsResponse)
async def list_holding_cash_flows(
    holding_id: Optional[int] = Query(None, description="Filter by holding"),
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    cash_flow_type: Optional[str] = Query(None, description="Filter by cash flow type"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List holding cash flows for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters out cash flows whose parent Holding is soft-deleted
    3. Filters by entity access via get_user_entity_ids
    4. Returns a paginated list of holding cash flows
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return HoldingCashFlowsResponse(success=True, data=[])

        # Build query - join with Holding to filter by accessible entities and soft-deleted parents
        query = (
            select(HoldingCashFlow)
            .join(Holding, HoldingCashFlow.holding_id == Holding.id)
            .filter(HoldingCashFlow.entity_id.in_(accessible_entity_ids))
            .filter(Holding.deleted_at.is_(None))
        )
        query = apply_soft_delete_filter(query, HoldingCashFlow)

        # Apply filters
        if holding_id:
            # Verify holding exists (soft-delete aware) and entity is accessible
            holding = await get_record_or_404(session, Holding, holding_id, "Holding")
            if holding.entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this holding's entity")
            query = query.filter(HoldingCashFlow.holding_id == holding_id)

        if entity_id:
            # Verify entity exists (soft-delete aware) and is accessible
            await get_record_or_404(session, Entity, entity_id, "Entity")
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(HoldingCashFlow.entity_id == entity_id)

        if cash_flow_type:
            query = query.filter(HoldingCashFlow.cash_flow_type == cash_flow_type)

        # Apply pagination
        query = query.order_by(HoldingCashFlow.date.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        cash_flows = result.scalars().all()

        return HoldingCashFlowsResponse(
            success=True,
            data=[HoldingCashFlowSchema.model_validate(cf) for cf in cash_flows]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list holding cash flows: {str(e)}")

# ==========================================
# Individual HoldingCashFlow Operations
# ==========================================

@router.get("/{cash_flow_id}", response_model=HoldingCashFlowResponse)
async def get_holding_cash_flow(
    cash_flow_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get holding cash flow details - requires VIEW permission on entity.

    This endpoint:
    1. Retrieves a holding cash flow by ID (excludes soft-deleted)
    2. Returns the holding cash flow details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        cash_flow = await get_record_or_404(session, HoldingCashFlow, cash_flow_id, "Holding cash flow")

        # Check entity access via cash flow's direct entity_id
        entity_access = await get_entity_access(user.id, cash_flow.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return HoldingCashFlowResponse(
            success=True,
            data=HoldingCashFlowSchema.model_validate(cash_flow)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get holding cash flow: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=HoldingCashFlowResponse)
async def create_holding_cash_flow(
    data: HoldingCashFlowCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create holding cash flow - requires EDIT permission on entity.

    This endpoint:
    1. Creates a new holding cash flow with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created holding cash flow details
    """
    try:
        # Verify holding exists (soft-delete aware)
        await get_record_or_404(session, Holding, data.holding_id, "Holding")

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

        # Verify cash_transaction FK if provided (soft-delete aware)
        if data.cash_transaction_id is not None:
            await get_record_or_404(session, SecurityTransaction, data.cash_transaction_id, "Security transaction")


        # create_with_audit handles: model(**payload, created_by=user_id) + flush + INSERT audit
        cash_flow = await create_with_audit(
            db=session,
            model=HoldingCashFlow,
            table_name="holding_cash_flows",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(cash_flow)

        return HoldingCashFlowResponse(
            success=True,
            data=HoldingCashFlowSchema.model_validate(cash_flow)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create holding cash flow: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{cash_flow_id}", response_model=HoldingCashFlowResponse)
async def update_holding_cash_flow(
    cash_flow_id: int,
    data: HoldingCashFlowUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update holding cash flow - requires EDIT permission on entity.

    This endpoint:
    1. Updates a holding cash flow with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated holding cash flow details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        cash_flow = await get_record_or_404(session, HoldingCashFlow, cash_flow_id, "Holding cash flow")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, cash_flow.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # If updating holding_id, verify it exists (soft-delete aware)
        if data.holding_id is not None and data.holding_id != cash_flow.holding_id:
            await get_record_or_404(session, Holding, data.holding_id, "New holding")

        # If updating entity_id, verify it exists (soft-delete aware)
        if data.entity_id is not None and data.entity_id != cash_flow.entity_id:
            await get_record_or_404(session, Entity, data.entity_id, "New entity")

        # If updating target_entity_id, verify it exists (soft-delete aware)
        if data.target_entity_id is not None and data.target_entity_id != cash_flow.target_entity_id:
            await get_record_or_404(session, Entity, data.target_entity_id, "New target entity")

        # If updating funding_round_id, verify it exists (soft-delete aware)
        if data.funding_round_id is not None and data.funding_round_id != cash_flow.funding_round_id:
            await get_record_or_404(session, FundingRound, data.funding_round_id, "New funding round")

        # If updating cash_transaction_id, verify it exists (soft-delete aware)
        if data.cash_transaction_id is not None and data.cash_transaction_id != cash_flow.cash_transaction_id:
            await get_record_or_404(session, SecurityTransaction, data.cash_transaction_id, "New security transaction")


        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        await update_with_audit(
            db=session,
            item=cash_flow,
            table_name="holding_cash_flows",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(cash_flow)

        return HoldingCashFlowResponse(
            success=True,
            data=HoldingCashFlowSchema.model_validate(cash_flow)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update holding cash flow: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{cash_flow_id}")
async def delete_holding_cash_flow(
    cash_flow_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete holding cash flow - requires ADMIN permission on entity.

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        cash_flow = await get_record_or_404(session, HoldingCashFlow, cash_flow_id, "Holding cash flow")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, cash_flow.entity_id, session, ['ADMIN', 'OWNER'])


        # soft_delete_with_audit handles: old snapshot + deleted_at/deleted_by + DELETE audit
        await soft_delete_with_audit(
            db=session,
            item=cash_flow,
            table_name="holding_cash_flows",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "Holding cash flow has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete holding cash flow: {str(e)}")
