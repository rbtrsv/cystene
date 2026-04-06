"""
Deal Subrouter

FastAPI router for Deal model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.deal_models import Deal
from ...schemas.deal_schemas.deal_schemas import (
    Deal as DealSchema,
    DealCreate, DealUpdate,
    DealResponse, DealsResponse,
    DealType, DealStatus,
    DealStatusUpdate, DealExecuteInput, DealExecuteResponse,
)
from ...utils.dependency_utils import get_entity_access, require_write_access
from ...utils.filtering_utils import get_user_entity_ids, apply_soft_delete_filter
from ...utils.crud_utils import (
    get_record_or_404,
    create_with_audit,
    update_with_audit,
    soft_delete_with_audit,
)
from ...services.deal_execution_service import execute_deal as execute_deal_service
from apps.accounts.utils.auth_utils import get_current_user
from apps.accounts.models import User

router = APIRouter(tags=["Deals"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=DealsResponse)
async def list_deals(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    deal_type: Optional[DealType] = Query(None, description="Filter by deal type"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List deals for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access (user's org → EntityOrganizationMember)
    3. Returns a paginated list of deals
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return DealsResponse(success=True, data=[])

        # Build query - filter by accessible entities
        query = select(Deal).filter(
            Deal.entity_id.in_(accessible_entity_ids)
        )
        query = apply_soft_delete_filter(query, Deal)

        # Apply filters
        if entity_id:
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(Deal.entity_id == entity_id)

        if deal_type:
            query = query.filter(Deal.deal_type == deal_type.value)

        # Apply pagination
        query = query.order_by(Deal.created_at.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        deals = result.scalars().all()

        return DealsResponse(
            success=True,
            data=[DealSchema.model_validate(deal) for deal in deals]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list deals: {str(e)}")

# ==========================================
# Individual Deal Operations
# ==========================================

@router.get("/{deal_id}", response_model=DealResponse)
async def get_deal(
    deal_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get deal details - requires VIEW permission on entity

    This endpoint:
    1. Retrieves a deal by ID (excludes soft-deleted)
    2. Returns the deal details
    """
    try:
        deal = await get_record_or_404(session, Deal, deal_id, "Deal")

        # Check entity access
        entity_access = await get_entity_access(user.id, deal.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return DealResponse(
            success=True,
            data=DealSchema.model_validate(deal)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get deal: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=DealResponse)
async def create_deal(
    data: DealCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create deal - requires EDITOR, ADMIN, or OWNER role on entity.

    This endpoint:
    1. Creates a new deal with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created deal details
    """
    try:
        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        deal = await create_with_audit(
            db=session,
            model=Deal,
            table_name="deals",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(deal)

        return DealResponse(
            success=True,
            data=DealSchema.model_validate(deal)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create deal: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{deal_id}", response_model=DealResponse)
async def update_deal(
    deal_id: int,
    data: DealUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update deal - requires EDITOR, ADMIN, or OWNER role on entity

    This endpoint:
    1. Updates a deal with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated deal details
    """
    try:
        deal = await get_record_or_404(session, Deal, deal_id, "Deal")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, deal.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # If entity_id is being changed, verify access + role + subscription on new entity
        if data.entity_id is not None and data.entity_id != deal.entity_id:
            await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        await update_with_audit(
            db=session,
            item=deal,
            table_name="deals",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(deal)

        return DealResponse(
            success=True,
            data=DealSchema.model_validate(deal)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update deal: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{deal_id}")
async def delete_deal(
    deal_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete deal - requires ADMIN or OWNER role on entity

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        deal = await get_record_or_404(session, Deal, deal_id, "Deal")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, deal.entity_id, session, ['ADMIN', 'OWNER'])

        name = deal.name

        await soft_delete_with_audit(
            db=session,
            item=deal,
            table_name="deals",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": f"Deal '{name}' has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete deal: {str(e)}")

# ==========================================
# Status Transition Operations
# ==========================================

# Why: Status transitions are controlled separately from general deal updates
# to enforce allowed transition paths and prevent invalid state changes.
# The execute endpoint is the only way to reach 'executed' status.
ALLOWED_TRANSITIONS: dict[str, list[str]] = {
    "draft": ["active"],
    "active": ["closed", "cancelled"],
    "closed": ["active", "cancelled"],
    # executed → nothing (permanent)
    # cancelled → nothing (permanent)
}

@router.put("/{deal_id}/status", response_model=DealResponse)
async def update_deal_status(
    deal_id: int,
    data: DealStatusUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update deal status - requires ADMIN or OWNER role on entity.

    Allowed transitions:
    - draft → active (deal published)
    - active → closed (deal closed for new commitments)
    - active → cancelled (deal cancelled)
    - closed → active (deal reopened)
    - closed → cancelled (deal cancelled)

    Forbidden:
    - Any → executed (only via POST /{deal_id}/execute)
    - executed → any (permanent)
    - cancelled → any (permanent)
    """
    try:
        deal = await get_record_or_404(session, Deal, deal_id, "Deal")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, deal.entity_id, session, ['ADMIN', 'OWNER'])

        # Cannot transition to 'executed' via this endpoint
        if data.status == DealStatus.EXECUTED:
            raise HTTPException(
                status_code=400,
                detail="Cannot set status to 'executed' directly. Use POST /{deal_id}/execute instead."
            )

        # Check allowed transitions
        allowed = ALLOWED_TRANSITIONS.get(deal.status, [])
        if data.status.value not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from '{deal.status}' to '{data.status.value}'. Allowed: {allowed}"
            )

        await update_with_audit(
            db=session,
            item=deal,
            table_name="deals",
            payload={"status": data.status.value},
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(deal)

        return DealResponse(
            success=True,
            data=DealSchema.model_validate(deal)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update deal status: {str(e)}")

# ==========================================
# Deal Execution Operations
# ==========================================

@router.post("/{deal_id}/execute", response_model=DealExecuteResponse)
async def execute_deal(
    deal_id: int,
    data: DealExecuteInput,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Execute a fundraising deal — creates FundingRound + Security + Stakeholders + SecurityTransactions.

    This endpoint:
    1. Validates deal is 'active' or 'closed' and deal_type is 'fundraising'
    2. Delegates to deal_execution_service.execute_deal()
    3. Creates FundingRound, Security, Stakeholders (find-or-create), SecurityTransactions (ISSUANCE)
    4. Links Deal.funding_round_id and sets Deal.status = 'executed'
    5. Links each DealCommitment.transaction_id to its created SecurityTransaction
    6. Returns summary counts

    Requires: ADMIN or OWNER role on Deal.entity_id
    """
    try:
        # Pre-check: load deal to get entity_id for access check
        deal = await get_record_or_404(session, Deal, deal_id, "Deal")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, deal.entity_id, session, ['ADMIN', 'OWNER'])

        # Delegate to service for business logic
        result = await execute_deal_service(
            deal_id=deal_id,
            round_type=data.round_type,
            security_name=data.security_name,
            security_code=data.security_code,
            security_type=data.security_type,
            stakeholder_type=data.stakeholder_type,
            user_id=user.id,
            organization_id=entity_access.organization_id,
            session=session,
        )

        await session.commit()

        return DealExecuteResponse(
            success=True,
            funding_round_id=result["funding_round_id"],
            security_id=result["security_id"],
            stakeholders_created=result["stakeholders_created"],
            transactions_created=result["transactions_created"],
            total_amount=result["total_amount"],
            message=f"Deal executed successfully. Created {result['transactions_created']} transactions totaling ${result['total_amount']:,.2f}",
        )

    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to execute deal: {str(e)}")
