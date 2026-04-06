"""
Balance Sheet Subrouter

FastAPI router for BalanceSheet model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.financial_models import BalanceSheet
from ...models.entity_models import Entity
from ...schemas.financial_schemas.balance_sheet_schemas import (
    BalanceSheet as BalanceSheetSchema,
    BalanceSheetCreate, BalanceSheetUpdate,
    BalanceSheetResponse, BalanceSheetsResponse
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

router = APIRouter(tags=["Balance Sheets"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=BalanceSheetsResponse)
async def list_balance_sheets(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List balance sheets for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access via get_user_entity_ids
    3. Returns a paginated list of balance sheets
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return BalanceSheetsResponse(success=True, data=[])

        # Build query with soft-delete filter
        query = (
            select(BalanceSheet)
            .filter(BalanceSheet.entity_id.in_(accessible_entity_ids))
        )
        query = apply_soft_delete_filter(query, BalanceSheet)

        # Apply filters
        if entity_id:
            # Verify entity exists (soft-delete aware) and is accessible
            await get_record_or_404(session, Entity, entity_id, "Entity")
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(BalanceSheet.entity_id == entity_id)

        # Apply pagination
        query = query.order_by(BalanceSheet.id.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        balance_sheets = result.scalars().all()

        return BalanceSheetsResponse(
            success=True,
            data=[BalanceSheetSchema.model_validate(b) for b in balance_sheets]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list balance sheets: {str(e)}")

# ==========================================
# Individual Balance Sheet Operations
# ==========================================

@router.get("/{balance_sheet_id}", response_model=BalanceSheetResponse)
async def get_balance_sheet(
    balance_sheet_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get balance sheet details - requires VIEW permission on entity.

    This endpoint:
    1. Retrieves a balance sheet by ID (excludes soft-deleted)
    2. Returns the balance sheet details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        balance_sheet = await get_record_or_404(session, BalanceSheet, balance_sheet_id, "Balance sheet")

        # Check entity access
        entity_access = await get_entity_access(user.id, balance_sheet.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return BalanceSheetResponse(
            success=True,
            data=BalanceSheetSchema.model_validate(balance_sheet)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get balance sheet: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=BalanceSheetResponse)
async def create_balance_sheet(
    data: BalanceSheetCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create balance sheet - requires EDIT permission on entity.

    This endpoint:
    1. Creates a new balance sheet with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created balance sheet details
    """
    try:
        # Verify entity exists (soft-delete aware)
        await get_record_or_404(session, Entity, data.entity_id, "Entity")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # check_duplicate handles: composite key check + soft-delete filter + 409
        await check_duplicate(
            db=session,
            model=BalanceSheet,
            filters={"entity_id": data.entity_id, "date": data.date, "scenario": data.scenario},
            entity_label="Balance sheet",
        )


        # create_with_audit handles: model(**payload, created_by=user_id) + flush + INSERT audit
        balance_sheet = await create_with_audit(
            db=session,
            model=BalanceSheet,
            table_name="balance_sheets",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(balance_sheet)

        return BalanceSheetResponse(
            success=True,
            data=BalanceSheetSchema.model_validate(balance_sheet)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create balance sheet: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{balance_sheet_id}", response_model=BalanceSheetResponse)
async def update_balance_sheet(
    balance_sheet_id: int,
    data: BalanceSheetUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update balance sheet - requires EDIT permission on entity.

    This endpoint:
    1. Updates a balance sheet with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated balance sheet details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        balance_sheet = await get_record_or_404(session, BalanceSheet, balance_sheet_id, "Balance sheet")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, balance_sheet.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # If updating entity_id, verify it exists (soft-delete aware)
        if data.entity_id is not None and data.entity_id != balance_sheet.entity_id:
            await get_record_or_404(session, Entity, data.entity_id, "New entity")

        # Re-check duplicate if any unique constraint fields are changing
        check_entity_id = data.entity_id if data.entity_id is not None else balance_sheet.entity_id
        check_date = data.date if data.date is not None else balance_sheet.date
        check_scenario = data.scenario if data.scenario is not None else balance_sheet.scenario

        if data.entity_id is not None or data.date is not None or data.scenario is not None:
            await check_duplicate(
                db=session,
                model=BalanceSheet,
                filters={"entity_id": check_entity_id, "date": check_date, "scenario": check_scenario},
                entity_label="Balance sheet",
                exclude_id=balance_sheet_id,
            )


        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        await update_with_audit(
            db=session,
            item=balance_sheet,
            table_name="balance_sheets",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(balance_sheet)

        return BalanceSheetResponse(
            success=True,
            data=BalanceSheetSchema.model_validate(balance_sheet)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update balance sheet: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{balance_sheet_id}")
async def delete_balance_sheet(
    balance_sheet_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete balance sheet - requires ADMIN permission on entity.

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        balance_sheet = await get_record_or_404(session, BalanceSheet, balance_sheet_id, "Balance sheet")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, balance_sheet.entity_id, session, ['ADMIN', 'OWNER'])


        # soft_delete_with_audit handles: old snapshot + deleted_at/deleted_by + DELETE audit
        await soft_delete_with_audit(
            db=session,
            item=balance_sheet,
            table_name="balance_sheets",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "Balance sheet has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete balance sheet: {str(e)}")
