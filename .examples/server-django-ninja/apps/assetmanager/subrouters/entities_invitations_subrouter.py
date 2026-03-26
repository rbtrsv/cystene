from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from django.db import transaction
from typing import List, Optional, Dict, Any
import logging

from ..models import Entity, EntityOrganizationInvitation, EntityOrganizationMember
from apps.accounts.models import Organization, User, OrganizationMember
from apps.accounts.utils.auth_utils import AuthBearer
from ..utils.entity_decorators_utils import entity_role_required, entity_subscription_required

logger = logging.getLogger(__name__)

# ==========================================
# Entity Invitation Schemas
# ==========================================

class EntityInvitationCreate(Schema):
    """Schema for creating an entity invitation"""
    organization_id: int
    role: str = "VIEWER"


class EntityInvitationDetail(Schema):
    """Schema for entity invitation details"""
    id: int
    entity_id: int
    entity_name: str
    organization_id: int
    organization_name: str
    role: str
    status: str
    invited_at: Optional[str] = None
    
    class Config:
        from_attributes = True


class MessageResponse(Schema):
    """Simple message response"""
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None


# ==========================================
# Entity Invitations Router
# ==========================================

router = Router(tags=["Entity Invitations"])


@router.post("/{entity_id}/invitations", auth=AuthBearer(), response=MessageResponse)
@entity_role_required(["ADMIN", "OWNER"])
def invite_organization(request: HttpRequest, entity_id: int, data: EntityInvitationCreate):
    """
    Invite an organization to access an entity.
    
    This endpoint:
    1. Checks if the user has permission to invite organizations
    2. Creates an invitation
    3. Returns a success message
    
    Requires ADMIN or OWNER role on the entity.
    """
    entity = request.entity
    
    # Check if organization exists
    try:
        organization = Organization.objects.get(id=data.organization_id)
    except Organization.DoesNotExist:
        return {"success": False, "error": "Organization not found"}
    
    # Check if organization is already a member
    if EntityOrganizationMember.objects.filter(
        entity=entity,
        organization=organization
    ).exists():
        return {"success": False, "error": f"Organization {organization.name} already has access to this entity"}
    
    # Check if there's already a pending invitation
    existing_invitation = EntityOrganizationInvitation.objects.filter(
        entity=entity,
        organization=organization,
        status="PENDING"
    ).first()
    
    if existing_invitation:
        return {"success": True, "message": f"Invitation to {organization.name} already exists"}
    
    # Create invitation
    invitation = EntityOrganizationInvitation.objects.create(
        entity=entity,
        organization=organization,
        role=data.role,
        invited_by=request.user,
        status="PENDING"
    )
    
    # TODO: Send invitation notification
    logger.info(f"Invitation created for {organization.name} to access {entity.name}")
    
    return {"success": True, "message": f"Invited {organization.name} to access {entity.name}"}


@router.get("/{entity_id}/invitations", auth=AuthBearer(), response=List[EntityInvitationDetail])
@entity_role_required(["ADMIN", "OWNER"])
def list_entity_invitations(request: HttpRequest, entity_id: int):
    """
    List all invitations for an entity.
    
    This endpoint:
    1. Checks if the user has permission to view the entity
    2. Returns a list of all invitations for the entity
    
    Requires ADMIN or OWNER role on the entity.
    """
    entity = request.entity
    
    invitations = EntityOrganizationInvitation.objects.filter(
        entity=entity
    ).select_related("organization")
    
    return [
        {
            "id": inv.id,
            "entity_id": entity.id,
            "entity_name": entity.name,
            "organization_id": inv.organization.id,
            "organization_name": inv.organization.name,
            "role": inv.role,
            "status": inv.status,
            "invited_at": inv.invited_at.isoformat() if inv.invited_at else None
        }
        for inv in invitations
    ]


@router.get("/{entity_id}/invitations/{invitation_id}", auth=AuthBearer(), response=EntityInvitationDetail)
@entity_role_required(["ADMIN", "OWNER"])
def get_entity_invitation(request: HttpRequest, entity_id: int, invitation_id: int):
    """
    Get details for a specific entity invitation.
    
    This endpoint:
    1. Checks if the user has permission to view the entity
    2. Returns the invitation details
    
    Requires ADMIN or OWNER role on the entity.
    """
    entity = request.entity
    
    try:
        invitation = EntityOrganizationInvitation.objects.get(
            id=invitation_id,
            entity=entity
        ).select_related("organization")
        
        return {
            "id": invitation.id,
            "entity_id": entity.id,
            "entity_name": entity.name,
            "organization_id": invitation.organization.id,
            "organization_name": invitation.organization.name,
            "role": invitation.role,
            "status": invitation.status,
            "invited_at": invitation.invited_at.isoformat() if invitation.invited_at else None
        }
    except EntityOrganizationInvitation.DoesNotExist:
        raise HttpError(404, "Invitation not found")


