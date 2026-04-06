"""
KPIValue Subrouter

FastAPI router for KPIValue model CRUD operations.
Child of KPI — access control through kpi_id → KPI.entity_id.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.financial_models import KPIValue, KPI
from ...schemas.financial_schemas.kpi_value_schemas import (
    KPIValue as KPIValueSchema,
    KPIValueCreate, KPIValueUpdate,
    KPIValueResponse, KPIValuesResponse
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

router = APIRouter(tags=["KPI Values"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=KPIValuesResponse)
async def list_kpi_values(
    kpi_id: Optional[int] = Query(None, description="Filter by KPI"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List KPI values for KPIs the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters out values whose parent KPI is soft-deleted
    3. Filters by entity access via KPI.entity_id
    4. Returns a paginated list of KPI values
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return KPIValuesResponse(success=True, data=[])

        # Build query - join with KPI to filter by accessible entities and soft-deleted parents
        query = (
            select(KPIValue)
            .join(KPI, KPIValue.kpi_id == KPI.id)
            .filter(KPI.entity_id.in_(accessible_entity_ids))
            .filter(KPI.deleted_at.is_(None))
        )
        query = apply_soft_delete_filter(query, KPIValue)

        # Apply filters
        if kpi_id:
            # Verify KPI exists (soft-delete aware) and entity is accessible
            kpi = await get_record_or_404(session, KPI, kpi_id, "KPI")
            if kpi.entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this KPI's entity")
            query = query.filter(KPIValue.kpi_id == kpi_id)

        # Apply pagination
        query = query.order_by(KPIValue.id.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        values = result.scalars().all()

        return KPIValuesResponse(
            success=True,
            data=[KPIValueSchema.model_validate(v) for v in values]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list KPI values: {str(e)}")

# ==========================================
# Individual KPIValue Operations
# ==========================================

@router.get("/{value_id}", response_model=KPIValueResponse)
async def get_kpi_value(
    value_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get KPI value details - requires VIEW permission on entity via KPI.

    This endpoint:
    1. Retrieves a KPI value by ID (excludes soft-deleted)
    2. Returns the KPI value details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        value = await get_record_or_404(session, KPIValue, value_id, "KPI value")

        # 2-level FK chain: value → KPI → entity (soft-delete aware)
        kpi = await get_record_or_404(session, KPI, value.kpi_id, "Associated KPI")

        # Check entity access via KPI's entity_id
        entity_access = await get_entity_access(user.id, kpi.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this KPI's entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return KPIValueResponse(
            success=True,
            data=KPIValueSchema.model_validate(value)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get KPI value: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=KPIValueResponse)
async def create_kpi_value(
    data: KPIValueCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create KPI value - requires EDIT permission on entity via KPI.

    This endpoint:
    1. Creates a new KPI value with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created KPI value details
    """
    try:
        # Verify KPI exists (soft-delete aware)
        kpi = await get_record_or_404(session, KPI, data.kpi_id, "KPI")

        # Check entity access + role + subscription (via KPI's entity_id)
        entity_access = await require_write_access(user.id, kpi.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # check_duplicate handles: composite key check + soft-delete filter + 409
        await check_duplicate(
            db=session,
            model=KPIValue,
            filters={"kpi_id": data.kpi_id, "date": data.date, "scenario": data.scenario},
            entity_label="KPI value",
        )


        # create_with_audit handles: model(**payload, created_by=user_id) + flush + INSERT audit
        value = await create_with_audit(
            db=session,
            model=KPIValue,
            table_name="kpi_values",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(value)

        return KPIValueResponse(
            success=True,
            data=KPIValueSchema.model_validate(value)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create KPI value: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{value_id}", response_model=KPIValueResponse)
async def update_kpi_value(
    value_id: int,
    data: KPIValueUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update KPI value - requires EDIT permission on entity via KPI.

    This endpoint:
    1. Updates a KPI value with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated KPI value details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        value = await get_record_or_404(session, KPIValue, value_id, "KPI value")

        # 2-level FK chain: value → KPI → entity (soft-delete aware)
        kpi = await get_record_or_404(session, KPI, value.kpi_id, "Associated KPI")

        # Check entity access + role + subscription (via KPI's entity_id)
        entity_access = await require_write_access(user.id, kpi.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # If updating kpi_id, verify it exists (soft-delete aware)
        if data.kpi_id is not None and data.kpi_id != value.kpi_id:
            await get_record_or_404(session, KPI, data.kpi_id, "New KPI")

        # Re-check duplicate if any unique constraint fields are changing
        if data.kpi_id is not None or data.date is not None or data.scenario is not None:
            check_kpi_id = data.kpi_id if data.kpi_id is not None else value.kpi_id
            check_date = data.date if data.date is not None else value.date
            check_scenario = data.scenario if data.scenario is not None else value.scenario

            await check_duplicate(
                db=session,
                model=KPIValue,
                filters={"kpi_id": check_kpi_id, "date": check_date, "scenario": check_scenario},
                entity_label="KPI value",
                exclude_id=value_id,
            )


        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        await update_with_audit(
            db=session,
            item=value,
            table_name="kpi_values",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(value)

        return KPIValueResponse(
            success=True,
            data=KPIValueSchema.model_validate(value)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update KPI value: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{value_id}")
async def delete_kpi_value(
    value_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete KPI value - requires ADMIN permission on entity via KPI.

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        value = await get_record_or_404(session, KPIValue, value_id, "KPI value")

        # 2-level FK chain: value → KPI → entity (soft-delete aware)
        kpi = await get_record_or_404(session, KPI, value.kpi_id, "Associated KPI")

        # Check entity access + role + subscription (via KPI's entity_id)
        entity_access = await require_write_access(user.id, kpi.entity_id, session, ['ADMIN', 'OWNER'])


        # soft_delete_with_audit handles: old snapshot + deleted_at/deleted_by + DELETE audit
        await soft_delete_with_audit(
            db=session,
            item=value,
            table_name="kpi_values",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "KPI value has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete KPI value: {str(e)}")
