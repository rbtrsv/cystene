"""
Cash Flow Statement Subrouter

FastAPI router for CashFlowStatement model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.financial_models import CashFlowStatement
from ...models.entity_models import Entity
from ...schemas.financial_schemas.cash_flow_statement_schemas import (
    CashFlowStatement as CashFlowStatementSchema,
    CashFlowStatementCreate, CashFlowStatementUpdate,
    CashFlowStatementResponse, CashFlowStatementsResponse
)
from ...utils.dependency_utils import get_entity_access, get_user_organization_id
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

router = APIRouter(tags=["Cash Flow Statements"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=CashFlowStatementsResponse)
async def list_cash_flow_statements(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List cash flow statements for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access via get_user_entity_ids
    3. Returns a paginated list of cash flow statements
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return CashFlowStatementsResponse(success=True, data=[])

        # Build query with soft-delete filter
        query = (
            select(CashFlowStatement)
            .filter(CashFlowStatement.entity_id.in_(accessible_entity_ids))
        )
        query = apply_soft_delete_filter(query, CashFlowStatement)

        # Apply filters
        if entity_id:
            # Verify entity exists (soft-delete aware) and is accessible
            await get_record_or_404(session, Entity, entity_id, "Entity")
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(CashFlowStatement.entity_id == entity_id)

        # Apply pagination
        query = query.order_by(CashFlowStatement.id.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        cash_flow_statements = result.scalars().all()

        return CashFlowStatementsResponse(
            success=True,
            data=[CashFlowStatementSchema.model_validate(c) for c in cash_flow_statements]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list cash flow statements: {str(e)}")

# ==========================================
# Individual Cash Flow Statement Operations
# ==========================================

@router.get("/{cash_flow_statement_id}", response_model=CashFlowStatementResponse)
async def get_cash_flow_statement(
    cash_flow_statement_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get cash flow statement details - requires VIEW permission on entity.

    This endpoint:
    1. Retrieves a cash flow statement by ID (excludes soft-deleted)
    2. Returns the cash flow statement details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        cash_flow_statement = await get_record_or_404(session, CashFlowStatement, cash_flow_statement_id, "Cash flow statement")

        # Check entity access
        entity_access = await get_entity_access(user.id, cash_flow_statement.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return CashFlowStatementResponse(
            success=True,
            data=CashFlowStatementSchema.model_validate(cash_flow_statement)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cash flow statement: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=CashFlowStatementResponse)
async def create_cash_flow_statement(
    data: CashFlowStatementCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create cash flow statement - requires EDIT permission on entity.

    This endpoint:
    1. Creates a new cash flow statement with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created cash flow statement details
    """
    try:
        # Verify entity exists (soft-delete aware)
        await get_record_or_404(session, Entity, data.entity_id, "Entity")

        # Check entity access
        entity_access = await get_entity_access(user.id, data.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to create cash flow statements for this entity")

        # check_duplicate handles: composite key check + soft-delete filter + 409
        await check_duplicate(
            db=session,
            model=CashFlowStatement,
            filters={"entity_id": data.entity_id, "period_start": data.period_start, "period_end": data.period_end, "scenario": data.scenario},
            entity_label="Cash flow statement",
        )

        org_id = await get_user_organization_id(user.id, session)

        # create_with_audit handles: model(**payload, created_by=user_id) + flush + INSERT audit
        cash_flow_statement = await create_with_audit(
            db=session,
            model=CashFlowStatement,
            table_name="cash_flow_statements",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(cash_flow_statement)

        return CashFlowStatementResponse(
            success=True,
            data=CashFlowStatementSchema.model_validate(cash_flow_statement)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create cash flow statement: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{cash_flow_statement_id}", response_model=CashFlowStatementResponse)
async def update_cash_flow_statement(
    cash_flow_statement_id: int,
    data: CashFlowStatementUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update cash flow statement - requires EDIT permission on entity.

    This endpoint:
    1. Updates a cash flow statement with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated cash flow statement details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        cash_flow_statement = await get_record_or_404(session, CashFlowStatement, cash_flow_statement_id, "Cash flow statement")

        # Check entity access
        entity_access = await get_entity_access(user.id, cash_flow_statement.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to update cash flow statements for this entity")

        # If updating entity_id, verify it exists (soft-delete aware)
        if data.entity_id is not None and data.entity_id != cash_flow_statement.entity_id:
            await get_record_or_404(session, Entity, data.entity_id, "New entity")

        # Re-check duplicate if any unique constraint fields are changing
        check_entity_id = data.entity_id if data.entity_id is not None else cash_flow_statement.entity_id
        check_period_start = data.period_start if data.period_start is not None else cash_flow_statement.period_start
        check_period_end = data.period_end if data.period_end is not None else cash_flow_statement.period_end
        check_scenario = data.scenario if data.scenario is not None else cash_flow_statement.scenario

        if data.entity_id is not None or data.period_start is not None or data.period_end is not None or data.scenario is not None:
            await check_duplicate(
                db=session,
                model=CashFlowStatement,
                filters={"entity_id": check_entity_id, "period_start": check_period_start, "period_end": check_period_end, "scenario": check_scenario},
                entity_label="Cash flow statement",
                exclude_id=cash_flow_statement_id,
            )

        org_id = await get_user_organization_id(user.id, session)

        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        await update_with_audit(
            db=session,
            item=cash_flow_statement,
            table_name="cash_flow_statements",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(cash_flow_statement)

        return CashFlowStatementResponse(
            success=True,
            data=CashFlowStatementSchema.model_validate(cash_flow_statement)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update cash flow statement: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{cash_flow_statement_id}")
async def delete_cash_flow_statement(
    cash_flow_statement_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete cash flow statement - requires ADMIN permission on entity.

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        cash_flow_statement = await get_record_or_404(session, CashFlowStatement, cash_flow_statement_id, "Cash flow statement")

        # Check entity access
        entity_access = await get_entity_access(user.id, cash_flow_statement.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need ADMIN or OWNER role to delete cash flow statements for this entity")

        org_id = await get_user_organization_id(user.id, session)

        # soft_delete_with_audit handles: old snapshot + deleted_at/deleted_by + DELETE audit
        await soft_delete_with_audit(
            db=session,
            item=cash_flow_statement,
            table_name="cash_flow_statements",
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "Cash flow statement has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete cash flow statement: {str(e)}")
