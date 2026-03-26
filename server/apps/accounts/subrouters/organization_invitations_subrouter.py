from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import logging

from ..models import Organization, OrganizationMember, OrganizationInvitation, User
from ..schemas.organization_invitation_schemas import (
    OrganizationInvitationCreate,
    OrganizationInvitationDetail,
    MessageResponse,
    OrganizationInvitationStatus,
    OrganizationInvitationRole
)
from ..utils.auth_utils import get_current_user
from ..utils.dependency_utils import require_organization_role
from ..utils.audit_utils import log_audit
from core.db import get_session

logger = logging.getLogger(__name__)

# ==========================================
# Invitations Router
# ==========================================

router = APIRouter(tags=["Invitations"])


@router.post("/", response_model=MessageResponse)
async def invite_user(
    data: OrganizationInvitationCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Invite a user to join an organization
    
    This endpoint:
    1. Checks if the user has permission to invite users
    2. Creates an invitation
    3. Returns a success message
    """
    # Check if organization exists
    result = await session.execute(
        select(Organization).filter(Organization.id == data.organization_id)
    )
    organization = result.scalar_one_or_none()
    
    if not organization:
        return MessageResponse(
            success=False, 
            error="Organization not found"
        )
    
    # Check if user is a member with admin/owner role
    result = await session.execute(
        select(OrganizationMember).filter(
            OrganizationMember.user_id == user.id,
            OrganizationMember.organization_id == organization.id
        )
    )
    member = result.scalar_one_or_none()
    
    if not member:
        return MessageResponse(
            success=False, 
            error="You are not a member of this organization"
        )
        
    if member.role not in ["ADMIN", "OWNER"]:
        return MessageResponse(
            success=False, 
            error="You don't have permission to invite users to this organization"
        )
    
    # Check if user email is already a member
    result = await session.execute(
        select(User).filter(User.email == data.email)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        result = await session.execute(
            select(OrganizationMember).filter(
                OrganizationMember.user_id == existing_user.id,
                OrganizationMember.organization_id == organization.id
            )
        )
        existing_membership = result.scalar_one_or_none()
        
        if existing_membership:
            return MessageResponse(
                success=False, 
                error=f"User {data.email} is already a member of this organization"
            )
    
    # Check if there's already a pending invitation
    result = await session.execute(
        select(OrganizationInvitation).filter(
            OrganizationInvitation.email == data.email,
            OrganizationInvitation.organization_id == organization.id,
            OrganizationInvitation.status == OrganizationInvitationStatus.PENDING.value
        )
    )
    existing_invitation = result.scalar_one_or_none()

    if existing_invitation:
        return MessageResponse(
            success=True,
            message=f"Invitation to {data.email} already exists"
        )

    # Create invitation
    invitation = OrganizationInvitation(
        email=data.email,
        organization_id=organization.id,
        role=data.role,
        invited_by_id=user.id
    )
    session.add(invitation)

    # Log audit
    await log_audit(
        organization=organization,
        user=user,
        action=f"Invited {data.email} to join organization with {data.role} role",
        session=session
    )

    await session.commit()

    # TODO: Send invitation email
    logger.info(f"Invitation created for {data.email} to join {organization.name}")
    
    return MessageResponse(
        success=True, 
        message=f"Invitation sent to {data.email}"
    )


@router.get("/organization/{organization_id}", response_model=List[OrganizationInvitationDetail])
async def list_invitations(
    organization_id: int,
    user: User = Depends(get_current_user),
    organization: Organization = Depends(require_organization_role(["ADMIN", "OWNER"])),
    session: AsyncSession = Depends(get_session)
):
    """
    List all pending invitations for an organization
    
    This endpoint:
    1. Checks if the user has permission to view the organization
    2. Returns a list of all invitations for the organization
    """
    result = await session.execute(
        select(OrganizationInvitation).filter(OrganizationInvitation.organization_id == organization.id)
    )
    invitations = result.scalars().all()
    
    return [
        OrganizationInvitationDetail(
            id=inv.id,
            email=inv.email,
            organization_id=organization.id,
            organization_name=organization.name,
            role=inv.role,
            status=inv.status,
            created_at=inv.invited_at.isoformat() if inv.invited_at else None
        )
        for inv in invitations
    ]


@router.get("/my-invitations", response_model=List[OrganizationInvitationDetail])
async def list_my_invitations(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List all pending invitations for the current user
    
    This endpoint:
    1. Returns a list of all pending invitations for the current user's email
    """
    result = await session.execute(
        select(OrganizationInvitation)
        .options(selectinload(OrganizationInvitation.organization))
        .filter(
            OrganizationInvitation.email == user.email,
            OrganizationInvitation.status == OrganizationInvitationStatus.PENDING.value
        )
    )
    invitations = result.scalars().all()
    
    return [
        OrganizationInvitationDetail(
            id=inv.id,
            email=inv.email,
            organization_id=inv.organization.id,
            organization_name=inv.organization.name,
            role=inv.role,
            status=inv.status,
            created_at=inv.invited_at.isoformat() if inv.invited_at else None
        )
        for inv in invitations
    ]


@router.post("/{invitation_id}/accept", response_model=MessageResponse)
async def accept_invitation(
    invitation_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Accept an invitation to join an organization
    
    This endpoint:
    1. Checks if the invitation exists and is pending
    2. Adds the user to the organization
    3. Updates the invitation status
    4. Returns a success message
    """
    # Get invitation
    result = await session.execute(
        select(OrganizationInvitation)
        .options(selectinload(OrganizationInvitation.organization))
        .filter(
            OrganizationInvitation.id == invitation_id,
            OrganizationInvitation.status == OrganizationInvitationStatus.PENDING.value
        )
    )
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        return MessageResponse(
            success=False, 
            error="Invitation not found or already processed"
        )
    
    # Check if invitation is for this user
    if invitation.email.lower() != user.email.lower():
        return MessageResponse(
            success=False, 
            error="This invitation is not for you"
        )
    
    # Check if already a member
    result = await session.execute(
        select(OrganizationMember).filter(
            OrganizationMember.user_id == user.id,
            OrganizationMember.organization_id == invitation.organization.id
        )
    )
    existing_member = result.scalar_one_or_none()
    
    if existing_member:
        # Mark invitation as rejected
        invitation.status = OrganizationInvitationStatus.REJECTED.value
        await session.commit()
        
        return MessageResponse(
            success=False, 
            error=f"You are already a member of {invitation.organization.name}"
        )
    
    # Add user to organization
    membership = OrganizationMember(
        user_id=user.id,
        organization_id=invitation.organization.id,
        role=invitation.role
    )
    session.add(membership)
    
    # Update invitation status
    invitation.status = OrganizationInvitationStatus.ACCEPTED.value

    # Log audit
    await log_audit(
        organization=invitation.organization,
        user=user,
        action=f"Joined organization as {invitation.role}",
        session=session
    )

    await session.commit()

    return MessageResponse(
        success=True,
        message=f"You have joined {invitation.organization.name} as a {invitation.role}"
    )


@router.post("/{invitation_id}/reject", response_model=MessageResponse)
async def reject_invitation(
    invitation_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Reject an invitation to join an organization
    
    This endpoint:
    1. Checks if the invitation exists and is pending
    2. Updates the invitation status
    3. Returns a success message
    """
    # Get invitation
    result = await session.execute(
        select(OrganizationInvitation)
        .options(selectinload(OrganizationInvitation.organization))
        .filter(
            OrganizationInvitation.id == invitation_id,
            OrganizationInvitation.status == OrganizationInvitationStatus.PENDING.value
        )
    )
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        return MessageResponse(
            success=False, 
            error="Invitation not found or already processed"
        )
    
    # Check if invitation is for this user
    if invitation.email.lower() != user.email.lower():
        return MessageResponse(
            success=False, 
            error="This invitation is not for you"
        )
    
    # Update invitation status
    invitation.status = OrganizationInvitationStatus.REJECTED.value
    await session.commit()

    return MessageResponse(
        success=True,
        message=f"You have rejected the invitation to join {invitation.organization.name}"
    )


@router.delete("/{invitation_id}", response_model=MessageResponse)
async def cancel_invitation(
    invitation_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Cancel a pending invitation
    
    This endpoint:
    1. Checks if the invitation exists and is pending
    2. Checks if the user has permission to cancel the invitation
    3. Updates the invitation status
    4. Returns a success message
    """
    # Get invitation
    result = await session.execute(
        select(OrganizationInvitation)
        .options(selectinload(OrganizationInvitation.organization))
        .filter(
            OrganizationInvitation.id == invitation_id,
            OrganizationInvitation.status == OrganizationInvitationStatus.PENDING.value
        )
    )
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        return MessageResponse(
            success=False, 
            error="Invitation not found or already processed"
        )
    
    # Check if user has permission to cancel
    is_inviter = invitation.invited_by_id == user.id
    
    if not is_inviter:
        # Check if user is organization admin/owner
        result = await session.execute(
            select(OrganizationMember).filter(
                OrganizationMember.user_id == user.id,
                OrganizationMember.organization_id == invitation.organization.id,
                OrganizationMember.role.in_([OrganizationInvitationRole.ADMIN.value, OrganizationInvitationRole.OWNER.value])
            )
        )
        membership = result.scalar_one_or_none()
        
        if not membership:
            return MessageResponse(
                success=False, 
                error="You do not have permission to cancel this invitation"
            )
    
    # Update invitation status
    invitation.status = OrganizationInvitationStatus.CANCELLED.value

    # Log audit
    await log_audit(
        organization=invitation.organization,
        user=user,
        action=f"Cancelled invitation for {invitation.email}",
        session=session
    )

    await session.commit()

    return MessageResponse(
        success=True,
        message=f"Invitation to {invitation.email} has been cancelled"
    )