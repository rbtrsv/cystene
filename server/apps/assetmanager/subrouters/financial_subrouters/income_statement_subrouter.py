"""
Income Statement Subrouter

FastAPI router for IncomeStatement model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.financial_models import IncomeStatement
from ...models.entity_models import Entity
from ...schemas.financial_schemas.income_statement_schemas import (
    IncomeStatement as IncomeStatementSchema,
    IncomeStatementCreate, IncomeStatementUpdate,
    IncomeStatementResponse, IncomeStatementsResponse
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

router = APIRouter(tags=["Income Statements"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=IncomeStatementsResponse)
async def list_income_statements(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List income statements for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access via get_user_entity_ids
    3. Returns a paginated list of income statements
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return IncomeStatementsResponse(success=True, data=[])

        # Build query with soft-delete filter
        query = (
            select(IncomeStatement)
            .filter(IncomeStatement.entity_id.in_(accessible_entity_ids))
        )
        query = apply_soft_delete_filter(query, IncomeStatement)

        # Apply filters
        if entity_id:
            # Verify entity exists (soft-delete aware) and is accessible
            await get_record_or_404(session, Entity, entity_id, "Entity")
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(IncomeStatement.entity_id == entity_id)

        # Apply pagination
        query = query.order_by(IncomeStatement.id.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        income_statements = result.scalars().all()

        return IncomeStatementsResponse(
            success=True,
            data=[IncomeStatementSchema.model_validate(i) for i in income_statements]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list income statements: {str(e)}")

# ==========================================
# Individual Income Statement Operations
# ==========================================

@router.get("/{income_statement_id}", response_model=IncomeStatementResponse)
async def get_income_statement(
    income_statement_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get income statement details - requires VIEW permission on entity.

    This endpoint:
    1. Retrieves an income statement by ID (excludes soft-deleted)
    2. Returns the income statement details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        income_statement = await get_record_or_404(session, IncomeStatement, income_statement_id, "Income statement")

        # Check entity access
        entity_access = await get_entity_access(user.id, income_statement.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return IncomeStatementResponse(
            success=True,
            data=IncomeStatementSchema.model_validate(income_statement)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get income statement: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=IncomeStatementResponse)
async def create_income_statement(
    data: IncomeStatementCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create income statement - requires EDIT permission on entity.

    This endpoint:
    1. Creates a new income statement with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created income statement details
    """
    try:
        # Verify entity exists (soft-delete aware)
        await get_record_or_404(session, Entity, data.entity_id, "Entity")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # check_duplicate handles: composite key check + soft-delete filter + 409
        await check_duplicate(
            db=session,
            model=IncomeStatement,
            filters={"entity_id": data.entity_id, "period_start": data.period_start, "period_end": data.period_end, "scenario": data.scenario},
            entity_label="Income statement",
        )


        # create_with_audit handles: model(**payload, created_by=user_id) + flush + INSERT audit
        income_statement = await create_with_audit(
            db=session,
            model=IncomeStatement,
            table_name="income_statements",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(income_statement)

        return IncomeStatementResponse(
            success=True,
            data=IncomeStatementSchema.model_validate(income_statement)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create income statement: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{income_statement_id}", response_model=IncomeStatementResponse)
async def update_income_statement(
    income_statement_id: int,
    data: IncomeStatementUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update income statement - requires EDIT permission on entity.

    This endpoint:
    1. Updates an income statement with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated income statement details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        income_statement = await get_record_or_404(session, IncomeStatement, income_statement_id, "Income statement")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, income_statement.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # If updating entity_id, verify it exists (soft-delete aware)
        if data.entity_id is not None and data.entity_id != income_statement.entity_id:
            await get_record_or_404(session, Entity, data.entity_id, "New entity")

        # Re-check duplicate if any unique constraint fields are changing
        check_entity_id = data.entity_id if data.entity_id is not None else income_statement.entity_id
        check_period_start = data.period_start if data.period_start is not None else income_statement.period_start
        check_period_end = data.period_end if data.period_end is not None else income_statement.period_end
        check_scenario = data.scenario if data.scenario is not None else income_statement.scenario

        if data.entity_id is not None or data.period_start is not None or data.period_end is not None or data.scenario is not None:
            await check_duplicate(
                db=session,
                model=IncomeStatement,
                filters={"entity_id": check_entity_id, "period_start": check_period_start, "period_end": check_period_end, "scenario": check_scenario},
                entity_label="Income statement",
                exclude_id=income_statement_id,
            )


        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        await update_with_audit(
            db=session,
            item=income_statement,
            table_name="income_statements",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(income_statement)

        return IncomeStatementResponse(
            success=True,
            data=IncomeStatementSchema.model_validate(income_statement)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update income statement: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{income_statement_id}")
async def delete_income_statement(
    income_statement_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete income statement - requires ADMIN permission on entity.

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        income_statement = await get_record_or_404(session, IncomeStatement, income_statement_id, "Income statement")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, income_statement.entity_id, session, ['ADMIN', 'OWNER'])


        # soft_delete_with_audit handles: old snapshot + deleted_at/deleted_by + DELETE audit
        await soft_delete_with_audit(
            db=session,
            item=income_statement,
            table_name="income_statements",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "Income statement has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete income statement: {str(e)}")
