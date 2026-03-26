from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from django.db import transaction
from typing import List, Optional, Dict, Any

from ..models import User, OrganizationMember
from ..utils.auth_utils import AuthBearer
from ..utils.decorators_utils import organization_role_required
from ..utils.activity_utils import log_activity

# ==========================================
# Organization Member Schemas
# ==========================================

class MemberCreate(Schema):
    """Schema for adding a member to an organization"""
    user_id: int
    role: str = "VIEWER"


class MemberUpdate(Schema):
    """Schema for updating a member's role"""
    role: str


class MemberDetail(Schema):
    """Schema for member details"""
    id: int
    user_id: int
    email: str
    name: Optional[str]
    role: str


class MessageResponse(Schema):
    """Simple message response"""
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None


# ==========================================
# Organization Members Router
# ==========================================

router = Router(auth=AuthBearer(), tags=["Organization Members"])


@router.get("/{organization_id}/members", response=List[MemberDetail])
@organization_role_required(["VIEWER", "EDITOR", "ADMIN", "OWNER"])
def list_members(request: HttpRequest, organization_id: int):
    """
    List all members of an organization
    
    This endpoint:
    1. Checks if the user has permission to view the organization
    2. Returns a list of all members with their roles
    """
    organization = request.organization
    
    members = OrganizationMember.objects.filter(
        organization=organization
    ).select_related("user")
    
    return [
        {
            "id": m.id,
            "user_id": m.user.id,
            "email": m.user.email,
            "name": m.user.name,
            "role": m.role
        }
        for m in members
    ]


@router.get("/{organization_id}/members/{member_id}", response=MemberDetail)
@organization_role_required(["VIEWER", "EDITOR", "ADMIN", "OWNER"])
def get_member(request: HttpRequest, organization_id: int, member_id: int):
    """
    Get details for a specific organization member
    
    This endpoint:
    1. Checks if the user has permission to view the organization
    2. Returns the member details
    """
    organization = request.organization
    
    try:
        member = OrganizationMember.objects.select_related("user").get(
            id=member_id,
            organization=organization
        )
        
        return {
            "id": member.id,
            "user_id": member.user.id,
            "email": member.user.email,
            "name": member.user.name,
            "role": member.role
        }
    except OrganizationMember.DoesNotExist:
        raise HttpError(404, "Member not found in this organization")


@router.post("/{organization_id}/members", response=MemberDetail)
@organization_role_required(["ADMIN", "OWNER"])
def add_member(request: HttpRequest, organization_id: int, data: MemberCreate):
    """
    Add a new member to the organization
    
    This endpoint:
    1. Checks if the user has permission to manage members
    2. Adds the specified user to the organization
    3. Returns the new member details
    """
    organization = request.organization
    
    # Check if user exists
    try:
        user = User.objects.get(id=data.user_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")
    
    # Check if user is already a member
    if OrganizationMember.objects.filter(user=user, organization=organization).exists():
        raise HttpError(400, f"User {user.email} is already a member of this organization")
    
    # Create membership
    member = OrganizationMember.objects.create(
        user=user,
        organization=organization,
        role=data.role
    )
    
    # Log activity
    log_activity(
        organization=organization,
        user=request.user,
        action=f"Added {user.email} to organization with {data.role} role"
    )
    
    return {
        "id": member.id,
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "role": member.role
    }


@router.put("/{organization_id}/members/{member_id}", response=MemberDetail)
@organization_role_required(["ADMIN", "OWNER"])
def update_member(request: HttpRequest, organization_id: int, member_id: int, data: MemberUpdate):
    """
    Update a member's role in the organization
    
    This endpoint:
    1. Checks if the user has permission to manage members
    2. Updates the member's role
    3. Returns the updated member details
    """
    organization = request.organization
    
    try:
        # Find the membership to update
        member = OrganizationMember.objects.select_related("user").get(
            id=member_id,
            organization=organization
        )
        
        # Don't allow changing the owner's role if there's only one owner
        if member.role == "OWNER" and data.role != "OWNER":
            owner_count = OrganizationMember.objects.filter(
                organization=organization,
                role="OWNER"
            ).count()
            
            if owner_count <= 1:
                raise HttpError(400, "Cannot change the role of the only owner")
        
        # Don't allow non-owners to modify other owners
        requester_is_owner = OrganizationMember.objects.get(
            user=request.user,
            organization=organization
        ).role == "OWNER"
        
        if member.role == "OWNER" and not requester_is_owner:
            raise HttpError(403, "Only owners can modify other owners")
            
        # Update the role
        original_role = member.role
        member.role = data.role
        member.save()
        
        # Log activity
        log_activity(
            organization=organization,
            user=request.user,
            action=f"Changed {member.user.email}'s role from {original_role} to {data.role}"
        )
        
        return {
            "id": member.id,
            "user_id": member.user.id,
            "email": member.user.email,
            "name": member.user.name,
            "role": member.role
        }
    except OrganizationMember.DoesNotExist:
        raise HttpError(404, "Member not found in this organization")


@router.delete("/{organization_id}/members/{member_id}", response=MessageResponse)
@organization_role_required(["ADMIN", "OWNER"])
def remove_member(request: HttpRequest, organization_id: int, member_id: int):
    """
    Remove a member from the organization
    
    This endpoint:
    1. Checks if the user has permission to manage members
    2. Removes the member from the organization
    3. Returns a success message
    """
    organization = request.organization
    
    try:
        # Find the membership to remove
        member = OrganizationMember.objects.select_related("user").get(
            id=member_id,
            organization=organization
        )
        
        # Don't allow removing the only owner
        if member.role == "OWNER":
            owner_count = OrganizationMember.objects.filter(
                organization=organization,
                role="OWNER"
            ).count()
            
            if owner_count <= 1:
                raise HttpError(400, "Cannot remove the only owner of the organization")
            
            # Don't allow non-owners to remove owners
            requester_is_owner = OrganizationMember.objects.get(
                user=request.user,
                organization=organization
            ).role == "OWNER"
            
            if not requester_is_owner:
                raise HttpError(403, "Only owners can remove other owners")
        
        # Don't allow self-removal for the last owner
        if member.user.id == request.user.id and member.role == "OWNER":
            owner_count = OrganizationMember.objects.filter(
                organization=organization,
                role="OWNER"
            ).count()
            
            if owner_count <= 1:
                raise HttpError(400, "As the only owner, you cannot remove yourself. Transfer ownership first.")
        
        # Remove the membership
        email = member.user.email
        member.delete()
        
        # Log activity
        log_activity(
            organization=organization,
            user=request.user,
            action=f"Removed {email} from organization"
        )
        
        return {
            "success": True,
            "message": f"Member {email} removed from organization"
        }
    except OrganizationMember.DoesNotExist:
        raise HttpError(404, "Member not found in this organization")