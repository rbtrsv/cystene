from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from django.db import transaction
from typing import List, Optional, Dict, Any
import logging

from ..models import Organization, OrganizationMember, Invitation, User
from ..utils.auth_utils import AuthBearer
from ..utils.decorators_utils import organization_role_required
from ..utils.activity_utils import log_activity

logger = logging.getLogger(__name__)

# ==========================================
# Invitation Schemas
# ==========================================

class InvitationCreate(Schema):
    """Schema for creating a new invitation"""
    email: str
    organization_id: int
    role: str = "VIEWER"  # Default to viewer role


class InvitationDetail(Schema):
    """Schema for invitation details"""
    id: int
    email: str
    organization_id: int
    organization_name: str
    role: str
    status: str
    created_at: Optional[str] = None


class MessageResponse(Schema):
    """Simple message response"""
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None


# ==========================================
# Invitations Router
# ==========================================

router = Router(auth=AuthBearer(), tags=["Invitations"])


@router.post("/", response=MessageResponse)
def invite_user(request: HttpRequest, data: InvitationCreate):
    """
    Invite a user to join an organization
    
    This endpoint:
    1. Checks if the user has permission to invite users
    2. Creates an invitation
    3. Returns a success message
    """
    # Check if organization exists
    try:
        organization = Organization.objects.get(id=data.organization_id)
    except Organization.DoesNotExist:
        return {"success": False, "error": "Organization not found"}
    
    # Check if user is a member with admin/owner role
    try:
        member = OrganizationMember.objects.get(
            user=request.user,
            organization=organization
        )
        if member.role not in ["ADMIN", "OWNER"]:
            return {"success": False, "error": "You don't have permission to invite users to this organization"}
    except OrganizationMember.DoesNotExist:
        return {"success": False, "error": "You are not a member of this organization"}
    
    # Check if user email is already a member
    existing_user = User.objects.filter(email=data.email).first()
    if existing_user:
        if OrganizationMember.objects.filter(
            user=existing_user,
            organization=organization
        ).exists():
            return {"success": False, "error": f"User {data.email} is already a member of this organization"}
    
    # Check if there's already a pending invitation
    existing_invitation = Invitation.objects.filter(
        email=data.email,
        organization=organization,
        status="PENDING"
    ).first()
    
    if existing_invitation:
        return {"success": True, "message": f"Invitation to {data.email} already exists"}
    
    # Create invitation
    invitation = Invitation.objects.create(
        email=data.email,
        organization=organization,
        role=data.role,
        invited_by=request.user
    )
    
    # Log the activity
    log_activity(
        organization=organization,
        user=request.user,
        action=f"Invited {data.email} to join organization with {data.role} role"
    )
    
    # TODO: Send invitation email
    logger.info(f"Invitation created for {data.email} to join {organization.name}")
    
    return {"success": True, "message": f"Invitation sent to {data.email}"}


@router.get("/organization/{organization_id}", response=List[InvitationDetail])
@organization_role_required(["ADMIN", "OWNER"])
def list_invitations(request: HttpRequest, organization_id: int):
    """
    List all pending invitations for an organization
    
    This endpoint:
    1. Checks if the user has permission to view the organization
    2. Returns a list of all invitations for the organization
    """
    organization = request.organization
    
    invitations = Invitation.objects.filter(
        organization=organization
    )
    
    return [
        {
            "id": inv.id,
            "email": inv.email,
            "organization_id": organization.id,
            "organization_name": organization.name,
            "role": inv.role,
            "status": inv.status,
            "created_at": inv.invited_at.isoformat() if inv.invited_at else None
        }
        for inv in invitations
    ]


@router.get("/my-invitations", response=List[InvitationDetail])
def list_my_invitations(request: HttpRequest):
    """
    List all pending invitations for the current user
    
    This endpoint:
    1. Returns a list of all pending invitations for the current user's email
    """
    invitations = Invitation.objects.filter(
        email=request.user.email,
        status="PENDING"
    ).select_related("organization")
    
    return [
        {
            "id": inv.id,
            "email": inv.email,
            "organization_id": inv.organization.id,
            "organization_name": inv.organization.name,
            "role": inv.role,
            "status": inv.status,
            "created_at": inv.invited_at.isoformat() if inv.invited_at else None
        }
        for inv in invitations
    ]


