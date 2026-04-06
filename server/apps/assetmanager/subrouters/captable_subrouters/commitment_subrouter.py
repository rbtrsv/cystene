"""
Commitment Subrouter

FastAPI router for Commitment model CRUD operations.
Pro-rata subscription commitment for funding rounds.
7 endpoints: list, get, bulk create, respond, review, generate transaction, soft delete.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime, timezone
import math

from core.db import get_session
from ...models.captable_models import Commitment, FundingRound, SecurityTransaction, Security
from ...models.entity_models import Entity, Stakeholder
from ...schemas.captable_schemas.commitment_schemas import (
    Commitment as CommitmentSchema,
    CommitmentCreate, CommitmentRespond, CommitmentReview,
    CommitmentResponse, CommitmentsResponse,
    CommitmentStatus
)
from ...services.commitment_service import get_commitments_detail, get_commitment_detail, calculate_pro_rata
from ...utils.dependency_utils import get_entity_access, require_write_access, check_entity_subscription
from ...utils.filtering_utils import get_user_entity_ids
from ...utils.crud_utils import (
    get_record_or_404,
    create_with_audit,
    update_with_audit,
    soft_delete_with_audit,
)
from apps.accounts.utils.auth_utils import get_current_user
from apps.accounts.models import User

router = APIRouter(tags=["Commitments"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=CommitmentsResponse)
async def list_commitments(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    funding_round_id: Optional[int] = Query(None, description="Filter by funding round"),
    stakeholder_id: Optional[int] = Query(None, description="Filter by stakeholder"),
    source_entity_id: Optional[int] = Query(None, description="Filter by stakeholder's source entity (for stakeholder view — 'My Invitations')"),
    status: Optional[CommitmentStatus] = Query(None, description="Filter by commitment status"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List commitments for entities the user has access to.
    Returns CommitmentDetail (enriched with JOINed names from 5 tables).

    This endpoint:
    1. Delegates to commitment_service for cross-model JOIN query
    2. Filters by entity access (user's org → EntityOrganizationMember)
    3. Optionally filters by source_entity_id (stakeholder view — "My Invitations" tab)
    4. Returns a paginated list of commitments ordered by invited_at desc
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return CommitmentsResponse(success=True, data=[])

        # Permission check: source_entity_id must be accessible
        if source_entity_id and source_entity_id not in accessible_entity_ids:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        # Permission check: entity_id must be accessible
        if entity_id and entity_id not in accessible_entity_ids:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        # Delegate to service for cross-model JOIN query
        details = await get_commitments_detail(
            session,
            accessible_entity_ids,
            entity_id=entity_id,
            funding_round_id=funding_round_id,
            stakeholder_id=stakeholder_id,
            source_entity_id=source_entity_id,
            status=status,
            limit=limit,
            offset=offset,
        )

        return CommitmentsResponse(success=True, data=details)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list commitments: {str(e)}")

# ==========================================
# Individual Commitment Operations
# ==========================================

@router.get("/{commitment_id}", response_model=CommitmentResponse)
async def get_commitment(
    commitment_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get commitment details - requires VIEW permission on entity.
    Returns CommitmentDetail (enriched with JOINed names from 5 tables).

    This endpoint:
    1. Retrieves a commitment by ID with resolved names (excludes soft-deleted)
    2. Checks entity access
    3. Returns the enriched commitment details
    """
    try:
        # Use service for enriched query — also handles soft-delete filter
        detail = await get_commitment_detail(session, commitment_id)

        if not detail:
            raise HTTPException(status_code=404, detail="Commitment not found")

        # Check entity access (VIEWER+) — issuer path OR LP path via source_entity_id
        entity_access = await get_entity_access(user.id, detail.entity_id, session)
        if entity_access and entity_access.role in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            pass  # Issuer path — has direct entity access
        else:
            # LP path: check access via source_entity_id (stakeholder's own entity)
            stakeholder = await session.get(Stakeholder, detail.stakeholder_id)
            if not stakeholder:
                raise HTTPException(status_code=403, detail="You do not have access to this commitment")
            source_access = await get_entity_access(user.id, stakeholder.source_entity_id, session)
            if not source_access or source_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
                raise HTTPException(status_code=403, detail="You do not have access to this commitment")

        return CommitmentResponse(success=True, data=detail)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get commitment: {str(e)}")

