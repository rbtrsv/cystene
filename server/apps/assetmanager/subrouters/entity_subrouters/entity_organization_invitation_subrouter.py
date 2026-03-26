"""
EntityOrganizationInvitation Subrouter

FastAPI router for EntityOrganizationInvitation model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.entity_models import EntityOrganizationInvitation, EntityOrganizationMember
from ...schemas.entity_schemas.entity_organization_invitation_schemas import (
    EntityOrganizationInvitation as EntityOrganizationInvitationSchema,
    CreateEntityOrganizationInvitation, UpdateEntityOrganizationInvitation,
    EntityOrganizationInvitationResponse, EntityOrganizationInvitationsResponse,
    InvitationStatus
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

router = APIRouter(tags=["Entity Organization Invitations"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=EntityOrganizationInvitationsResponse)
async def list_entity_organization_invitations(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    organization_id: Optional[int] = Query(None, description="Filter by organization"),
    status: Optional[InvitationStatus] = Query(None, description="Filter by status"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List entity organization invitations for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access (user's org → EntityOrganizationMember)
    3. Returns a paginated list of entity organization invitations
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return EntityOrganizationInvitationsResponse(success=True, data=[])

        # Build query
        query = select(EntityOrganizationInvitation).filter(
            EntityOrganizationInvitation.entity_id.in_(accessible_entity_ids)
        )
        query = apply_soft_delete_filter(query, EntityOrganizationInvitation)

        # Apply filters
        if entity_id:
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(EntityOrganizationInvitation.entity_id == entity_id)

        if organization_id:
            query = query.filter(EntityOrganizationInvitation.organization_id == organization_id)

        if status:
            query = query.filter(EntityOrganizationInvitation.status == status.value)

        # Apply pagination
        query = query.order_by(EntityOrganizationInvitation.invited_at.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        invitations = result.scalars().all()

        return EntityOrganizationInvitationsResponse(
            success=True,
            data=[EntityOrganizationInvitationSchema.model_validate(invitation) for invitation in invitations]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list entity organization invitations: {str(e)}")

# ==========================================
# Individual Invitation Operations
# ==========================================

@router.get("/{invitation_id}", response_model=EntityOrganizationInvitationResponse)
async def get_entity_organization_invitation(
    invitation_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get entity organization invitation details - requires VIEW permission on entity

    This endpoint:
    1. Retrieves an entity organization invitation by ID (excludes soft-deleted)
    2. Returns the invitation details
    """
    try:
        invitation = await get_record_or_404(
            session, EntityOrganizationInvitation, invitation_id, "Entity organization invitation"
        )

        # Check entity access
        entity_access = await get_entity_access(user.id, invitation.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return EntityOrganizationInvitationResponse(
            success=True,
            data=EntityOrganizationInvitationSchema.model_validate(invitation)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get entity organization invitation: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=EntityOrganizationInvitationResponse)
async def create_entity_organization_invitation(
    data: CreateEntityOrganizationInvitation,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create entity organization invitation - requires ADMIN permission on entity.

    This endpoint:
    1. Creates a new entity organization invitation with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created invitation details
    """
    try:
        # Check entity access
        entity_access = await get_entity_access(user.id, data.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need ADMIN or OWNER role to send entity organization invitations")

        # Check if organization is already an active member
        existing_member_query = select(EntityOrganizationMember).filter(
            EntityOrganizationMember.entity_id == data.entity_id,
            EntityOrganizationMember.organization_id == data.organization_id,
        )
        existing_member_query = apply_soft_delete_filter(existing_member_query, EntityOrganizationMember)
        existing_member = await session.scalar(existing_member_query)

        if existing_member:
            raise HTTPException(status_code=409, detail="Organization is already a member of this entity")

        await check_duplicate(
            db=session,
            model=EntityOrganizationInvitation,
            filters={
                "entity_id": data.entity_id,
                "organization_id": data.organization_id,
                "status": InvitationStatus.PENDING.value,
            },
            entity_label="Entity organization invitation",
        )

        org_id = await get_user_organization_id(user.id, session)

        payload = data.model_dump()
        payload["status"] = InvitationStatus.PENDING.value
        invitation = await create_with_audit(
            db=session,
            model=EntityOrganizationInvitation,
            table_name="entity_organization_invitations",
            payload=payload,
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(invitation)

        return EntityOrganizationInvitationResponse(
            success=True,
            data=EntityOrganizationInvitationSchema.model_validate(invitation)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create entity organization invitation: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{invitation_id}", response_model=EntityOrganizationInvitationResponse)
async def update_entity_organization_invitation(
    invitation_id: int,
    data: UpdateEntityOrganizationInvitation,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update entity organization invitation - requires ADMIN permission on entity

    This endpoint:
    1. Updates an entity organization invitation with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated invitation details
    """
    try:
        invitation = await get_record_or_404(
            session, EntityOrganizationInvitation, invitation_id, "Entity organization invitation"
        )

        # Check entity access
        entity_access = await get_entity_access(user.id, invitation.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need ADMIN or OWNER role to manage entity organization invitations")

        org_id = await get_user_organization_id(user.id, session)

        await update_with_audit(
            db=session,
            item=invitation,
            table_name="entity_organization_invitations",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(invitation)

        return EntityOrganizationInvitationResponse(
            success=True,
            data=EntityOrganizationInvitationSchema.model_validate(invitation)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update entity organization invitation: {str(e)}")

# ==========================================
# Accept/Reject Invitation Operations
# ==========================================

@router.post("/{invitation_id}/accept", response_model=EntityOrganizationInvitationResponse)
async def accept_entity_organization_invitation(
    invitation_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Accept entity organization invitation - creates EntityOrganizationMember

    This endpoint:
    1. Validates invitation is in pending status
    2. Creates an EntityOrganizationMember from the invitation
    3. Updates invitation status to ACCEPTED
    4. Logs both the member creation and invitation status change to the audit log
    5. Returns the updated invitation details
    """
    try:
        invitation = await get_record_or_404(
            session, EntityOrganizationInvitation, invitation_id, "Entity organization invitation"
        )

        if invitation.status != InvitationStatus.PENDING.value:
            raise HTTPException(status_code=409, detail="Invitation is not in pending status")

        org_id = await get_user_organization_id(user.id, session)

        await check_duplicate(
            db=session,
            model=EntityOrganizationMember,
            filters={"entity_id": invitation.entity_id, "organization_id": invitation.organization_id},
            entity_label="Entity organization membership",
        )

        member = await create_with_audit(
            db=session,
            model=EntityOrganizationMember,
            table_name="entity_organization_members",
            payload={
                "entity_id": invitation.entity_id,
                "organization_id": invitation.organization_id,
                "role": invitation.role,
            },
            user_id=user.id,
            organization_id=org_id,
        )

        await update_with_audit(
            db=session,
            item=invitation,
            table_name="entity_organization_invitations",
            payload={"status": InvitationStatus.ACCEPTED.value},
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(invitation)

        return EntityOrganizationInvitationResponse(
            success=True,
            data=EntityOrganizationInvitationSchema.model_validate(invitation)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to accept invitation: {str(e)}")

@router.post("/{invitation_id}/reject", response_model=EntityOrganizationInvitationResponse)
async def reject_entity_organization_invitation(
    invitation_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Reject entity organization invitation

    This endpoint:
    1. Validates invitation is in pending status
    2. Updates invitation status to REJECTED
    3. Logs the status change to the audit log
    4. Returns the updated invitation details
    """
    try:
        invitation = await get_record_or_404(
            session, EntityOrganizationInvitation, invitation_id, "Entity organization invitation"
        )

        if invitation.status != InvitationStatus.PENDING.value:
            raise HTTPException(status_code=409, detail="Invitation is not in pending status")

        org_id = await get_user_organization_id(user.id, session)

        await update_with_audit(
            db=session,
            item=invitation,
            table_name="entity_organization_invitations",
            payload={"status": InvitationStatus.REJECTED.value},
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(invitation)

        return EntityOrganizationInvitationResponse(
            success=True,
            data=EntityOrganizationInvitationSchema.model_validate(invitation)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reject invitation: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{invitation_id}")
async def delete_entity_organization_invitation(
    invitation_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete entity organization invitation - requires ADMIN permission on entity

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        invitation = await get_record_or_404(
            session, EntityOrganizationInvitation, invitation_id, "Entity organization invitation"
        )

        # Check entity access
        entity_access = await get_entity_access(user.id, invitation.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need ADMIN or OWNER role to manage entity organization invitations")

        org_id = await get_user_organization_id(user.id, session)

        await soft_delete_with_audit(
            db=session,
            item=invitation,
            table_name="entity_organization_invitations",
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "Entity organization invitation has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete entity organization invitation: {str(e)}")