@router.delete("/{entity_id}/invitations/{invitation_id}", auth=AuthBearer(), response=MessageResponse)
@entity_role_required(["ADMIN", "OWNER"])
def cancel_entity_invitation(request: HttpRequest, entity_id: int, invitation_id: int):
    """
    Cancel a pending entity invitation.
    
    This endpoint:
    1. Checks if the user has permission to manage the entity
    2. Cancels the invitation
    3. Returns a success message
    
    Requires ADMIN or OWNER role on the entity.
    """
    entity = request.entity
    
    try:
        invitation = EntityOrganizationInvitation.objects.get(
            id=invitation_id,
            entity=entity,
            status="PENDING"
        ).select_related("organization")
        
        invitation.status = "CANCELLED"
        invitation.save()
        
        return {"success": True, "message": f"Invitation to {invitation.organization.name} has been cancelled"}
    except EntityOrganizationInvitation.DoesNotExist:
        raise HttpError(404, "Invitation not found or already processed")


# Endpoints for organizations receiving invitations

@router.get("/my-organization-invitations", auth=AuthBearer(), response=List[EntityInvitationDetail])
def list_my_organization_invitations(request: HttpRequest):
    """
    List all pending invitations for organizations the user is a member of.
    
    This endpoint:
    1. Gets all organizations the user is a member of with ADMIN or OWNER role
    2. Returns all pending invitations for those organizations
    """
    # Get organizations where user is ADMIN or OWNER
    user_orgs = OrganizationMember.objects.filter(
        user=request.user,
        role__in=["ADMIN", "OWNER"]
    ).values_list("organization_id", flat=True)
    
    # Get invitations for these organizations
    invitations = EntityOrganizationInvitation.objects.filter(
        organization_id__in=user_orgs,
        status="PENDING"
    ).select_related("entity", "organization")
    
    return [
        {
            "id": inv.id,
            "entity_id": inv.entity.id,
            "entity_name": inv.entity.name,
            "organization_id": inv.organization.id,
            "organization_name": inv.organization.name,
            "role": inv.role,
            "status": inv.status,
            "invited_at": inv.invited_at.isoformat() if inv.invited_at else None
        }
        for inv in invitations
    ]


@router.post("/invitations/{invitation_id}/accept", auth=AuthBearer(), response=MessageResponse)
def accept_entity_invitation(request: HttpRequest, invitation_id: int):
    """
    Accept an entity invitation on behalf of an organization.
    
    This endpoint:
    1. Checks if the invitation exists and is pending
    2. Checks if the user has ADMIN or OWNER role in the organization
    3. Creates the entity-organization relationship
    4. Updates the invitation status
    5. Returns a success message
    """
    try:
        # Get invitation
        invitation = EntityOrganizationInvitation.objects.get(
            id=invitation_id,
            status="PENDING"
        ).select_related("entity", "organization")
        
        # Check if user has permission to accept for this organization
        org_member = OrganizationMember.objects.filter(
            user=request.user,
            organization=invitation.organization,
            role__in=["ADMIN", "OWNER"]
        ).first()
        
        if not org_member:
            return {"success": False, "error": "You don't have permission to accept invitations for this organization"}
        
        # Check if already a member
        existing_member = EntityOrganizationMember.objects.filter(
            entity=invitation.entity,
            organization=invitation.organization
        ).exists()
        
        if existing_member:
            # Mark invitation as rejected
            invitation.status = "REJECTED"
            invitation.save()
            
            return {"success": False, "error": f"Organization is already a member of {invitation.entity.name}"}
        
        # Add organization to entity
        with transaction.atomic():
            # Create membership
            EntityOrganizationMember.objects.create(
                entity=invitation.entity,
                organization=invitation.organization,
                role=invitation.role
            )
            
            # Update invitation status
            invitation.status = "ACCEPTED"
            invitation.save()
        
        return {"success": True, "message": f"Your organization now has {invitation.role} access to {invitation.entity.name}"}
        
    except EntityOrganizationInvitation.DoesNotExist:
        return {"success": False, "error": "Invitation not found or already processed"}


@router.post("/invitations/{invitation_id}/reject", auth=AuthBearer(), response=MessageResponse)
def reject_entity_invitation(request: HttpRequest, invitation_id: int):
    """
    Reject an entity invitation on behalf of an organization.
    
    This endpoint:
    1. Checks if the invitation exists and is pending
    2. Checks if the user has ADMIN or OWNER role in the organization
    3. Updates the invitation status
    4. Returns a success message
    """
    try:
        # Get invitation
        invitation = EntityOrganizationInvitation.objects.get(
            id=invitation_id,
            status="PENDING"
        ).select_related("entity", "organization")
        
        # Check if user has permission to reject for this organization
        org_member = OrganizationMember.objects.filter(
            user=request.user,
            organization=invitation.organization,
            role__in=["ADMIN", "OWNER"]
        ).first()
        
        if not org_member:
            return {"success": False, "error": "You don't have permission to reject invitations for this organization"}
        
        # Update invitation status
        invitation.status = "REJECTED"
        invitation.save()
        
        return {"success": True, "message": f"You have rejected access to {invitation.entity.name}"}
        
    except EntityOrganizationInvitation.DoesNotExist:
        return {"success": False, "error": "Invitation not found or already processed"}
