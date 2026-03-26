"""
SyndicateMember Subrouter

FastAPI router for SyndicateMember model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.entity_models import SyndicateMember, Syndicate, Entity
from ...schemas.entity_schemas.syndicate_member_schemas import (
    SyndicateMember as SyndicateMemberSchema,
    CreateSyndicateMember, UpdateSyndicateMember,
    SyndicateMemberResponse, SyndicateMembersResponse
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

router = APIRouter(tags=["Syndicate Members"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=SyndicateMembersResponse)
async def list_syndicate_members(
    syndicate_id: Optional[int] = Query(None, description="Filter by syndicate"),
    member_entity_id: Optional[int] = Query(None, description="Filter by member entity"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List syndicate members for syndicates the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access via syndicate's managing entity
    3. Returns a paginated list of syndicate members
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return SyndicateMembersResponse(success=True, data=[])

        # Build query - join with Syndicate to filter by accessible managing entities
        # Apply soft-delete filter on both SyndicateMember and the joined Syndicate
        query = (
            select(SyndicateMember)
            .join(Syndicate, SyndicateMember.syndicate_id == Syndicate.id)
            .filter(Syndicate.entity_id.in_(accessible_entity_ids))
            .filter(Syndicate.deleted_at.is_(None))
        )
        query = apply_soft_delete_filter(query, SyndicateMember)

        # Apply filters
        if syndicate_id:
            # Verify syndicate exists (soft-delete aware) and entity is accessible
            syndicate = await get_record_or_404(session, Syndicate, syndicate_id, "Syndicate")
            if syndicate.entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this syndicate's entity")
            query = query.filter(SyndicateMember.syndicate_id == syndicate_id)

        if member_entity_id:
            query = query.filter(SyndicateMember.member_entity_id == member_entity_id)

        # Apply pagination
        query = query.order_by(SyndicateMember.joined_date.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        syndicate_members = result.scalars().all()

        return SyndicateMembersResponse(
            success=True,
            data=[SyndicateMemberSchema.model_validate(member) for member in syndicate_members]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list syndicate members: {str(e)}")

# ==========================================
# Individual SyndicateMember Operations
# ==========================================

@router.get("/{member_id}", response_model=SyndicateMemberResponse)
async def get_syndicate_member(
    member_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get syndicate member details - requires VIEW permission on syndicate's managing entity

    This endpoint:
    1. Retrieves a syndicate member by ID (excludes soft-deleted)
    2. Returns the syndicate member details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        syndicate_member = await get_record_or_404(session, SyndicateMember, member_id, "Syndicate member")

        # 2-level FK chain: member → syndicate → entity (soft-delete aware)
        syndicate = await get_record_or_404(session, Syndicate, syndicate_member.syndicate_id, "Associated syndicate")

        # Check entity access via syndicate's managing entity
        entity_access = await get_entity_access(user.id, syndicate.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this syndicate's entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return SyndicateMemberResponse(
            success=True,
            data=SyndicateMemberSchema.model_validate(syndicate_member)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get syndicate member: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=SyndicateMemberResponse)
async def create_syndicate_member(
    data: CreateSyndicateMember,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create syndicate member - requires EDIT permission on syndicate's managing entity.

    This endpoint:
    1. Creates a new syndicate member with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created syndicate member details
    """
    try:
        # Verify syndicate exists (soft-delete aware)
        syndicate = await get_record_or_404(session, Syndicate, data.syndicate_id, "Syndicate")

        # Verify member entity exists (soft-delete aware)
        await get_record_or_404(session, Entity, data.member_entity_id, "Member entity")

        # Check entity access via syndicate's managing entity
        entity_access = await get_entity_access(user.id, syndicate.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this syndicate's entity")

        if entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to manage syndicate members for this entity")

        # check_duplicate handles: composite key check + soft-delete filter + 409
        await check_duplicate(
            db=session,
            model=SyndicateMember,
            filters={"syndicate_id": data.syndicate_id, "member_entity_id": data.member_entity_id},
            entity_label="Syndicate membership",
        )

        org_id = await get_user_organization_id(user.id, session)

        # create_with_audit handles: model(**payload, created_by=user_id) + flush + INSERT audit
        syndicate_member = await create_with_audit(
            db=session,
            model=SyndicateMember,
            table_name="syndicate_members",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(syndicate_member)

        return SyndicateMemberResponse(
            success=True,
            data=SyndicateMemberSchema.model_validate(syndicate_member)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create syndicate member: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{member_id}", response_model=SyndicateMemberResponse)
async def update_syndicate_member(
    member_id: int,
    data: UpdateSyndicateMember,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update syndicate member - requires EDIT permission on syndicate's managing entity

    This endpoint:
    1. Updates a syndicate member with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated syndicate member details
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        syndicate_member = await get_record_or_404(session, SyndicateMember, member_id, "Syndicate member")

        # 2-level FK chain: member → syndicate → entity (soft-delete aware)
        syndicate = await get_record_or_404(session, Syndicate, syndicate_member.syndicate_id, "Associated syndicate")

        # Check entity access via syndicate's managing entity
        entity_access = await get_entity_access(user.id, syndicate.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this syndicate's entity")

        if entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to update syndicate members for this entity")

        # If updating syndicate_id, verify it exists (soft-delete aware)
        if data.syndicate_id is not None and data.syndicate_id != syndicate_member.syndicate_id:
            await get_record_or_404(session, Syndicate, data.syndicate_id, "New syndicate")

        # If updating member_entity_id, verify entity exists (soft-delete aware)
        if data.member_entity_id is not None and data.member_entity_id != syndicate_member.member_entity_id:
            await get_record_or_404(session, Entity, data.member_entity_id, "New member entity")

        # Check for duplicate membership if syndicate_id or member_entity_id is being changed
        if data.syndicate_id is not None or data.member_entity_id is not None:
            check_syndicate_id = data.syndicate_id if data.syndicate_id is not None else syndicate_member.syndicate_id
            check_member_entity_id = data.member_entity_id if data.member_entity_id is not None else syndicate_member.member_entity_id

            await check_duplicate(
                db=session,
                model=SyndicateMember,
                filters={"syndicate_id": check_syndicate_id, "member_entity_id": check_member_entity_id},
                entity_label="Syndicate membership",
                exclude_id=member_id,
            )

        org_id = await get_user_organization_id(user.id, session)

        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        await update_with_audit(
            db=session,
            item=syndicate_member,
            table_name="syndicate_members",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(syndicate_member)

        return SyndicateMemberResponse(
            success=True,
            data=SyndicateMemberSchema.model_validate(syndicate_member)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update syndicate member: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{member_id}")
async def delete_syndicate_member(
    member_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete syndicate member - requires ADMIN permission on syndicate's managing entity

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        # get_record_or_404 handles: SELECT + soft-delete filter + 404
        syndicate_member = await get_record_or_404(session, SyndicateMember, member_id, "Syndicate member")

        # 2-level FK chain: member → syndicate → entity (soft-delete aware)
        syndicate = await get_record_or_404(session, Syndicate, syndicate_member.syndicate_id, "Associated syndicate")

        # Check entity access via syndicate's managing entity
        entity_access = await get_entity_access(user.id, syndicate.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this syndicate's entity")

        if entity_access.role not in ['ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need ADMIN or OWNER role to remove syndicate members for this entity")

        org_id = await get_user_organization_id(user.id, session)

        # soft_delete_with_audit handles: old snapshot + deleted_at/deleted_by + DELETE audit
        await soft_delete_with_audit(
            db=session,
            item=syndicate_member,
            table_name="syndicate_members",
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "Syndicate member has been removed"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete syndicate member: {str(e)}")
