"""
EntityOrganizationInvitation Subrouter

FastAPI router for EntityOrganizationInvitation model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.entity_models import Entity, EntityOrganizationInvitation, EntityOrganizationMember
from ...schemas.entity_schemas.entity_organization_invitation_schemas import (
    EntityOrganizationInvitation as EntityOrganizationInvitationSchema,
    CreateEntityOrganizationInvitation, UpdateEntityOrganizationInvitation,
    RequestEntityAccess,
    EntityOrganizationInvitationResponse, EntityOrganizationInvitationsResponse,
    InvitationStatus, InvitationType
)
from ...utils.dependency_utils import get_entity_access, require_write_access, check_entity_subscription
from ...utils.filtering_utils import get_user_entity_ids, apply_soft_delete_filter
from ...utils.crud_utils import (
    get_record_or_404,
    check_duplicate,
    create_with_audit,
    update_with_audit,
    soft_delete_with_audit,
)
from apps.accounts.utils.auth_utils import get_current_user
from apps.accounts.models import User, OrganizationMember

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
        # Get entities user has access to (entity admin side)
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        # Get ALL user's organization IDs (invited org side)
        # Why: user can be member of multiple orgs — need to see incoming
        # invitations for ALL of them, not just one (get_user_organization_id
        # returns only the first org due to LIMIT 1)
        user_org_result = await session.execute(
            select(OrganizationMember.organization_id).filter(
                OrganizationMember.user_id == user.id
            )
        )
        user_org_ids = user_org_result.scalars().all()

        # Build query: invitations where user has entity access OR is from invited org
        from sqlalchemy import or_

        conditions = []
        if accessible_entity_ids:
            conditions.append(EntityOrganizationInvitation.entity_id.in_(accessible_entity_ids))
        if user_org_ids:
            conditions.append(EntityOrganizationInvitation.organization_id.in_(user_org_ids))

        if not conditions:
            return EntityOrganizationInvitationsResponse(success=True, data=[])

        query = select(EntityOrganizationInvitation).filter(or_(*conditions))
        query = apply_soft_delete_filter(query, EntityOrganizationInvitation)

        # Apply filters
        if entity_id:
            # Allow if user has entity access OR invitation is for user's org
            if entity_id not in (accessible_entity_ids or []):
                # Not an entity admin — check if filtering for their own org's invitations
                if not user_org_ids:
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

        # Auth: entity access OR member of the invited organization
        # Why: invited org needs to view invitation details to decide accept/reject,
        # but they don't have entity access yet
        entity_access = await get_entity_access(user.id, invitation.entity_id, session)
        org_member = await session.scalar(
            select(OrganizationMember).filter(
                OrganizationMember.user_id == user.id,
                OrganizationMember.organization_id == invitation.organization_id
            )
        )
        if not entity_access and not org_member:
            raise HTTPException(status_code=403, detail="You do not have access to this invitation")

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
        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, data.entity_id, session, ['ADMIN', 'OWNER'])

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

        payload = data.model_dump()
        payload["status"] = InvitationStatus.PENDING.value
        # Server-side override: always set invited_by_id from authenticated user
        # Why: client-provided invited_by_id can be spoofed, breaking audit trail
        # and bypassing self-acceptance guard (invited_by_id == user.id)
        payload["invited_by_id"] = user.id
        # Explicit type: forward invitation (entity admin invites an organization)
        payload["invitation_type"] = InvitationType.INVITE.value
        invitation = await create_with_audit(
            db=session,
            model=EntityOrganizationInvitation,
            table_name="entity_organization_invitations",
            payload=payload,
            user_id=user.id,
            organization_id=entity_access.organization_id,
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
# Request Access Operations (Claim Flow — reverse direction)
# ==========================================

@router.post("/request-access", response_model=EntityOrganizationInvitationResponse)
async def request_entity_access(
    data: RequestEntityAccess,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Request access to a discoverable entity (claim flow — reverse direction).

    Unlike create_entity_organization_invitation (which requires ADMIN+ on entity),
    this endpoint allows any authenticated user to REQUEST access to an entity
    that has is_discoverable=true. The entity owner then approves or rejects.

    This endpoint:
    1. Verifies entity exists and is_discoverable = true
    2. Verifies user belongs to the requesting organization
    3. Checks for duplicate pending requests
    4. Creates EntityOrganizationInvitation with status=PENDING, role=VIEWER
    5. Returns the created invitation
    """
    try:
        # Verify entity exists and is discoverable
        entity = await session.get(Entity, data.entity_id)
        if not entity or entity.deleted_at is not None:
            raise HTTPException(status_code=404, detail="Entity not found")

        if not entity.is_discoverable:
            raise HTTPException(status_code=403, detail="Entity is not discoverable")

        # Verify user belongs to the requesting organization
        org_member = await session.scalar(
            select(OrganizationMember).filter(
                OrganizationMember.user_id == user.id,
                OrganizationMember.organization_id == data.organization_id
            )
        )
        if not org_member:
            raise HTTPException(status_code=403, detail="You are not a member of this organization")

        # Check if organization is already a member of this entity
        existing_member_query = select(EntityOrganizationMember).filter(
            EntityOrganizationMember.entity_id == data.entity_id,
            EntityOrganizationMember.organization_id == data.organization_id,
        )
        existing_member_query = apply_soft_delete_filter(existing_member_query, EntityOrganizationMember)
        existing_member = await session.scalar(existing_member_query)
        if existing_member:
            raise HTTPException(status_code=409, detail="Organization already has access to this entity")

        # Check for duplicate pending request
        await check_duplicate(
            db=session,
            model=EntityOrganizationInvitation,
            filters={
                "entity_id": data.entity_id,
                "organization_id": data.organization_id,
                "status": InvitationStatus.PENDING.value,
            },
            entity_label="Access request",
        )

        # User requests access on behalf of data.organization_id (already verified above)
        payload = {
            "entity_id": data.entity_id,
            "organization_id": data.organization_id,
            "role": "VIEWER",
            "invitation_type": InvitationType.REQUEST.value,
            "status": InvitationStatus.PENDING.value,
            "invited_by_id": user.id,
        }

        invitation = await create_with_audit(
            db=session,
            model=EntityOrganizationInvitation,
            table_name="entity_organization_invitations",
            payload=payload,
            user_id=user.id,
            organization_id=data.organization_id,
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
        raise HTTPException(status_code=500, detail=f"Failed to request entity access: {str(e)}")

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

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, invitation.entity_id, session, ['ADMIN', 'OWNER'])

        await update_with_audit(
            db=session,
            item=invitation,
            table_name="entity_organization_invitations",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=entity_access.organization_id,
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

        # ── Direction-aware auth for accept ──
        #
        # WHY: EntityOrganizationInvitation is used bidirectionally:
        #   - invitation_type='invite': entity admin invited an org → invited org member should accept
        #   - invitation_type='request': org requested entity access → entity admin should accept
        #
        # SELF-ACCEPTANCE GUARD: the person who created the invitation cannot accept it.
        # This prevents the edge case where a user belongs to both organizations.

        # Guard: the person who created/requested the invitation cannot accept it
        if invitation.invited_by_id == user.id:
            raise HTTPException(status_code=403, detail="Cannot accept your own invitation")

        if invitation.invitation_type == InvitationType.REQUEST.value:
            # Reverse request (org requested access) → only entity admin (ADMIN/OWNER) can accept
            entity_access = await get_entity_access(user.id, invitation.entity_id, session)
            if not entity_access or entity_access.role not in ['ADMIN', 'OWNER']:
                raise HTTPException(status_code=403, detail="Only entity admin can accept access requests")
        else:
            # Forward invitation (entity admin invited org) → only invited org member can accept
            org_member = await session.scalar(
                select(OrganizationMember).filter(
                    OrganizationMember.user_id == user.id,
                    OrganizationMember.organization_id == invitation.organization_id
                )
            )
            if not org_member:
                raise HTTPException(status_code=403, detail="Only members of the invited organization can accept this invitation")

        # Subscription check: entity owner org must have active subscription for writes
        await check_entity_subscription(invitation.entity_id, session)

        # Direction-aware org for audit trail
        if invitation.invitation_type == InvitationType.REQUEST.value:
            # Entity admin accepting a request → org through which they access the entity
            org_id = entity_access.organization_id
        else:
            # Invited org member accepting → they act on behalf of the invited org
            org_id = invitation.organization_id

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

        # ── Direction-aware auth for reject ──
        # (Same logic as accept — see comments in accept_entity_organization_invitation)

        # Guard: the person who created/requested the invitation cannot reject it
        if invitation.invited_by_id == user.id:
            raise HTTPException(status_code=403, detail="Cannot reject your own invitation")

        if invitation.invitation_type == InvitationType.REQUEST.value:
            # Reverse request (org requested access) → only entity admin (ADMIN/OWNER) can reject
            entity_access = await get_entity_access(user.id, invitation.entity_id, session)
            if not entity_access or entity_access.role not in ['ADMIN', 'OWNER']:
                raise HTTPException(status_code=403, detail="Only entity admin can reject access requests")
        else:
            # Forward invitation (entity admin invited org) → only invited org member can reject
            org_member = await session.scalar(
                select(OrganizationMember).filter(
                    OrganizationMember.user_id == user.id,
                    OrganizationMember.organization_id == invitation.organization_id
                )
            )
            if not org_member:
                raise HTTPException(status_code=403, detail="Only members of the invited organization can reject this invitation")

        # Subscription check: entity owner org must have active subscription for writes
        await check_entity_subscription(invitation.entity_id, session)

        # Direction-aware org for audit trail
        if invitation.invitation_type == InvitationType.REQUEST.value:
            # Entity admin rejecting a request → org through which they access the entity
            org_id = entity_access.organization_id
        else:
            # Invited org member rejecting → they act on behalf of the invited org
            org_id = invitation.organization_id

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

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, invitation.entity_id, session, ['ADMIN', 'OWNER'])

        await soft_delete_with_audit(
            db=session,
            item=invitation,
            table_name="entity_organization_invitations",
            user_id=user.id,
            organization_id=entity_access.organization_id,
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
