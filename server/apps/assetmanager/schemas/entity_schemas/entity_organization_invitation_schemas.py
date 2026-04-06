"""
EntityOrganizationInvitation Schemas

Pydantic schemas for the EntityOrganizationInvitation model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from enum import Enum
from .entity_schemas import EntityRole

class InvitationStatus(str, Enum):
    """Entity organization invitation status options"""
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class InvitationType(str, Enum):
    """Invitation type — explicit direction discriminator.
    'invite' = entity admin invites org (forward), 'request' = org requests entity access (reverse)."""
    INVITE = "invite"
    REQUEST = "request"

# ==========================================
# EntityOrganizationInvitation Schema (Full Representation)
# ==========================================

class EntityOrganizationInvitation(BaseModel):
    """EntityOrganizationInvitation schema - full representation"""
    id: int
    entity_id: int = Field(description="Entity ID")
    organization_id: int = Field(description="Organization ID")
    role: EntityRole = Field(default=EntityRole.VIEWER, description="Role to be assigned")
    invited_by_id: int = Field(description="User ID who sent the invitation")
    invited_at: datetime
    status: InvitationStatus = Field(default=InvitationStatus.PENDING, description="Invitation status")
    invitation_type: str = Field(default="invite", description="Type: 'invite' (entity→org) or 'request' (org→entity)")

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class CreateEntityOrganizationInvitation(BaseModel):
    """Schema for creating a new entity organization invitation"""
    entity_id: int = Field(description="Entity ID")
    organization_id: int = Field(description="Organization ID")
    role: EntityRole = Field(default=EntityRole.VIEWER, description="Role to be assigned")

class UpdateEntityOrganizationInvitation(BaseModel):
    """Schema for updating an entity organization invitation"""
    role: EntityRole | None = Field(None, description="Role to be assigned")
    status: InvitationStatus | None = Field(None, description="Invitation status")

class RequestEntityAccess(BaseModel):
    """Schema for requesting access to a discoverable entity (claim flow).
    Server sets invited_by_id from authenticated user and role defaults to VIEWER."""
    entity_id: int = Field(description="Entity ID to request access to")
    organization_id: int = Field(description="Requesting organization ID")

# ==========================================
# Response Types
# ==========================================

class EntityOrganizationInvitationResponse(BaseModel):
    """Response containing a single entity organization invitation"""
    success: bool
    data: EntityOrganizationInvitation | None = None
    error: str | None = None

class EntityOrganizationInvitationsResponse(BaseModel):
    """Response containing multiple entity organization invitations"""
    success: bool
    data: list[EntityOrganizationInvitation] | None = None
    error: str | None = None