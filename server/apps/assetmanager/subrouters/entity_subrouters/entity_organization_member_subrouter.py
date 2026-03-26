"""
EntityOrganizationMember Subrouter

FastAPI router for EntityOrganizationMember model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.entity_models import EntityOrganizationMember
from ...schemas.entity_schemas.entity_organization_member_schemas import (
    EntityOrganizationMember as EntityOrganizationMemberSchema,
    CreateEntityOrganizationMember, UpdateEntityOrganizationMember,
    EntityOrganizationMemberResponse, EntityOrganizationMembersResponse
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

router = APIRouter(tags=["Entity Organization Members"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=EntityOrganizationMembersResponse)
async def list_entity_organization_members(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    organization_id: Optional[int] = Query(None, description="Filter by organization"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List entity organization members for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access (user's org → EntityOrganizationMember)
    3. Returns a paginated list of entity organization members
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return EntityOrganizationMembersResponse(success=True, data=[])

        # Build query
        query = select(EntityOrganizationMember).filter(
            EntityOrganizationMember.entity_id.in_(accessible_entity_ids)
        )
        query = apply_soft_delete_filter(query, EntityOrganizationMember)

        # Apply filters
        if entity_id:
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(EntityOrganizationMember.entity_id == entity_id)

        if organization_id:
            query = query.filter(EntityOrganizationMember.organization_id == organization_id)

        # Apply pagination
        query = query.order_by(EntityOrganizationMember.joined_at.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        members = result.scalars().all()

        return EntityOrganizationMembersResponse(
            success=True,
            data=[EntityOrganizationMemberSchema.model_validate(member) for member in members]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list entity organization members: {str(e)}")

# ==========================================
# Individual Member Operations
# ==========================================

@router.get("/{member_id}", response_model=EntityOrganizationMemberResponse)
async def get_entity_organization_member(
    member_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get entity organization member details - requires VIEW permission on entity

    This endpoint:
    1. Retrieves an entity organization member by ID (excludes soft-deleted)
    2. Returns the member details
    """
    try:
        member = await get_record_or_404(
            session, EntityOrganizationMember, member_id, "Entity organization member"
        )

        # Check entity access
        entity_access = await get_entity_access(user.id, member.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return EntityOrganizationMemberResponse(
            success=True,
            data=EntityOrganizationMemberSchema.model_validate(member)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get entity organization member: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=EntityOrganizationMemberResponse)
async def create_entity_organization_member(
    data: CreateEntityOrganizationMember,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create entity organization member - requires ADMIN permission on entity.

    This endpoint:
    1. Creates a new entity organization member with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created member details
    """
    try:
        # Check entity access
        entity_access = await get_entity_access(user.id, data.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need ADMIN or OWNER role to manage entity organization members")

        await check_duplicate(
            db=session,
            model=EntityOrganizationMember,
            filters={"entity_id": data.entity_id, "organization_id": data.organization_id},
            entity_label="Entity organization membership",
        )

        org_id = await get_user_organization_id(user.id, session)

        member = await create_with_audit(
            db=session,
            model=EntityOrganizationMember,
            table_name="entity_organization_members",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(member)

        return EntityOrganizationMemberResponse(
            success=True,
            data=EntityOrganizationMemberSchema.model_validate(member)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create entity organization member: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{member_id}", response_model=EntityOrganizationMemberResponse)
async def update_entity_organization_member(
    member_id: int,
    data: UpdateEntityOrganizationMember,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update entity organization member - requires ADMIN permission on entity

    This endpoint:
    1. Updates an entity organization member with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated member details
    """
    try:
        member = await get_record_or_404(
            session, EntityOrganizationMember, member_id, "Entity organization member"
        )

        # Check entity access
        entity_access = await get_entity_access(user.id, member.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need ADMIN or OWNER role to manage entity organization members")

        org_id = await get_user_organization_id(user.id, session)

        await update_with_audit(
            db=session,
            item=member,
            table_name="entity_organization_members",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(member)

        return EntityOrganizationMemberResponse(
            success=True,
            data=EntityOrganizationMemberSchema.model_validate(member)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update entity organization member: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{member_id}")
async def delete_entity_organization_member(
    member_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete entity organization member - requires ADMIN permission on entity

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        member = await get_record_or_404(
            session, EntityOrganizationMember, member_id, "Entity organization member"
        )

        # Check entity access
        entity_access = await get_entity_access(user.id, member.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need ADMIN or OWNER role to manage entity organization members")

        org_id = await get_user_organization_id(user.id, session)

        await soft_delete_with_audit(
            db=session,
            item=member,
            table_name="entity_organization_members",
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "Entity organization member has been removed"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete entity organization member: {str(e)}")
