from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Transaction
from ...schemas.commercial.transaction_schemas import (
    TransactionCreate,
    TransactionDetail,
    TransactionListResponse,
    TransactionResponse,
    TransactionUpdate,
    MessageResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.filtering_utils import apply_default_filters
from ...utils.crud_utils import (
    create_with_audit,
    get_owned_record_or_404,
    soft_delete_with_audit,
    update_with_audit,
)

# ==========================================
# Transactions Router
# ==========================================

router = APIRouter(tags=["Transactions"])


@router.get("/", response_model=TransactionListResponse)
async def list_transactions(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List transactions with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of transactions
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total transactions (with filters applied)
        count_query = select(func.count(Transaction.id))
        count_query = apply_default_filters(count_query, Transaction, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get transactions with pagination (with filters applied)
        data_query = select(Transaction).order_by(Transaction.announced_date).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Transaction, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return TransactionListResponse(
            success=True,
            data=[TransactionDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific transaction

    This endpoint:
    1. Retrieves a transaction by ID (excludes soft-deleted, enforces ownership)
    2. Returns the transaction details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Transaction,
            item_id=transaction_id,
            user_org_id=org_id,
            entity_label="Transaction",
        )
        return TransactionResponse(
            success=True,
            data=TransactionDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=TransactionResponse)
async def create_transaction(
    payload: TransactionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new transaction

    This endpoint:
    1. Creates a new transaction with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created transaction details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=Transaction,
            table_name="transactions",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return TransactionResponse(
            success=True,
            data=TransactionDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    payload: TransactionUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a transaction

    This endpoint:
    1. Updates a transaction with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated transaction details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Transaction,
            item_id=transaction_id,
            user_org_id=org_id,
            entity_label="Transaction",
        )

        update_data = payload.model_dump(exclude_unset=True)

        await update_with_audit(
            db=db,
            item=item,
            table_name="transactions",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return TransactionResponse(
            success=True,
            data=TransactionDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{transaction_id}", response_model=MessageResponse)
async def delete_transaction(
    transaction_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a transaction

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Transaction,
            item_id=transaction_id,
            user_org_id=org_id,
            entity_label="Transaction",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="transactions",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Transaction {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