@router.post("/{invitation_id}/accept", response=MessageResponse)
def accept_invitation(request: HttpRequest, invitation_id: int):
    """
    Accept an invitation to join an organization
    
    This endpoint:
    1. Checks if the invitation exists and is pending
    2. Adds the user to the organization
    3. Updates the invitation status
    4. Returns a success message
    """
    try:
        # Get invitation
        invitation = Invitation.objects.select_related("organization").get(
            id=invitation_id,
            status="PENDING"
        )
        
        # Check if invitation is for this user
        if invitation.email.lower() != request.user.email.lower():
            return {"success": False, "error": "This invitation is not for you"}
        
        # Check if already a member
        existing_member = OrganizationMember.objects.filter(
            user=request.user,
            organization=invitation.organization
        ).exists()
        
        if existing_member:
            # Mark invitation as rejected
            invitation.status = "REJECTED"
            invitation.save()
            
            return {"success": False, "error": f"You are already a member of {invitation.organization.name}"}
        
        # Add user to organization
        with transaction.atomic():
            # Create membership
            OrganizationMember.objects.create(
                user=request.user,
                organization=invitation.organization,
                role=invitation.role
            )
            
            # Update invitation status
            invitation.status = "ACCEPTED"
            invitation.save()
        
        # Log the activity
        log_activity(
            organization=invitation.organization,
            user=request.user,
            action=f"Joined organization as {invitation.role}"
        )
        
        return {"success": True, "message": f"You have joined {invitation.organization.name} as a {invitation.role}"}
        
    except Invitation.DoesNotExist:
        return {"success": False, "error": "Invitation not found or already processed"}


@router.post("/{invitation_id}/reject", response=MessageResponse)
def reject_invitation(request: HttpRequest, invitation_id: int):
    """
    Reject an invitation to join an organization
    
    This endpoint:
    1. Checks if the invitation exists and is pending
    2. Updates the invitation status
    3. Returns a success message
    """
    try:
        # Get invitation
        invitation = Invitation.objects.select_related("organization").get(
            id=invitation_id,
            status="PENDING"
        )
        
        # Check if invitation is for this user
        if invitation.email.lower() != request.user.email.lower():
            return {"success": False, "error": "This invitation is not for you"}
        
        # Update invitation status
        invitation.status = "REJECTED"
        invitation.save()
        
        return {"success": True, "message": f"You have rejected the invitation to join {invitation.organization.name}"}
        
    except Invitation.DoesNotExist:
        return {"success": False, "error": "Invitation not found or already processed"}


@router.delete("/{invitation_id}", response=MessageResponse)
def cancel_invitation(request: HttpRequest, invitation_id: int):
    """
    Cancel a pending invitation
    
    This endpoint:
    1. Checks if the invitation exists and is pending
    2. Checks if the user has permission to cancel the invitation
    3. Updates the invitation status
    4. Returns a success message
    """
    try:
        # Get invitation
        invitation = Invitation.objects.select_related("organization").get(
            id=invitation_id,
            status="PENDING"
        )
        
        # Check if user has permission to cancel
        is_inviter = invitation.invited_by == request.user
        
        if not is_inviter:
            # Check if user is organization admin/owner
            membership = OrganizationMember.objects.filter(
                user=request.user,
                organization=invitation.organization,
                role__in=["ADMIN", "OWNER"]
            ).exists()
            
            if not membership:
                return {"success": False, "error": "You do not have permission to cancel this invitation"}
        
        # Update invitation status
        invitation.status = "CANCELLED"
        invitation.save()
        
        # Log the activity
        log_activity(
            organization=invitation.organization,
            user=request.user,
            action=f"Cancelled invitation for {invitation.email}"
        )
        
        return {"success": True, "message": f"Invitation to {invitation.email} has been cancelled"}
        
    except Invitation.DoesNotExist:
        return {"success": False, "error": "Invitation not found or already processed"}