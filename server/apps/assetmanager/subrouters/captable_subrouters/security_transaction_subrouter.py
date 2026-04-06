"""
SecurityTransaction Subrouter

FastAPI router for SecurityTransaction model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional
from datetime import date

from core.db import get_session
from ...models.captable_models import SecurityTransaction, FundingRound, Security
from ...models.entity_models import Entity, Stakeholder
from ...schemas.captable_schemas.security_transaction_schemas import (
    SecurityTransaction as SecurityTransactionSchema,
    SecurityTransactionCreate, SecurityTransactionUpdate,
    SecurityTransactionResponse, SecurityTransactionsResponse,
    TransactionType
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

router = APIRouter(tags=["Security Transactions"])


# ==========================================
# Transaction Reference Generator
# ==========================================

# Prefix map: transaction_type → short prefix for reference
TRANSACTION_TYPE_PREFIXES = {
    "issuance": "ISS",
    "transfer": "TRF",
    "conversion": "CNV",
    "redemption": "RDM",
    "exercise": "EXR",
    "cancellation": "CNC",
    "split": "SPL",
    "merger": "MRG",
}


@router.get("/next-reference")
async def get_next_transaction_reference(
    transaction_type: Optional[str] = Query(None, description="Transaction type for prefix (e.g. 'issuance' → ISS)"),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Generate the next sequential transaction reference (global, not entity-scoped).

    Format: {PREFIX}-{YYYYMMDD}-{NNN}
    Examples: ISS-20260330-001, TXN-20260330-002

    Logic:
    1. Query last transaction_reference matching today's date pattern
    2. Increment the sequence number
    3. Fallback to random if query fails
    """
    try:
        # Prefix based on transaction type
        prefix = TRANSACTION_TYPE_PREFIXES.get(transaction_type, "TXN") if transaction_type else "TXN"

        today_str = date.today().strftime("%Y%m%d")
        pattern = f"%-{today_str}-%"

        # Find the last reference created today (across all entities)
        query = (
            select(SecurityTransaction.transaction_reference)
            .filter(SecurityTransaction.transaction_reference.like(pattern))
            .order_by(desc(SecurityTransaction.transaction_reference))
            .limit(1)
        )
        result = await session.execute(query)
        last_ref = result.scalar()

        next_number = 1
        if last_ref:
            # Extract the number from the last reference (e.g., "ISS-20260330-003" → 3)
            parts = last_ref.rsplit("-", 1)
            if len(parts) == 2 and parts[1].isdigit():
                next_number = int(parts[1]) + 1

        padded = str(next_number).zfill(3)
        reference = f"{prefix}-{today_str}-{padded}"

        return {"success": True, "data": reference}

    except Exception as e:
        # Fallback to random
        import random
        today_str = date.today().strftime("%Y%m%d")
        prefix = TRANSACTION_TYPE_PREFIXES.get(transaction_type, "TXN") if transaction_type else "TXN"
        padded = str(random.randint(1, 999)).zfill(3)
        reference = f"{prefix}-{today_str}-{padded}"
        return {"success": True, "data": reference}


# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=SecurityTransactionsResponse)
async def list_security_transactions(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    stakeholder_id: Optional[int] = Query(None, description="Filter by stakeholder"),
    funding_round_id: Optional[int] = Query(None, description="Filter by funding round"),
    security_id: Optional[int] = Query(None, description="Filter by security"),
    transaction_type: Optional[TransactionType] = Query(None, description="Filter by transaction type"),
    transaction_reference: Optional[str] = Query(None, description="Filter by transaction reference"),
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List security transactions for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access (user's org → EntityOrganizationMember)
    3. Returns a paginated list of security transactions
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return SecurityTransactionsResponse(success=True, data=[])

        # Build query - filter by accessible entities directly
        query = select(SecurityTransaction).filter(
            SecurityTransaction.entity_id.in_(accessible_entity_ids)
        )
        query = apply_soft_delete_filter(query, SecurityTransaction)

        # Apply filters
        if entity_id:
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(SecurityTransaction.entity_id == entity_id)

        if stakeholder_id:
            query = query.filter(SecurityTransaction.stakeholder_id == stakeholder_id)

        if funding_round_id:
            query = query.filter(SecurityTransaction.funding_round_id == funding_round_id)

        if security_id:
            query = query.filter(SecurityTransaction.security_id == security_id)

        if transaction_type:
            query = query.filter(SecurityTransaction.transaction_type == transaction_type.value)

        if transaction_reference:
            query = query.filter(SecurityTransaction.transaction_reference == transaction_reference)

        if start_date:
            query = query.filter(SecurityTransaction.transaction_date >= start_date)

        if end_date:
            query = query.filter(SecurityTransaction.transaction_date <= end_date)

        # Apply pagination
        query = query.order_by(SecurityTransaction.transaction_date.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        transactions = result.scalars().all()

        return SecurityTransactionsResponse(
            success=True,
            data=[SecurityTransactionSchema.model_validate(transaction) for transaction in transactions]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list security transactions: {str(e)}")

# ==========================================
# Individual SecurityTransaction Operations
# ==========================================

@router.get("/{transaction_id}", response_model=SecurityTransactionResponse)
async def get_security_transaction(
    transaction_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get security transaction details - requires VIEW permission on entity

    This endpoint:
    1. Retrieves a security transaction by ID (excludes soft-deleted)
    2. Returns the security transaction details
    """
    try:
        transaction = await get_record_or_404(
            session, SecurityTransaction, transaction_id, "Security transaction"
        )

        # Check entity access
        entity_access = await get_entity_access(user.id, transaction.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this transaction's entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return SecurityTransactionResponse(
            success=True,
            data=SecurityTransactionSchema.model_validate(transaction)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get security transaction: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=SecurityTransactionResponse)
async def create_security_transaction(
    data: SecurityTransactionCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create security transaction - requires EDIT permission on entity.

    This endpoint:
    1. Creates a new security transaction with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created security transaction details
    """
    try:
        # Verify entity exists (soft-delete aware)
        await get_record_or_404(session, Entity, data.entity_id, "Entity")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # Verify stakeholder exists (soft-delete aware)
        await get_record_or_404(session, Stakeholder, data.stakeholder_id, "Stakeholder")

        # Verify funding round exists (soft-delete aware)
        await get_record_or_404(session, FundingRound, data.funding_round_id, "Funding round")

        # Verify security exists if provided (soft-delete aware)
        if data.security_id is not None:
            await get_record_or_404(session, Security, data.security_id, "Security")

        # Verify related transaction exists if provided (soft-delete aware)
        if data.related_transaction_id:
            await get_record_or_404(session, SecurityTransaction, data.related_transaction_id, "Related transaction")

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

        transaction = await create_with_audit(
            db=session,
            model=SecurityTransaction,
            table_name="security_transactions",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(transaction)

        return SecurityTransactionResponse(
            success=True,
            data=SecurityTransactionSchema.model_validate(transaction)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create security transaction: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{transaction_id}", response_model=SecurityTransactionResponse)
async def update_security_transaction(
    transaction_id: int,
    data: SecurityTransactionUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update security transaction - requires EDIT permission on entity

    This endpoint:
    1. Updates a security transaction with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated security transaction details
    """
    try:
        transaction = await get_record_or_404(
            session, SecurityTransaction, transaction_id, "Security transaction"
        )

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, transaction.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # Validate foreign key changes
        if data.entity_id is not None and data.entity_id != transaction.entity_id:
            # Verify new entity exists (soft-delete aware)
            await get_record_or_404(session, Entity, data.entity_id, "New entity")

            # Check access + role + subscription on new entity
            await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        if data.stakeholder_id is not None and data.stakeholder_id != transaction.stakeholder_id:
            await get_record_or_404(session, Stakeholder, data.stakeholder_id, "New stakeholder")

        if data.funding_round_id is not None and data.funding_round_id != transaction.funding_round_id:
            await get_record_or_404(session, FundingRound, data.funding_round_id, "New funding round")

        if data.security_id is not None and data.security_id != transaction.security_id:
            await get_record_or_404(session, Security, data.security_id, "New security")

        if data.related_transaction_id is not None and data.related_transaction_id != transaction.related_transaction_id:
            if data.related_transaction_id:  # Allow setting to None
                await get_record_or_404(session, SecurityTransaction, data.related_transaction_id, "New related transaction")

        await update_with_audit(
            db=session,
            item=transaction,
            table_name="security_transactions",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(transaction)

        return SecurityTransactionResponse(
            success=True,
            data=SecurityTransactionSchema.model_validate(transaction)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update security transaction: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{transaction_id}")
async def delete_security_transaction(
    transaction_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete security transaction - requires ADMIN permission on entity

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        transaction = await get_record_or_404(
            session, SecurityTransaction, transaction_id, "Security transaction"
        )

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, transaction.entity_id, session, ['ADMIN', 'OWNER'])

        transaction_ref = transaction.transaction_reference

        await soft_delete_with_audit(
            db=session,
            item=transaction,
            table_name="security_transactions",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": f"Security transaction '{transaction_ref}' has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete security transaction: {str(e)}")
