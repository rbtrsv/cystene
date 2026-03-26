"""
KPI Subrouter

FastAPI router for KPI model CRUD operations.
Parent of KPIValue — custom KPI definitions for entities.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.financial_models import KPI
from ...models.entity_models import Entity
from ...schemas.financial_schemas.kpi_schemas import (
    KPI as KPISchema,
    KPICreate, KPIUpdate,
    KPIResponse, KPIsResponse
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

router = APIRouter(tags=["KPIs"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=KPIsResponse)
async def list_kpis(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List KPIs for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access via get_user_entity_ids
    3. Returns a paginated list of KPIs
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return KPIsResponse(success=True, data=[])

        # Build query with soft-delete filter
        query = (
            select(KPI)
            .filter(KPI.entity_id.in_(accessible_entity_ids))
        )
        query = apply_soft_delete_filter(query, KPI)

        # Apply filters
        if entity_id:
            # Verify entity exists (soft-delete aware) and is accessible
            await get_record_or_404(session, Entity, entity_id, "Entity")
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(KPI.entity_id == entity_id)

        # Apply pagination
        query = query.order_by(KPI.id.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        kpis = result.scalars().all()

        return KPIsResponse(
            success=True,
            data=[KPISchema.model_validate(k) for k in kpis]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list KPIs: {str(e)}")

# ==========================================
# Individual KPI Operations
# ==========================================

@router.get("/{kpi_id}", response_model=KPIResponse)
async def get_kpi(
    kpi_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get KPI details - requires VIEW permission on entity.

    This endpoint:
    1. Retrieves a KPI by ID (excludes soft-deleted)
    2. Returns the KPI details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        kpi = await get_record_or_404(session, KPI, kpi_id, "KPI")

        # Check entity access
        entity_access = await get_entity_access(user.id, kpi.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return KPIResponse(
            success=True,
            data=KPISchema.model_validate(kpi)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get KPI: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=KPIResponse)
async def create_kpi(
    data: KPICreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create KPI - requires EDIT permission on entity.

    This endpoint:
    1. Creates a new KPI with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created KPI details
    """
    try:
        # Verify entity exists (soft-delete aware)
        await get_record_or_404(session, Entity, data.entity_id, "Entity")

        # Check entity access
        entity_access = await get_entity_access(user.id, data.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to create KPIs for this entity")

        org_id = await get_user_organization_id(user.id, session)

        # create_with_audit handles: model(**payload, created_by=user_id) + flush + INSERT audit
        kpi = await create_with_audit(
            db=session,
            model=KPI,
            table_name="kpis",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(kpi)

        return KPIResponse(
            success=True,
            data=KPISchema.model_validate(kpi)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create KPI: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{kpi_id}", response_model=KPIResponse)
async def update_kpi(
    kpi_id: int,
    data: KPIUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update KPI - requires EDIT permission on entity.

    This endpoint:
    1. Updates a KPI with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated KPI details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        kpi = await get_record_or_404(session, KPI, kpi_id, "KPI")

        # Check entity access
        entity_access = await get_entity_access(user.id, kpi.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to update KPIs for this entity")

        # If updating entity_id, verify it exists (soft-delete aware)
        if data.entity_id is not None and data.entity_id != kpi.entity_id:
            await get_record_or_404(session, Entity, data.entity_id, "New entity")

        org_id = await get_user_organization_id(user.id, session)

        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        await update_with_audit(
            db=session,
            item=kpi,
            table_name="kpis",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(kpi)

        return KPIResponse(
            success=True,
            data=KPISchema.model_validate(kpi)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update KPI: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{kpi_id}")
async def delete_kpi(
    kpi_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete KPI - requires ADMIN permission on entity.

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        kpi = await get_record_or_404(session, KPI, kpi_id, "KPI")

        # Check entity access
        entity_access = await get_entity_access(user.id, kpi.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need ADMIN or OWNER role to delete KPIs for this entity")

        org_id = await get_user_organization_id(user.id, session)

        # soft_delete_with_audit handles: old snapshot + deleted_at/deleted_by + DELETE audit
        await soft_delete_with_audit(
            db=session,
            item=kpi,
            table_name="kpis",
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "KPI has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete KPI: {str(e)}")
