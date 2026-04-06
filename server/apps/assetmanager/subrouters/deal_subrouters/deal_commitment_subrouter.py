"""
DealCommitment Subrouter

FastAPI router for DealCommitment model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.deal_models import DealCommitment, Deal
from ...models.entity_models import Entity
from ...schemas.deal_schemas.deal_commitment_schemas import (
    DealCommitment as DealCommitmentSchema,
    DealCommitmentCreate, DealCommitmentUpdate,
    DealCommitmentResponse, DealCommitmentsResponse,
    CommitmentType
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

router = APIRouter(tags=["Deal Commitments"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=DealCommitmentsResponse)
async def list_deal_commitments(
    deal_id: Optional[int] = Query(None, description="Filter by deal"),
    entity_id: Optional[int] = Query(None, description="Filter by committing entity"),
    commitment_type: Optional[CommitmentType] = Query(None, description="Filter by commitment type"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List deal commitments for deals the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access through Deal → entity_id
    3. Returns a paginated list of deal commitments
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return DealCommitmentsResponse(success=True, data=[])

        # Build query - join through Deal to filter by accessible entities
        # Apply soft-delete filter on both DealCommitment and the joined Deal
        query = (
            select(DealCommitment)
            .join(Deal, DealCommitment.deal_id == Deal.id)
            .filter(Deal.entity_id.in_(accessible_entity_ids))
            .filter(Deal.deleted_at.is_(None))
        )
        query = apply_soft_delete_filter(query, DealCommitment)

        # Apply filters
        if deal_id:
            # Verify deal exists (soft-delete aware) and entity is accessible
            deal = await get_record_or_404(session, Deal, deal_id, "Deal")
            if deal.entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this deal's entity")
            query = query.filter(DealCommitment.deal_id == deal_id)

        if entity_id:
            query = query.filter(DealCommitment.entity_id == entity_id)

        if commitment_type:
            query = query.filter(DealCommitment.commitment_type == commitment_type.value)

        # Apply pagination
        query = query.order_by(DealCommitment.created_at.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        commitments = result.scalars().all()

        return DealCommitmentsResponse(
            success=True,
            data=[DealCommitmentSchema.model_validate(commitment) for commitment in commitments]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list deal commitments: {str(e)}")

# ==========================================
# Individual DealCommitment Operations
# ==========================================

@router.get("/{commitment_id}", response_model=DealCommitmentResponse)
async def get_deal_commitment(
    commitment_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get deal commitment details - requires VIEW permission on deal's entity

    This endpoint:
    1. Retrieves a deal commitment by ID (excludes soft-deleted)
    2. Checks access through Deal → entity_id
    3. Returns the commitment details
    """
    try:
        commitment = await get_record_or_404(session, DealCommitment, commitment_id, "Deal commitment")

        # Check entity access through the deal (soft-delete aware)
        deal = await get_record_or_404(session, Deal, commitment.deal_id, "Associated deal")

        entity_access = await get_entity_access(user.id, deal.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this deal's entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return DealCommitmentResponse(
            success=True,
            data=DealCommitmentSchema.model_validate(commitment)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get deal commitment: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=DealCommitmentResponse)
async def create_deal_commitment(
    data: DealCommitmentCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create deal commitment - requires EDITOR, ADMIN, or OWNER role on deal's entity.

    This endpoint:
    1. Verifies deal FK exists and user has access to deal's entity
    2. Enforces composite uniqueness on (deal_id, entity_id)
    3. Creates a new deal commitment with the provided data
    4. Sets created_by from user context
    5. Logs the creation to the audit log
    6. Returns the created commitment details
    """
    try:
        # Verify deal exists (soft-delete aware) and check entity access
        deal = await get_record_or_404(session, Deal, data.deal_id, "Deal")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, deal.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # Verify entity FK exists (soft-delete aware)
        await get_record_or_404(session, Entity, data.entity_id, "Committing entity")

        # Enforce composite uniqueness — one commitment per (deal_id, entity_id)
        await check_duplicate(
            db=session,
            model=DealCommitment,
            filters={
                "deal_id": data.deal_id,
                "entity_id": data.entity_id,
            },
            entity_label="Deal commitment",
        )

        commitment = await create_with_audit(
            db=session,
            model=DealCommitment,
            table_name="deal_commitments",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(commitment)

        return DealCommitmentResponse(
            success=True,
            data=DealCommitmentSchema.model_validate(commitment)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create deal commitment: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{commitment_id}", response_model=DealCommitmentResponse)
async def update_deal_commitment(
    commitment_id: int,
    data: DealCommitmentUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update deal commitment - requires EDITOR, ADMIN, or OWNER role on deal's entity

    This endpoint:
    1. Updates a deal commitment with the provided data
    2. Validates FK changes (deal, entity)
    3. Re-checks composite uniqueness if relevant fields change
    4. Sets updated_by from user context
    5. Logs the update to the audit log with old/new data
    6. Returns the updated commitment details
    """
    try:
        commitment = await get_record_or_404(session, DealCommitment, commitment_id, "Deal commitment")

        # Check entity access through the deal (soft-delete aware)
        deal = await get_record_or_404(session, Deal, commitment.deal_id, "Associated deal")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, deal.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # Validate deal FK change (soft-delete aware)
        if data.deal_id is not None and data.deal_id != commitment.deal_id:
            new_deal = await get_record_or_404(session, Deal, data.deal_id, "New deal")

            # Check access + role + subscription on new deal's entity
            await require_write_access(user.id, new_deal.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # Validate entity FK change (soft-delete aware)
        if data.entity_id is not None and data.entity_id != commitment.entity_id:
            await get_record_or_404(session, Entity, data.entity_id, "New committing entity")

        # Re-check composite uniqueness if any of the unique fields change
        new_deal_id = data.deal_id if data.deal_id is not None else commitment.deal_id
        new_entity_id = data.entity_id if data.entity_id is not None else commitment.entity_id

        if (new_deal_id != commitment.deal_id or
            new_entity_id != commitment.entity_id):
            await check_duplicate(
                db=session,
                model=DealCommitment,
                filters={
                    "deal_id": new_deal_id,
                    "entity_id": new_entity_id,
                },
                entity_label="Deal commitment",
                exclude_id=commitment_id,
            )

        await update_with_audit(
            db=session,
            item=commitment,
            table_name="deal_commitments",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(commitment)

        return DealCommitmentResponse(
            success=True,
            data=DealCommitmentSchema.model_validate(commitment)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update deal commitment: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{commitment_id}")
async def delete_deal_commitment(
    commitment_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete deal commitment - requires ADMIN or OWNER role on deal's entity

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        commitment = await get_record_or_404(session, DealCommitment, commitment_id, "Deal commitment")

        # Check entity access through the deal (soft-delete aware)
        deal = await get_record_or_404(session, Deal, commitment.deal_id, "Associated deal")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, deal.entity_id, session, ['ADMIN', 'OWNER'])

        await soft_delete_with_audit(
            db=session,
            item=commitment,
            table_name="deal_commitments",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "Deal commitment has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete deal commitment: {str(e)}")
