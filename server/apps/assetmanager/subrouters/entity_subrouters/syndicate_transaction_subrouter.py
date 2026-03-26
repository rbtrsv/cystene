"""
SyndicateTransaction Subrouter

FastAPI router for SyndicateTransaction model CRUD operations.
"""

from decimal import Decimal

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from core.db import get_session
from ...models.entity_models import SyndicateTransaction, SyndicateMember, Syndicate, Entity
from ...schemas.entity_schemas.syndicate_transaction_schemas import (
    SyndicateTransaction as SyndicateTransactionSchema,
    CreateSyndicateTransaction, UpdateSyndicateTransaction,
    SyndicateTransactionResponse, SyndicateTransactionsResponse
)
from ...utils.dependency_utils import get_entity_access, get_user_organization_id
from ...utils.filtering_utils import get_user_entity_ids, apply_soft_delete_filter
from ...utils.audit_utils import log_audit, model_to_dict
from ...utils.crud_utils import get_record_or_404, update_with_audit
from apps.accounts.utils.auth_utils import get_current_user
from apps.accounts.models import User

router = APIRouter(tags=["Syndicate Transactions"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=SyndicateTransactionsResponse)
async def list_syndicate_transactions(
    syndicate_id: Optional[int] = Query(None, description="Filter by syndicate"),
    seller_entity_id: Optional[int] = Query(None, description="Filter by seller entity"),
    buyer_entity_id: Optional[int] = Query(None, description="Filter by buyer entity"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List syndicate transactions for syndicates the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access via syndicate's managing entity
    3. Returns a paginated list of syndicate transactions
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return SyndicateTransactionsResponse(success=True, data=[])

        # Build query - join with Syndicate to filter by accessible managing entities
        # Apply soft-delete filter on both SyndicateTransaction and the joined Syndicate
        query = (
            select(SyndicateTransaction)
            .join(Syndicate, SyndicateTransaction.syndicate_id == Syndicate.id)
            .filter(Syndicate.entity_id.in_(accessible_entity_ids))
            .filter(Syndicate.deleted_at.is_(None))
        )
        query = apply_soft_delete_filter(query, SyndicateTransaction)

        # Apply filters
        if syndicate_id:
            # Verify syndicate exists (soft-delete aware) and entity is accessible
            syndicate = await get_record_or_404(session, Syndicate, syndicate_id, "Syndicate")
            if syndicate.entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this syndicate's entity")
            query = query.filter(SyndicateTransaction.syndicate_id == syndicate_id)

        if seller_entity_id:
            query = query.filter(SyndicateTransaction.seller_entity_id == seller_entity_id)

        if buyer_entity_id:
            query = query.filter(SyndicateTransaction.buyer_entity_id == buyer_entity_id)

        if status:
            query = query.filter(SyndicateTransaction.status == status)

        # Apply pagination
        query = query.order_by(SyndicateTransaction.requested_at.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        transactions = result.scalars().all()

        return SyndicateTransactionsResponse(
            success=True,
            data=[SyndicateTransactionSchema.model_validate(txn) for txn in transactions]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list syndicate transactions: {str(e)}")

# ==========================================
# Individual SyndicateTransaction Operations
# ==========================================

@router.get("/{transaction_id}", response_model=SyndicateTransactionResponse)
async def get_syndicate_transaction(
    transaction_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get syndicate transaction details - requires VIEW permission on syndicate's managing entity

    This endpoint:
    1. Retrieves a syndicate transaction by ID (excludes soft-deleted)
    2. Returns the syndicate transaction details
    """
    try:
        # Get transaction (exclude soft-deleted)
        query = select(SyndicateTransaction).where(SyndicateTransaction.id == transaction_id)
        query = apply_soft_delete_filter(query, SyndicateTransaction)
        result = await session.execute(query)
        transaction = result.scalar_one_or_none()

        if not transaction:
            raise HTTPException(status_code=404, detail="Syndicate transaction not found")

        # Get the syndicate to check entity access (soft-delete aware)
        syndicate = await get_record_or_404(session, Syndicate, transaction.syndicate_id, "Associated syndicate")

        # Check entity access via syndicate's managing entity
        entity_access = await get_entity_access(user.id, syndicate.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this syndicate's entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return SyndicateTransactionResponse(
            success=True,
            data=SyndicateTransactionSchema.model_validate(transaction)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get syndicate transaction: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=SyndicateTransactionResponse)
async def create_syndicate_transaction(
    data: CreateSyndicateTransaction,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create syndicate transaction - requires EDIT permission on syndicate's managing entity.

    This endpoint:
    1. Creates a new syndicate transaction with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created syndicate transaction details
    """
    try:
        # Verify syndicate exists (soft-delete aware)
        syndicate = await get_record_or_404(session, Syndicate, data.syndicate_id, "Syndicate")

        # Verify seller entity exists (soft-delete aware)
        await get_record_or_404(session, Entity, data.seller_entity_id, "Seller entity")

        # Verify buyer entity exists (soft-delete aware)
        await get_record_or_404(session, Entity, data.buyer_entity_id, "Buyer entity")

        # Check entity access via syndicate's managing entity
        entity_access = await get_entity_access(user.id, syndicate.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this syndicate's entity")

        if entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to create syndicate transactions for this entity")

        org_id = await get_user_organization_id(user.id, session)

        # Create syndicate transaction — set created_by for audit trail
        transaction = SyndicateTransaction(
            syndicate_id=data.syndicate_id,
            transaction_type=data.transaction_type,
            seller_entity_id=data.seller_entity_id,
            buyer_entity_id=data.buyer_entity_id,
            ownership_percentage=data.ownership_percentage,
            amount=data.amount,
            status=data.status,
            notes=data.notes,
            created_by=user.id
        )

        session.add(transaction)
        await session.flush()

        # Log audit
        await log_audit(
            session=session,
            table_name="syndicate_transactions",
            record_id=transaction.id,
            action="INSERT",
            new_data=data.model_dump(),
            user_id=user.id,
            organization_id=org_id
        )

        await session.commit()
        await session.refresh(transaction)

        return SyndicateTransactionResponse(
            success=True,
            data=SyndicateTransactionSchema.model_validate(transaction)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create syndicate transaction: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{transaction_id}", response_model=SyndicateTransactionResponse)
async def update_syndicate_transaction(
    transaction_id: int,
    data: UpdateSyndicateTransaction,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update syndicate transaction with approval flow enforcement.

    This endpoint:
    1. Determines user's role: manager, buyer, or seller
    2. Enforces status transitions based on role:
       - pending_buyer → pending_manager: only buyer can accept
       - pending_manager → completed: only manager (syndicate owner) — final say
       - → rejected: buyer at pending_buyer step, manager at pending_manager step
    3. Non-status field edits (ownership_percentage, amount, notes): only manager
    4. On transition to 'completed': auto-updates SyndicateMember ownership percentages
    5. Returns the updated syndicate transaction details

    Completion logic:
    - Seller's ownership_percentage is decreased by transaction amount
    - Buyer's ownership_percentage is increased (or buyer member created)
    - Row locking (SELECT FOR UPDATE) prevents race conditions
    - Decimal arithmetic (not float) for percentage math
    - Idempotency guard blocks updates to already-completed transactions
    - All member changes are audit-logged
    """
    try:
        # Get transaction (exclude soft-deleted) — lock row to prevent concurrent completion races
        query = (
            select(SyndicateTransaction)
            .where(SyndicateTransaction.id == transaction_id)
            .with_for_update()
        )
        query = apply_soft_delete_filter(query, SyndicateTransaction)
        result = await session.execute(query)
        transaction = result.scalar_one_or_none()

        if not transaction:
            raise HTTPException(status_code=404, detail="Syndicate transaction not found")

        # Idempotency guard — block any updates to already-completed or rejected transactions
        if transaction.status == "completed":
            raise HTTPException(status_code=400, detail="Cannot modify a completed transaction")
        if transaction.status == "rejected":
            raise HTTPException(status_code=400, detail="Cannot modify a rejected transaction")

        # Get syndicate (soft-delete aware)
        syndicate = await get_record_or_404(session, Syndicate, transaction.syndicate_id, "Associated syndicate")

        # ==========================================
        # Determine user's role in this transaction
        # ==========================================
        # Manager = has EDITOR+ access to syndicate's managing entity
        manager_access = await get_entity_access(user.id, syndicate.entity_id, session)
        is_manager = manager_access is not None and manager_access.role in ['EDITOR', 'ADMIN', 'OWNER']

        # Buyer = has EDITOR+ access to buyer entity
        buyer_access = await get_entity_access(user.id, transaction.buyer_entity_id, session)
        is_buyer = buyer_access is not None and buyer_access.role in ['EDITOR', 'ADMIN', 'OWNER']

        # Seller = has EDITOR+ access to seller entity
        seller_access = await get_entity_access(user.id, transaction.seller_entity_id, session)
        is_seller = seller_access is not None and seller_access.role in ['EDITOR', 'ADMIN', 'OWNER']

        # Must be at least one party to update
        if not (is_manager or is_buyer or is_seller):
            raise HTTPException(status_code=403, detail="You do not have permission to update this transaction")

        # ==========================================
        # Enforce status transition rules
        # ==========================================
        update_payload = data.model_dump(exclude_unset=True)
        new_status = update_payload.get("status")

        if new_status and new_status != transaction.status:
            if transaction.status == "pending_buyer":
                if new_status == "pending_manager":
                    # Only buyer can accept
                    if not is_buyer:
                        raise HTTPException(status_code=403, detail="Only the buyer can accept this transaction")
                elif new_status == "rejected":
                    # Buyer or seller can reject at this step
                    if not (is_buyer or is_seller):
                        raise HTTPException(status_code=403, detail="Only the buyer or seller can reject at this step")
                else:
                    raise HTTPException(status_code=400, detail=f"Invalid transition from pending_buyer to {new_status}")

            elif transaction.status == "pending_manager":
                if new_status == "completed":
                    # Only manager can complete — final say
                    if not is_manager:
                        raise HTTPException(status_code=403, detail="Only the syndicate manager can complete this transaction")
                elif new_status == "rejected":
                    # Only manager can reject at this step
                    if not is_manager:
                        raise HTTPException(status_code=403, detail="Only the syndicate manager can reject at this step")
                else:
                    raise HTTPException(status_code=400, detail=f"Invalid transition from pending_manager to {new_status}")

        # Non-status field edits (ownership_percentage, amount, notes, etc.) — only manager
        non_status_fields = {k: v for k, v in update_payload.items() if k != "status"}
        if non_status_fields and not is_manager:
            raise HTTPException(status_code=403, detail="Only the syndicate manager can edit transaction details")

        # If updating seller or buyer entity, verify they exist (soft-delete aware)
        if data.seller_entity_id is not None:
            await get_record_or_404(session, Entity, data.seller_entity_id, "Seller entity")

        if data.buyer_entity_id is not None:
            await get_record_or_404(session, Entity, data.buyer_entity_id, "Buyer entity")

        org_id = await get_user_organization_id(user.id, session)

        # Capture old status before applying update (Option A — detect transition after helper)
        old_status = transaction.status

        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        await update_with_audit(
            db=session,
            item=transaction,
            table_name="syndicate_transactions",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        # ==========================================
        # Completion Logic — Transfer Ownership
        # ==========================================
        # Only runs when status transitions TO 'completed' (not from 'completed')
        if old_status != "completed" and transaction.status == "completed":

            # --- Seller Member: lock + validate + decrease percentage ---
            seller_member = await session.scalar(
                select(SyndicateMember)
                .where(
                    SyndicateMember.syndicate_id == transaction.syndicate_id,
                    SyndicateMember.member_entity_id == transaction.seller_entity_id,
                    SyndicateMember.deleted_at.is_(None),
                )
                .with_for_update()
            )

            if not seller_member:
                raise HTTPException(
                    status_code=404,
                    detail="Seller is not a member of this syndicate"
                )

            # Decimal math — never use float for percentage arithmetic
            seller_pct = Decimal(str(seller_member.ownership_percentage))
            transfer_pct = Decimal(str(transaction.ownership_percentage))

            if seller_pct < transfer_pct:
                raise HTTPException(
                    status_code=400,
                    detail=f"Seller only has {seller_pct}% but transaction requires {transfer_pct}%"
                )

            # Snapshot seller before change
            seller_old = model_to_dict(seller_member)

            # Decrease seller's ownership percentage
            seller_member.ownership_percentage = (seller_pct - transfer_pct).quantize(Decimal("0.01"))
            seller_member.updated_by = user.id

            # Audit seller member change
            await log_audit(
                session=session,
                table_name="syndicate_members",
                record_id=seller_member.id,
                action="UPDATE",
                old_data=seller_old,
                new_data=model_to_dict(seller_member),
                user_id=user.id,
                organization_id=org_id,
            )

            # --- Buyer Member: lock + increase or create ---
            buyer_member = await session.scalar(
                select(SyndicateMember)
                .where(
                    SyndicateMember.syndicate_id == transaction.syndicate_id,
                    SyndicateMember.member_entity_id == transaction.buyer_entity_id,
                    SyndicateMember.deleted_at.is_(None),
                )
                .with_for_update()
            )

            if buyer_member:
                # Existing buyer member — increase percentage
                buyer_old = model_to_dict(buyer_member)

                buyer_pct = Decimal(str(buyer_member.ownership_percentage))
                buyer_member.ownership_percentage = (buyer_pct + transfer_pct).quantize(Decimal("0.01"))
                buyer_member.updated_by = user.id

                # Audit buyer member update
                await log_audit(
                    session=session,
                    table_name="syndicate_members",
                    record_id=buyer_member.id,
                    action="UPDATE",
                    old_data=buyer_old,
                    new_data=model_to_dict(buyer_member),
                    user_id=user.id,
                    organization_id=org_id,
                )
            else:
                # New buyer member — create with transferred percentage
                buyer_member = SyndicateMember(
                    syndicate_id=transaction.syndicate_id,
                    member_entity_id=transaction.buyer_entity_id,
                    ownership_percentage=transaction.ownership_percentage,
                    created_by=user.id,
                )
                session.add(buyer_member)
                await session.flush()

                # Audit buyer member creation
                await log_audit(
                    session=session,
                    table_name="syndicate_members",
                    record_id=buyer_member.id,
                    action="INSERT",
                    new_data=model_to_dict(buyer_member),
                    user_id=user.id,
                    organization_id=org_id,
                )

            # Mark transaction as completed with timestamp
            transaction.completed_at = func.now()

        await session.commit()
        await session.refresh(transaction)

        return SyndicateTransactionResponse(
            success=True,
            data=SyndicateTransactionSchema.model_validate(transaction)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update syndicate transaction: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{transaction_id}")
async def delete_syndicate_transaction(
    transaction_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete syndicate transaction - requires ADMIN permission on syndicate's managing entity

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        # Get transaction (exclude already soft-deleted)
        query = select(SyndicateTransaction).where(SyndicateTransaction.id == transaction_id)
        query = apply_soft_delete_filter(query, SyndicateTransaction)
        result = await session.execute(query)
        transaction = result.scalar_one_or_none()

        if not transaction:
            raise HTTPException(status_code=404, detail="Syndicate transaction not found")

        # Get syndicate to check entity access (soft-delete aware)
        syndicate = await get_record_or_404(session, Syndicate, transaction.syndicate_id, "Associated syndicate")

        # Check entity access via syndicate's managing entity
        entity_access = await get_entity_access(user.id, syndicate.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this syndicate's entity")

        if entity_access.role not in ['ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need ADMIN or OWNER role to delete syndicate transactions for this entity")

        org_id = await get_user_organization_id(user.id, session)

        # Snapshot old data before soft delete
        old_data = model_to_dict(transaction)

        # Soft delete — set deleted_at and deleted_by, don't hard delete
        transaction.deleted_at = func.now()
        transaction.deleted_by = user.id

        # Log audit
        await log_audit(
            session=session,
            table_name="syndicate_transactions",
            record_id=transaction_id,
            action="DELETE",
            old_data=old_data,
            user_id=user.id,
            organization_id=org_id
        )

        await session.commit()

        return {
            "success": True,
            "message": "Syndicate transaction has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete syndicate transaction: {str(e)}")