# ==========================================
# Create Operations (Invite Single Stakeholder)
# ==========================================

@router.post("/", response_model=CommitmentResponse)
async def create_commitment(
    data: CommitmentCreate,
    raise_amount: float = Query(..., gt=0, description="Amount to raise — used for pro-rata calculation, not persisted"),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create a single commitment invitation for a stakeholder in a funding round.

    Architecture note:
    - CommitmentCreate body contains only fields that map to model columns (entity_id,
      funding_round_id, stakeholder_id) — consistent with SecurityTransactionCreate pattern.
    - raise_amount is a query parameter because it's a calculation input, not a persisted field.
      The admin decides how much to raise; pro-rata is calculated from this, not from
      FundingRound.target_amount (which may differ from the actual raise).
    - Frontend iterates selected stakeholders and sends one request per stakeholder.

    Pro-rata calculation:
    - Get all SecurityTransactions for the entity → net units per stakeholder
    - total_fund_units = sum of all stakeholders' net units
    - ownership_pct = (this stakeholder's units / total_fund_units) * 100
    - pro_rata_amount = round(ownership_pct / 100 * raise_amount, 2)
    """
    try:
        # Verify entity exists (soft-delete aware)
        await get_record_or_404(session, Entity, data.entity_id, "Entity")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # Verify funding round exists (soft-delete aware)
        funding_round = await get_record_or_404(session, FundingRound, data.funding_round_id, "Funding round")

        # Verify security exists and belongs to the same funding round
        security = await get_record_or_404(session, Security, data.security_id, "Security")
        if security.funding_round_id != data.funding_round_id:
            raise HTTPException(
                status_code=400,
                detail="Security does not belong to the specified funding round"
            )

        # Verify stakeholder exists (soft-delete aware)
        stakeholder = await get_record_or_404(session, Stakeholder, data.stakeholder_id, "Stakeholder")

        # Pro-rata calculation — delegated to service (cross-model query)
        ownership_pct, pro_rata_amount = await calculate_pro_rata(
            session, data.entity_id, data.stakeholder_id, raise_amount
        )

        now = datetime.now(timezone.utc)

        # data.model_dump() provides model-column fields (entity_id, funding_round_id, stakeholder_id)
        # Server-side fields override AFTER spread — safe from client injection (see Pydantic stripping)
        payload = {
            **data.model_dump(),
            "status": "invited",
            "pro_rata_percentage": round(ownership_pct, 2),
            "pro_rata_amount": pro_rata_amount,
            "invited_by": user.id,
            "invited_at": now,
        }

        commitment = await create_with_audit(
            db=session,
            model=Commitment,
            table_name="commitments",
            payload=payload,
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        # Return enriched CommitmentDetail with resolved names
        detail = await get_commitment_detail(session, commitment.id)
        return CommitmentResponse(success=True, data=detail)

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create commitment: {str(e)}")

# ==========================================
# Respond Operations (Stakeholder responds)
# ==========================================

@router.put("/{commitment_id}/respond", response_model=CommitmentResponse)
async def respond_to_commitment(
    commitment_id: int,
    data: CommitmentRespond,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Stakeholder responds to a commitment invitation — committed or passed.

    This endpoint:
    1. Validates commitment is in 'invited' status
    2. Validates business rules for committed responses (type, amount)
    3. Updates commitment with response data
    4. Returns the updated commitment

    Business validation when status == committed:
    - commitment_type required
    - committed_amount required
    - full_pro_rata → committed_amount == pro_rata_amount
    - partial → 0 < committed_amount < pro_rata_amount
    - over_subscription → committed_amount > pro_rata_amount
    """
    try:
        commitment = await get_record_or_404(
            session, Commitment, commitment_id, "Commitment"
        )

        # Check entity access — issuer path (EDITOR+) OR LP path via source_entity_id (VIEWER+)
        entity_access = await get_entity_access(user.id, commitment.entity_id, session)
        if entity_access and entity_access.role in ['EDITOR', 'ADMIN', 'OWNER']:
            pass  # Issuer path — admin responds on behalf of entity
        else:
            # LP path: check access via source_entity_id (stakeholder's own entity)
            stakeholder = await session.get(Stakeholder, commitment.stakeholder_id)
            if not stakeholder:
                raise HTTPException(status_code=403, detail="You do not have access to this commitment")
            source_access = await get_entity_access(user.id, stakeholder.source_entity_id, session)
            if not source_access or source_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
                raise HTTPException(status_code=403, detail="You do not have access to this commitment")

        # Subscription check — entity owner org must have active subscription for writes
        await check_entity_subscription(commitment.entity_id, session)

        # Status validation: must be 'invited'
        if commitment.status != "invited":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot respond to commitment with status '{commitment.status}'. Must be 'invited'."
            )

        # Business validation when committing
        if data.status == "committed":
            if not data.commitment_type:
                raise HTTPException(status_code=400, detail="commitment_type is required when status is 'committed'")

            if data.committed_amount is None:
                raise HTTPException(status_code=400, detail="committed_amount is required when status is 'committed'")

            pro_rata = float(commitment.pro_rata_amount)

            if data.commitment_type == "full_pro_rata":
                if data.committed_amount != pro_rata:
                    raise HTTPException(
                        status_code=400,
                        detail=f"For full_pro_rata, committed_amount must equal pro_rata_amount ({pro_rata})"
                    )

            elif data.commitment_type == "partial":
                if not (0 < data.committed_amount < pro_rata):
                    raise HTTPException(
                        status_code=400,
                        detail=f"For partial, committed_amount must be between 0 and pro_rata_amount ({pro_rata})"
                    )

            elif data.commitment_type == "over_subscription":
                if data.committed_amount <= pro_rata:
                    raise HTTPException(
                        status_code=400,
                        detail=f"For over_subscription, committed_amount must be greater than pro_rata_amount ({pro_rata})"
                    )

        now = datetime.now(timezone.utc)

        # Path-aware org for audit trail
        if entity_access and entity_access.role in ['EDITOR', 'ADMIN', 'OWNER']:
            # Issuer path — org through which they access the cap table entity
            org_id = entity_access.organization_id
        else:
            # LP path — org through which they access their own source entity
            org_id = source_access.organization_id

        update_payload = {
            "status": data.status,
            "responded_at": now,
        }

        if data.status == "committed":
            update_payload["commitment_type"] = data.commitment_type
            update_payload["committed_amount"] = data.committed_amount

        if data.notes is not None:
            update_payload["notes"] = data.notes

        await update_with_audit(
            db=session,
            item=commitment,
            table_name="commitments",
            payload=update_payload,
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()

        # Return enriched CommitmentDetail with resolved names
        detail = await get_commitment_detail(session, commitment.id)
        return CommitmentResponse(success=True, data=detail)

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to respond to commitment: {str(e)}")

# ==========================================
# Review Operations (Admin reviews)
# ==========================================

@router.put("/{commitment_id}/review", response_model=CommitmentResponse)
async def review_commitment(
    commitment_id: int,
    data: CommitmentReview,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Admin reviews a committed commitment — approved or rejected.

    This endpoint:
    1. Validates commitment is in 'committed' status
    2. Sets reviewed_at and reviewed_by
    3. Returns the updated commitment
    """
    try:
        commitment = await get_record_or_404(
            session, Commitment, commitment_id, "Commitment"
        )

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, commitment.entity_id, session, ['ADMIN', 'OWNER'])

        # Status validation: must be 'committed'
        if commitment.status != "committed":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot review commitment with status '{commitment.status}'. Must be 'committed'."
            )

        now = datetime.now(timezone.utc)

        update_payload = {
            "status": data.status,
            "reviewed_at": now,
            "reviewed_by": user.id,
        }

        await update_with_audit(
            db=session,
            item=commitment,
            table_name="commitments",
            payload=update_payload,
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        # Return enriched CommitmentDetail with resolved names
        detail = await get_commitment_detail(session, commitment.id)
        return CommitmentResponse(success=True, data=detail)

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to review commitment: {str(e)}")

# ==========================================
# Generate Transaction (Admin generates ISSUANCE tx)
# ==========================================

from pydantic import BaseModel, Field

class GenerateTransactionInput(BaseModel):
    """Input for generating an ISSUANCE transaction from an approved commitment.
    security_id is no longer needed — it's already on the commitment itself."""
    transaction_reference: str = Field(description="Transaction reference for the ISSUANCE")

@router.post("/{commitment_id}/generate-transaction", response_model=CommitmentResponse)
async def generate_transaction(
    commitment_id: int,
    data: GenerateTransactionInput,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Generate an ISSUANCE SecurityTransaction from an approved commitment.

    This endpoint:
    1. Validates commitment is in 'approved' status and has no transaction_id yet
    2. Verifies security exists and gets issue_price
    3. Calculates units_credit = floor(committed_amount / issue_price)
    4. Creates a SecurityTransaction (type=ISSUANCE) with create_with_audit
    5. Links the transaction to the commitment
    6. Returns the updated commitment
    """
    try:
        commitment = await get_record_or_404(
            session, Commitment, commitment_id, "Commitment"
        )

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, commitment.entity_id, session, ['ADMIN', 'OWNER'])

        # Status validation: must be 'approved' and no transaction generated yet
        if commitment.status != "approved":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot generate transaction for commitment with status '{commitment.status}'. Must be 'approved'."
            )

        if commitment.transaction_id is not None:
            raise HTTPException(
                status_code=400,
                detail="Transaction already generated for this commitment"
            )

        # Verify transaction_reference is unique
        existing_ref = await session.execute(
            select(SecurityTransaction.id).filter(
                SecurityTransaction.transaction_reference == data.transaction_reference
            )
        )
        if existing_ref.scalar():
            raise HTTPException(
                status_code=400,
                detail=f"Transaction reference '{data.transaction_reference}' already exists"
            )

        # Security is already on the commitment — no need to pass it in the request body
        security = await get_record_or_404(session, Security, commitment.security_id, "Security")

        # Calculate units from committed amount and issue price
        if not security.issue_price or float(security.issue_price) <= 0:
            raise HTTPException(
                status_code=400,
                detail="Security issue_price must be set and greater than 0 to calculate units"
            )

        units_credit = math.floor(float(commitment.committed_amount) / float(security.issue_price))

        # Create ISSUANCE SecurityTransaction
        # Entity perspective (see support/to-do/3_captable_example.md):
        # - amount_debit = money received by entity (cash IN)
        # - units_credit = units issued to stakeholder
        txn_payload = {
            "entity_id": commitment.entity_id,
            "stakeholder_id": commitment.stakeholder_id,
            "funding_round_id": commitment.funding_round_id,
            "security_id": commitment.security_id,
            "transaction_reference": data.transaction_reference,
            "transaction_type": "issuance",
            "units_debit": 0,
            "units_credit": units_credit,
            "amount_debit": float(commitment.committed_amount),
            "amount_credit": 0,
            "transaction_date": datetime.now(timezone.utc).date(),
        }

        transaction = await create_with_audit(
            db=session,
            model=SecurityTransaction,
            table_name="security_transactions",
            payload=txn_payload,
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        # Link transaction to commitment
        await update_with_audit(
            db=session,
            item=commitment,
            table_name="commitments",
            payload={"transaction_id": transaction.id},
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        # Return enriched CommitmentDetail with resolved names
        detail = await get_commitment_detail(session, commitment.id)
        return CommitmentResponse(success=True, data=detail)

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to generate transaction: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete (Revoke Invitation)
# ==========================================

@router.delete("/{commitment_id}")
async def delete_commitment(
    commitment_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete commitment (revoke invitation) - requires ADMIN permission on entity

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        commitment = await get_record_or_404(
            session, Commitment, commitment_id, "Commitment"
        )

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, commitment.entity_id, session, ['ADMIN', 'OWNER'])

        await soft_delete_with_audit(
            db=session,
            item=commitment,
            table_name="commitments",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": f"Commitment {commitment_id} has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete commitment: {str(e)}")
