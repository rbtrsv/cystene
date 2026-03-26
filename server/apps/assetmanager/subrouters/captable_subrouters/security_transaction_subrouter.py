"""
SecurityTransaction Subrouter

FastAPI router for SecurityTransaction model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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
from ...utils.dependency_utils import get_entity_access, get_user_organization_id
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

        # Check entity access
        entity_access = await get_entity_access(user.id, data.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to create security transactions for this entity")

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

        org_id = await get_user_organization_id(user.id, session)

        transaction = await create_with_audit(
            db=session,
            model=SecurityTransaction,
            table_name="security_transactions",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=org_id,
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

        # Check entity access
        entity_access = await get_entity_access(user.id, transaction.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this transaction's entity")

        if entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to update security transactions for this entity")

        # Validate foreign key changes
        if data.entity_id is not None and data.entity_id != transaction.entity_id:
            # Verify new entity exists (soft-delete aware)
            await get_record_or_404(session, Entity, data.entity_id, "New entity")

            # Check access to new entity
            new_entity_access = await get_entity_access(user.id, data.entity_id, session)
            if not new_entity_access:
                raise HTTPException(status_code=403, detail="You do not have access to the new entity")

            if new_entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
                raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role for the new entity")

        if data.stakeholder_id is not None and data.stakeholder_id != transaction.stakeholder_id:
            await get_record_or_404(session, Stakeholder, data.stakeholder_id, "New stakeholder")

        if data.funding_round_id is not None and data.funding_round_id != transaction.funding_round_id:
            await get_record_or_404(session, FundingRound, data.funding_round_id, "New funding round")

        if data.security_id is not None and data.security_id != transaction.security_id:
            await get_record_or_404(session, Security, data.security_id, "New security")

        if data.related_transaction_id is not None and data.related_transaction_id != transaction.related_transaction_id:
            if data.related_transaction_id:  # Allow setting to None
                await get_record_or_404(session, SecurityTransaction, data.related_transaction_id, "New related transaction")

        org_id = await get_user_organization_id(user.id, session)

        await update_with_audit(
            db=session,
            item=transaction,
            table_name="security_transactions",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
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

        # Check entity access
        entity_access = await get_entity_access(user.id, transaction.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this transaction's entity")

        if entity_access.role not in ['ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need ADMIN or OWNER role to delete security transactions for this entity")

        org_id = await get_user_organization_id(user.id, session)

        transaction_ref = transaction.transaction_reference

        await soft_delete_with_audit(
            db=session,
            item=transaction,
            table_name="security_transactions",
            user_id=user.id,
            organization_id=org_id,
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
