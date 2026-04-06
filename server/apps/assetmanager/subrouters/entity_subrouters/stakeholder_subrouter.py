"""
Stakeholder Subrouter

FastAPI router for Stakeholder model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from core.db import get_session
from ...models.entity_models import Stakeholder
from ...models.captable_models import Commitment, SecurityTransaction
from ...schemas.entity_schemas.stakeholder_schemas import (
    Stakeholder as StakeholderSchema,
    CreateStakeholder, UpdateStakeholder,
    StakeholderResponse, StakeholdersResponse,
    StakeholderType
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

router = APIRouter(tags=["Stakeholders"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=StakeholdersResponse)
async def list_stakeholders(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    stakeholder_type: Optional[StakeholderType] = Query(None, description="Filter by stakeholder type"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List stakeholders for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access (user's org → EntityOrganizationMember)
    3. Returns a paginated list of stakeholders
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return StakeholdersResponse(success=True, data=[])

        # Build query - filter by entities user has access to
        query = select(Stakeholder).filter(
            Stakeholder.entity_id.in_(accessible_entity_ids)
        )
        query = apply_soft_delete_filter(query, Stakeholder)

        # Apply filters
        if entity_id:
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(Stakeholder.entity_id == entity_id)

        if stakeholder_type:
            query = query.filter(Stakeholder.type == stakeholder_type.value)

        # Apply pagination
        query = query.order_by(Stakeholder.id).offset(offset).limit(limit)
        result = await session.execute(query)
        stakeholders = result.scalars().all()

        return StakeholdersResponse(
            success=True,
            data=[StakeholderSchema.model_validate(stakeholder) for stakeholder in stakeholders]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list stakeholders: {str(e)}")

# ==========================================
# Individual Stakeholder Operations
# ==========================================

@router.get("/{stakeholder_id}", response_model=StakeholderResponse)
async def get_stakeholder(
    stakeholder_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get stakeholder details - requires VIEW permission on entity

    This endpoint:
    1. Retrieves a stakeholder by ID (excludes soft-deleted)
    2. Returns the stakeholder details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        stakeholder = await get_record_or_404(session, Stakeholder, stakeholder_id, "Stakeholder")

        # Check entity access
        entity_access = await get_entity_access(user.id, stakeholder.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return StakeholderResponse(
            success=True,
            data=StakeholderSchema.model_validate(stakeholder)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stakeholder: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=StakeholderResponse)
async def create_stakeholder(
    data: CreateStakeholder,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create stakeholder - requires EDIT permission on entity.

    This endpoint:
    1. Creates a new stakeholder with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created stakeholder details
    """
    try:
        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # create_with_audit handles: model(**payload, created_by=user_id) + flush + INSERT audit
        # Enum→value conversion handled inside the helper
        stakeholder = await create_with_audit(
            db=session,
            model=Stakeholder,
            table_name="stakeholders",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(stakeholder)

        return StakeholderResponse(
            success=True,
            data=StakeholderSchema.model_validate(stakeholder)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create stakeholder: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{stakeholder_id}", response_model=StakeholderResponse)
async def update_stakeholder(
    stakeholder_id: int,
    data: UpdateStakeholder,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update stakeholder - requires EDIT permission on entity

    This endpoint:
    1. Updates a stakeholder with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated stakeholder details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        stakeholder = await get_record_or_404(session, Stakeholder, stakeholder_id, "Stakeholder")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, stakeholder.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # Protect source_entity_id — block change if stakeholder has existing transactions or commitments
        update_data = data.model_dump(exclude_unset=True)
        if 'source_entity_id' in update_data and update_data['source_entity_id'] != stakeholder.source_entity_id:
            commitment_count = await session.scalar(
                select(func.count()).select_from(Commitment).filter(
                    Commitment.stakeholder_id == stakeholder_id,
                    Commitment.deleted_at == None
                )
            )
            txn_count = await session.scalar(
                select(func.count()).select_from(SecurityTransaction).filter(
                    SecurityTransaction.stakeholder_id == stakeholder_id,
                    SecurityTransaction.deleted_at == None
                )
            )
            if commitment_count > 0 or txn_count > 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot change source_entity_id: stakeholder has {commitment_count} commitment(s) and {txn_count} transaction(s). Remove them first."
                )

        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        # Enum→value conversion handled inside the helper
        await update_with_audit(
            db=session,
            item=stakeholder,
            table_name="stakeholders",
            payload=update_data,
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(stakeholder)

        return StakeholderResponse(
            success=True,
            data=StakeholderSchema.model_validate(stakeholder)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update stakeholder: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{stakeholder_id}")
async def delete_stakeholder(
    stakeholder_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete stakeholder - requires ADMIN permission on entity

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        stakeholder = await get_record_or_404(session, Stakeholder, stakeholder_id, "Stakeholder")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, stakeholder.entity_id, session, ['ADMIN', 'OWNER'])

        # soft_delete_with_audit handles: old snapshot + deleted_at/deleted_by + DELETE audit
        await soft_delete_with_audit(
            db=session,
            item=stakeholder,
            table_name="stakeholders",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": f"Stakeholder {stakeholder_id} has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete stakeholder: {str(e)}")
