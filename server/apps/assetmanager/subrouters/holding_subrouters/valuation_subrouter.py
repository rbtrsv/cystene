"""
Valuation Subrouter

FastAPI router for Valuation model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.holding_models import Valuation
from ...models.entity_models import Entity
from ...models.captable_models import FundingRound
from ...schemas.holding_schemas.valuation_schemas import (
    Valuation as ValuationSchema,
    ValuationCreate, ValuationUpdate,
    ValuationResponse, ValuationsResponse
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

router = APIRouter(tags=["Valuations"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=ValuationsResponse)
async def list_valuations(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List valuations for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access via get_user_entity_ids
    3. Returns a paginated list of valuations
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return ValuationsResponse(success=True, data=[])

        # Build query with soft-delete filter
        query = (
            select(Valuation)
            .filter(Valuation.entity_id.in_(accessible_entity_ids))
        )
        query = apply_soft_delete_filter(query, Valuation)

        # Apply filters
        if entity_id:
            # Verify entity exists (soft-delete aware) and is accessible
            await get_record_or_404(session, Entity, entity_id, "Entity")
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(Valuation.entity_id == entity_id)

        # Apply pagination
        query = query.order_by(Valuation.date.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        valuations = result.scalars().all()

        return ValuationsResponse(
            success=True,
            data=[ValuationSchema.model_validate(v) for v in valuations]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list valuations: {str(e)}")

# ==========================================
# Individual Valuation Operations
# ==========================================

@router.get("/{valuation_id}", response_model=ValuationResponse)
async def get_valuation(
    valuation_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get valuation details - requires VIEW permission on entity.

    This endpoint:
    1. Retrieves a valuation by ID (excludes soft-deleted)
    2. Returns the valuation details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        valuation = await get_record_or_404(session, Valuation, valuation_id, "Valuation")

        # Check entity access
        entity_access = await get_entity_access(user.id, valuation.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return ValuationResponse(
            success=True,
            data=ValuationSchema.model_validate(valuation)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get valuation: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=ValuationResponse)
async def create_valuation(
    data: ValuationCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create valuation - requires EDIT permission on entity.

    This endpoint:
    1. Creates a new valuation with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created valuation details
    """
    try:
        # Verify entity exists (soft-delete aware)
        await get_record_or_404(session, Entity, data.entity_id, "Entity")

        # Check entity access
        entity_access = await get_entity_access(user.id, data.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to create valuations for this entity")

        # Verify funding_round FK if provided (soft-delete aware)
        if data.funding_round_id is not None:
            await get_record_or_404(session, FundingRound, data.funding_round_id, "Funding round")

        # check_duplicate handles: composite key check + soft-delete filter + 409
        await check_duplicate(
            db=session,
            model=Valuation,
            filters={"entity_id": data.entity_id, "funding_round_id": data.funding_round_id, "date": data.date},
            entity_label="Valuation",
        )

        org_id = await get_user_organization_id(user.id, session)

        # create_with_audit handles: model(**payload, created_by=user_id) + flush + INSERT audit
        valuation = await create_with_audit(
            db=session,
            model=Valuation,
            table_name="valuations",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(valuation)

        return ValuationResponse(
            success=True,
            data=ValuationSchema.model_validate(valuation)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create valuation: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{valuation_id}", response_model=ValuationResponse)
async def update_valuation(
    valuation_id: int,
    data: ValuationUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update valuation - requires EDIT permission on entity.

    This endpoint:
    1. Updates a valuation with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated valuation details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        valuation = await get_record_or_404(session, Valuation, valuation_id, "Valuation")

        # Check entity access
        entity_access = await get_entity_access(user.id, valuation.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to update valuations for this entity")

        # If updating entity_id, verify it exists (soft-delete aware)
        if data.entity_id is not None and data.entity_id != valuation.entity_id:
            await get_record_or_404(session, Entity, data.entity_id, "New entity")

        # If updating funding_round_id, verify it exists (soft-delete aware)
        if data.funding_round_id is not None and data.funding_round_id != valuation.funding_round_id:
            await get_record_or_404(session, FundingRound, data.funding_round_id, "New funding round")

        # Re-check duplicate if any unique constraint fields are changing
        check_entity_id = data.entity_id if data.entity_id is not None else valuation.entity_id
        check_funding_round_id = data.funding_round_id if data.funding_round_id is not None else valuation.funding_round_id
        check_date = data.date if data.date is not None else valuation.date

        if data.entity_id is not None or data.funding_round_id is not None or data.date is not None:
            await check_duplicate(
                db=session,
                model=Valuation,
                filters={"entity_id": check_entity_id, "funding_round_id": check_funding_round_id, "date": check_date},
                entity_label="Valuation",
                exclude_id=valuation_id,
            )

        org_id = await get_user_organization_id(user.id, session)

        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        await update_with_audit(
            db=session,
            item=valuation,
            table_name="valuations",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(valuation)

        return ValuationResponse(
            success=True,
            data=ValuationSchema.model_validate(valuation)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update valuation: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{valuation_id}")
async def delete_valuation(
    valuation_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete valuation - requires ADMIN permission on entity.

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        valuation = await get_record_or_404(session, Valuation, valuation_id, "Valuation")

        # Check entity access
        entity_access = await get_entity_access(user.id, valuation.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need ADMIN or OWNER role to delete valuations for this entity")

        org_id = await get_user_organization_id(user.id, session)

        # soft_delete_with_audit handles: old snapshot + deleted_at/deleted_by + DELETE audit
        await soft_delete_with_audit(
            db=session,
            item=valuation,
            table_name="valuations",
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "Valuation has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete valuation: {str(e)}")
