"""
Syndicate Subrouter

FastAPI router for Syndicate model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.entity_models import Syndicate
from ...schemas.entity_schemas.syndicate_schemas import (
    Syndicate as SyndicateSchema,
    CreateSyndicate, UpdateSyndicate,
    SyndicateResponse, SyndicatesResponse
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

router = APIRouter(tags=["Syndicates"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=SyndicatesResponse)
async def list_syndicates(
    entity_id: Optional[int] = Query(None, description="Filter by managing entity"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List syndicates for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access (user's org → EntityOrganizationMember)
    3. Returns a paginated list of syndicates
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return SyndicatesResponse(success=True, data=[])

        # Build query - filter by accessible managing entities
        query = select(Syndicate).filter(Syndicate.entity_id.in_(accessible_entity_ids))
        query = apply_soft_delete_filter(query, Syndicate)

        # Apply filters
        if entity_id:
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(Syndicate.entity_id == entity_id)

        # Apply pagination
        query = query.order_by(Syndicate.name).offset(offset).limit(limit)
        result = await session.execute(query)
        syndicates = result.scalars().all()

        return SyndicatesResponse(
            success=True,
            data=[SyndicateSchema.model_validate(syndicate) for syndicate in syndicates]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list syndicates: {str(e)}")

# ==========================================
# Individual Syndicate Operations
# ==========================================

@router.get("/{syndicate_id}", response_model=SyndicateResponse)
async def get_syndicate(
    syndicate_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get syndicate details - requires VIEW permission on managing entity

    This endpoint:
    1. Retrieves a syndicate by ID (excludes soft-deleted)
    2. Returns the syndicate details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        syndicate = await get_record_or_404(session, Syndicate, syndicate_id, "Syndicate")

        # Entity access stays explicit — syndicate access is via managing entity FK
        entity_access = await get_entity_access(user.id, syndicate.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return SyndicateResponse(
            success=True,
            data=SyndicateSchema.model_validate(syndicate)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get syndicate: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=SyndicateResponse)
async def create_syndicate(
    data: CreateSyndicate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create syndicate - requires EDIT permission on managing entity.

    This endpoint:
    1. Creates a new syndicate with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created syndicate details
    """
    try:
        # Check entity access
        entity_access = await get_entity_access(user.id, data.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to create syndicates for this entity")

        org_id = await get_user_organization_id(user.id, session)

        # create_with_audit handles: model(**payload, created_by=user_id) + flush + INSERT audit
        syndicate = await create_with_audit(
            db=session,
            model=Syndicate,
            table_name="syndicates",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(syndicate)

        return SyndicateResponse(
            success=True,
            data=SyndicateSchema.model_validate(syndicate)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create syndicate: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{syndicate_id}", response_model=SyndicateResponse)
async def update_syndicate(
    syndicate_id: int,
    data: UpdateSyndicate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update syndicate - requires EDIT permission on managing entity

    This endpoint:
    1. Updates a syndicate with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated syndicate details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        syndicate = await get_record_or_404(session, Syndicate, syndicate_id, "Syndicate")

        # Entity access stays explicit
        entity_access = await get_entity_access(user.id, syndicate.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to update syndicates for this entity")

        org_id = await get_user_organization_id(user.id, session)

        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        await update_with_audit(
            db=session,
            item=syndicate,
            table_name="syndicates",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(syndicate)

        return SyndicateResponse(
            success=True,
            data=SyndicateSchema.model_validate(syndicate)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update syndicate: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{syndicate_id}")
async def delete_syndicate(
    syndicate_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete syndicate - requires ADMIN permission on managing entity

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        syndicate = await get_record_or_404(session, Syndicate, syndicate_id, "Syndicate")

        # Entity access stays explicit
        entity_access = await get_entity_access(user.id, syndicate.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need ADMIN or OWNER role to delete syndicates for this entity")

        org_id = await get_user_organization_id(user.id, session)
        name = syndicate.name

        # soft_delete_with_audit handles: old snapshot + deleted_at/deleted_by + DELETE audit
        await soft_delete_with_audit(
            db=session,
            item=syndicate,
            table_name="syndicates",
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": f"Syndicate '{name}' has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete syndicate: {str(e)}")
