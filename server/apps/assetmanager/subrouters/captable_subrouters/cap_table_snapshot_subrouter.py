"""
CapTableSnapshot Subrouter

FastAPI router for CapTableSnapshot model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.captable_models import CapTableSnapshot, FundingRound
from ...models.entity_models import Entity
from ...schemas.captable_schemas.cap_table_snapshot_schemas import (
    CapTableSnapshot as CapTableSnapshotSchema,
    CapTableSnapshotCreate, CapTableSnapshotUpdate,
    CapTableSnapshotResponse, CapTableSnapshotsResponse
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

router = APIRouter(tags=["Cap Table Snapshots"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=CapTableSnapshotsResponse)
async def list_cap_table_snapshots(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List cap table snapshots for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access via get_user_entity_ids
    3. Returns a paginated list of cap table snapshots
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return CapTableSnapshotsResponse(success=True, data=[])

        # Build query with soft-delete filter
        query = (
            select(CapTableSnapshot)
            .filter(CapTableSnapshot.entity_id.in_(accessible_entity_ids))
        )
        query = apply_soft_delete_filter(query, CapTableSnapshot)

        # Apply filters
        if entity_id:
            # Verify entity exists (soft-delete aware) and is accessible
            await get_record_or_404(session, Entity, entity_id, "Entity")
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(CapTableSnapshot.entity_id == entity_id)

        # Apply pagination
        query = query.order_by(CapTableSnapshot.snapshot_date.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        snapshots = result.scalars().all()

        return CapTableSnapshotsResponse(
            success=True,
            data=[CapTableSnapshotSchema.model_validate(s) for s in snapshots]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list cap table snapshots: {str(e)}")

# ==========================================
# Individual CapTableSnapshot Operations
# ==========================================

@router.get("/{snapshot_id}", response_model=CapTableSnapshotResponse)
async def get_cap_table_snapshot(
    snapshot_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get cap table snapshot details - requires VIEW permission on entity.

    This endpoint:
    1. Retrieves a cap table snapshot by ID (excludes soft-deleted)
    2. Returns the cap table snapshot details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        snapshot = await get_record_or_404(session, CapTableSnapshot, snapshot_id, "Cap table snapshot")

        # Check entity access
        entity_access = await get_entity_access(user.id, snapshot.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return CapTableSnapshotResponse(
            success=True,
            data=CapTableSnapshotSchema.model_validate(snapshot)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cap table snapshot: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=CapTableSnapshotResponse)
async def create_cap_table_snapshot(
    data: CapTableSnapshotCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create cap table snapshot - requires EDIT permission on entity.

    This endpoint:
    1. Creates a new cap table snapshot with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created cap table snapshot details
    """
    try:
        # Verify entity exists (soft-delete aware)
        await get_record_or_404(session, Entity, data.entity_id, "Entity")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # Verify funding_round FK if provided (soft-delete aware)
        if data.funding_round_id is not None:
            await get_record_or_404(session, FundingRound, data.funding_round_id, "Funding round")

        # create_with_audit handles: model(**payload, created_by=user_id) + flush + INSERT audit
        snapshot = await create_with_audit(
            db=session,
            model=CapTableSnapshot,
            table_name="cap_table_snapshots",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(snapshot)

        return CapTableSnapshotResponse(
            success=True,
            data=CapTableSnapshotSchema.model_validate(snapshot)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create cap table snapshot: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{snapshot_id}", response_model=CapTableSnapshotResponse)
async def update_cap_table_snapshot(
    snapshot_id: int,
    data: CapTableSnapshotUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update cap table snapshot - requires EDIT permission on entity.

    This endpoint:
    1. Updates a cap table snapshot with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated cap table snapshot details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        snapshot = await get_record_or_404(session, CapTableSnapshot, snapshot_id, "Cap table snapshot")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, snapshot.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # If updating entity_id, verify it exists (soft-delete aware)
        if data.entity_id is not None and data.entity_id != snapshot.entity_id:
            await get_record_or_404(session, Entity, data.entity_id, "New entity")

        # If updating funding_round_id, verify it exists (soft-delete aware)
        if data.funding_round_id is not None and data.funding_round_id != snapshot.funding_round_id:
            await get_record_or_404(session, FundingRound, data.funding_round_id, "New funding round")

        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        await update_with_audit(
            db=session,
            item=snapshot,
            table_name="cap_table_snapshots",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(snapshot)

        return CapTableSnapshotResponse(
            success=True,
            data=CapTableSnapshotSchema.model_validate(snapshot)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update cap table snapshot: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{snapshot_id}")
async def delete_cap_table_snapshot(
    snapshot_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete cap table snapshot - requires ADMIN permission on entity.

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        snapshot = await get_record_or_404(session, CapTableSnapshot, snapshot_id, "Cap table snapshot")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, snapshot.entity_id, session, ['ADMIN', 'OWNER'])

        # soft_delete_with_audit handles: old snapshot + deleted_at/deleted_by + DELETE audit
        await soft_delete_with_audit(
            db=session,
            item=snapshot,
            table_name="cap_table_snapshots",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "Cap table snapshot has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete cap table snapshot: {str(e)}")
