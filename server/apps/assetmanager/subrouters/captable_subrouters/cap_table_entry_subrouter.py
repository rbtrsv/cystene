"""
CapTableEntry Subrouter

FastAPI router for CapTableEntry model CRUD operations.
Child of CapTableSnapshot — access control through entity_id directly.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.captable_models import CapTableEntry, CapTableSnapshot, Security, FundingRound
from ...models.entity_models import Entity, Stakeholder
from ...schemas.captable_schemas.cap_table_entry_schemas import (
    CapTableEntry as CapTableEntrySchema,
    CapTableEntryCreate, CapTableEntryUpdate,
    CapTableEntryResponse, CapTableEntriesResponse
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

router = APIRouter(tags=["Cap Table Entries"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=CapTableEntriesResponse)
async def list_cap_table_entries(
    snapshot_id: Optional[int] = Query(None, description="Filter by snapshot"),
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    stakeholder_id: Optional[int] = Query(None, description="Filter by stakeholder"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List cap table entries for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters out entries whose parent CapTableSnapshot is soft-deleted
    3. Filters by entity access via get_user_entity_ids
    4. Returns a paginated list of cap table entries
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return CapTableEntriesResponse(success=True, data=[])

        # Build query - join with CapTableSnapshot to filter soft-deleted parents
        query = (
            select(CapTableEntry)
            .join(CapTableSnapshot, CapTableEntry.snapshot_id == CapTableSnapshot.id)
            .filter(CapTableEntry.entity_id.in_(accessible_entity_ids))
            .filter(CapTableSnapshot.deleted_at.is_(None))
        )
        query = apply_soft_delete_filter(query, CapTableEntry)

        # Apply filters
        if snapshot_id:
            # Verify snapshot exists (soft-delete aware) and entity is accessible
            snapshot = await get_record_or_404(session, CapTableSnapshot, snapshot_id, "Cap table snapshot")
            if snapshot.entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this snapshot's entity")
            query = query.filter(CapTableEntry.snapshot_id == snapshot_id)

        if entity_id:
            # Verify entity exists (soft-delete aware) and is accessible
            await get_record_or_404(session, Entity, entity_id, "Entity")
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(CapTableEntry.entity_id == entity_id)

        if stakeholder_id:
            query = query.filter(CapTableEntry.stakeholder_id == stakeholder_id)

        # Apply pagination
        query = query.order_by(CapTableEntry.id.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        entries = result.scalars().all()

        return CapTableEntriesResponse(
            success=True,
            data=[CapTableEntrySchema.model_validate(e) for e in entries]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list cap table entries: {str(e)}")

# ==========================================
# Individual CapTableEntry Operations
# ==========================================

@router.get("/{entry_id}", response_model=CapTableEntryResponse)
async def get_cap_table_entry(
    entry_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get cap table entry details - requires VIEW permission on entity.

    This endpoint:
    1. Retrieves a cap table entry by ID (excludes soft-deleted)
    2. Returns the cap table entry details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        entry = await get_record_or_404(session, CapTableEntry, entry_id, "Cap table entry")

        # Check entity access via entry's direct entity_id
        entity_access = await get_entity_access(user.id, entry.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return CapTableEntryResponse(
            success=True,
            data=CapTableEntrySchema.model_validate(entry)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cap table entry: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=CapTableEntryResponse)
async def create_cap_table_entry(
    data: CapTableEntryCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create cap table entry - requires EDIT permission on entity.

    This endpoint:
    1. Creates a new cap table entry with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created cap table entry details
    """
    try:
        # Verify entity exists (soft-delete aware)
        await get_record_or_404(session, Entity, data.entity_id, "Entity")

        # Check entity access
        entity_access = await get_entity_access(user.id, data.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to create cap table entries for this entity")

        # Verify snapshot FK (soft-delete aware)
        await get_record_or_404(session, CapTableSnapshot, data.snapshot_id, "Cap table snapshot")

        # Verify security FK (soft-delete aware)
        await get_record_or_404(session, Security, data.security_id, "Security")

        # Verify stakeholder FK (soft-delete aware)
        await get_record_or_404(session, Stakeholder, data.stakeholder_id, "Stakeholder")

        # Verify funding_round FK if provided (soft-delete aware)
        if data.funding_round_id is not None:
            await get_record_or_404(session, FundingRound, data.funding_round_id, "Funding round")

        org_id = await get_user_organization_id(user.id, session)

        # create_with_audit handles: model(**payload, created_by=user_id) + flush + INSERT audit
        entry = await create_with_audit(
            db=session,
            model=CapTableEntry,
            table_name="cap_table_entries",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(entry)

        return CapTableEntryResponse(
            success=True,
            data=CapTableEntrySchema.model_validate(entry)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create cap table entry: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{entry_id}", response_model=CapTableEntryResponse)
async def update_cap_table_entry(
    entry_id: int,
    data: CapTableEntryUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update cap table entry - requires EDIT permission on entity.

    This endpoint:
    1. Updates a cap table entry with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated cap table entry details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        entry = await get_record_or_404(session, CapTableEntry, entry_id, "Cap table entry")

        # Check entity access via entry's direct entity_id
        entity_access = await get_entity_access(user.id, entry.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to update cap table entries for this entity")

        # If updating entity_id, verify it exists (soft-delete aware)
        if data.entity_id is not None and data.entity_id != entry.entity_id:
            await get_record_or_404(session, Entity, data.entity_id, "New entity")

        # If updating snapshot_id, verify it exists (soft-delete aware)
        if data.snapshot_id is not None and data.snapshot_id != entry.snapshot_id:
            await get_record_or_404(session, CapTableSnapshot, data.snapshot_id, "New cap table snapshot")

        # If updating security_id, verify it exists (soft-delete aware)
        if data.security_id is not None and data.security_id != entry.security_id:
            await get_record_or_404(session, Security, data.security_id, "New security")

        # If updating stakeholder_id, verify it exists (soft-delete aware)
        if data.stakeholder_id is not None and data.stakeholder_id != entry.stakeholder_id:
            await get_record_or_404(session, Stakeholder, data.stakeholder_id, "New stakeholder")

        # If updating funding_round_id, verify it exists (soft-delete aware)
        if data.funding_round_id is not None and data.funding_round_id != entry.funding_round_id:
            await get_record_or_404(session, FundingRound, data.funding_round_id, "New funding round")

        org_id = await get_user_organization_id(user.id, session)

        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        await update_with_audit(
            db=session,
            item=entry,
            table_name="cap_table_entries",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(entry)

        return CapTableEntryResponse(
            success=True,
            data=CapTableEntrySchema.model_validate(entry)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update cap table entry: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{entry_id}")
async def delete_cap_table_entry(
    entry_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete cap table entry - requires ADMIN permission on entity.

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        entry = await get_record_or_404(session, CapTableEntry, entry_id, "Cap table entry")

        # Check entity access via entry's direct entity_id
        entity_access = await get_entity_access(user.id, entry.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need ADMIN or OWNER role to delete cap table entries for this entity")

        org_id = await get_user_organization_id(user.id, session)

        # soft_delete_with_audit handles: old snapshot + deleted_at/deleted_by + DELETE audit
        await soft_delete_with_audit(
            db=session,
            item=entry,
            table_name="cap_table_entries",
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "Cap table entry has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete cap table entry: {str(e)}")
