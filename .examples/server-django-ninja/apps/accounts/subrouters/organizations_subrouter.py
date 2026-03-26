from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from django.db import transaction
from typing import List, Optional, Dict, Any

from ..models import User, Organization, OrganizationMember
from ..utils.auth_utils import AuthBearer
from ..utils.decorators_utils import organization_role_required
from ..utils.activity_utils import log_activity

# ==========================================
# Organization Schemas
# ==========================================

class OrganizationCreate(Schema):
    """Schema for creating a new organization"""
    name: str


class OrganizationUpdate(Schema):
    """Schema for updating an organization"""
    name: str


class OrganizationDetail(Schema):
    """Schema for organization details"""
    id: int
    name: str
    role: str
    
    class Config:
        from_attributes = True


class OrganizationResponse(Schema):
    """Response schema for organization operations"""
    success: bool
    data: Optional[OrganizationDetail] = None
    error: Optional[str] = None


class MessageResponse(Schema):
    """Simple message response"""
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None


# ==========================================
# Organizations Router
# ==========================================

router = Router(auth=AuthBearer(), tags=["Organizations"])


@router.get("/", response=List[OrganizationDetail])
def list_organizations(request: HttpRequest):
    """
    List all organizations where the current user is a member
    
    This endpoint:
    1. Finds all organizations where the user is a member
    2. Returns the list with the user's role in each organization
    """
    if not hasattr(request, 'user') or not request.user:
        raise HttpError(401, "Authentication required")
    
    try:
        # Get user ID from request
        user_id = request.user.id
        
        # Get memberships for the user by ID
        memberships = OrganizationMember.objects.filter(
            user_id=user_id
        ).select_related("organization")
        
        # Return organization details
        return [
            {
                "id": m.organization.id,
                "name": m.organization.name,
                "role": m.role
            }
            for m in memberships
        ]
    except Exception as e:
        print(f"Error in list_organizations: {str(e)}")
        raise HttpError(500, "An error occurred while retrieving organizations")


@router.get("/{organization_id}", response=OrganizationDetail)
@organization_role_required(["VIEWER", "EDITOR", "ADMIN", "OWNER"])
def get_organization(request: HttpRequest, organization_id: int):
    """
    Get details for a specific organization
    
    This endpoint:
    1. Checks if the user has permission to view the organization
    2. Returns the organization details
    """
    organization = request.organization
    user_id = request.user.id
    membership = OrganizationMember.objects.get(organization=organization, user_id=user_id)
    
    return {
        "id": organization.id,
        "name": organization.name,
        "role": membership.role
    }


@router.post("/", response=OrganizationDetail)
def create_organization(request: HttpRequest, data: OrganizationCreate):
    """
    Create a new organization and add current user as owner
    
    This endpoint:
    1. Creates a new organization with the provided name
    2. Adds the current user as the owner
    3. Returns the new organization details
    """
    if not hasattr(request, 'user') or not request.user:
        raise HttpError(401, "Authentication required")
    
    try:
        # Get user ID from request
        user_id = request.user.id
        user = User.objects.get(id=user_id)
        
        with transaction.atomic():
            # Create organization
            organization = Organization.objects.create(name=data.name)
            
            # Add user as owner
            membership = OrganizationMember.objects.create(
                user=user,
                organization=organization,
                role="OWNER"
            )
            
            # Log activity
            log_activity(
                organization=organization,
                user=user,
                action=f"Created organization: {organization.name}"
            )
        
        return {
            "id": organization.id,
            "name": organization.name,
            "role": membership.role
        }
    except Exception as e:
        print(f"Error in create_organization: {str(e)}")
        raise HttpError(500, "An error occurred while creating the organization")


@router.put("/{organization_id}", response=OrganizationDetail)
@organization_role_required(["ADMIN", "OWNER"])
def update_organization(request: HttpRequest, organization_id: int, data: OrganizationUpdate):
    """
    Update an organization's details
    
    This endpoint:
    1. Checks if the user has permission to update the organization
    2. Updates the organization name
    3. Returns the updated organization details
    """
    organization = request.organization
    user_id = request.user.id
    user = User.objects.get(id=user_id)
    membership = OrganizationMember.objects.get(organization=organization, user_id=user_id)
    
    # Update organization
    original_name = organization.name
    organization.name = data.name
    organization.save()
    
    # Log activity
    log_activity(
        organization=organization,
        user=user,
        action=f"Updated organization name from '{original_name}' to '{organization.name}'"
    )
    
    return {
        "id": organization.id,
        "name": organization.name,
        "role": membership.role
    }


@router.delete("/{organization_id}", response=MessageResponse)
@organization_role_required("OWNER")
def delete_organization(request: HttpRequest, organization_id: int):
    """
    Delete an organization (owner only)
    
    This endpoint:
    1. Checks if the user has permission to delete the organization
    2. Deletes the organization
    3. Returns a success message
    """
    organization = request.organization
    organization_name = organization.name
    
    # Delete organization (will cascade to members, etc.)
    organization.delete()
    
    return {
        "success": True,
        "message": f"Organization '{organization_name}' has been deleted"
    }


@router.get("/{organization_id}/role", response=Dict[str, Any])
@organization_role_required(['VIEWER', 'EDITOR', 'ADMIN', 'OWNER'])
def get_user_role(request: HttpRequest, organization_id: int):
    """
    Get the current user's role in an organization
    
    This endpoint:
    1. Returns the user's role in the organization
    """
    user_id = request.user.id
    membership = OrganizationMember.objects.get(
        user_id=user_id,
        organization_id=organization_id
    )
    
    return {
        "success": True,
        "role": membership.role
    }
