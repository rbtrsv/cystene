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
    
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class CreateEntityOrganizationInvitation(BaseModel):
    """Schema for creating a new entity organization invitation"""
    entity_id: int = Field(description="Entity ID")
    organization_id: int = Field(description="Organization ID")
    role: EntityRole = Field(default=EntityRole.VIEWER, description="Role to be assigned")
    invited_by_id: int = Field(description="User ID who is sending the invitation")

class UpdateEntityOrganizationInvitation(BaseModel):
    """Schema for updating an entity organization invitation"""
    role: EntityRole | None = Field(None, description="Role to be assigned")
    status: InvitationStatus | None = Field(None, description="Invitation status")

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