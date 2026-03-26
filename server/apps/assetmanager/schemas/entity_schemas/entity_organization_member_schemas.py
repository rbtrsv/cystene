"""
EntityOrganizationMember Schemas

Pydantic schemas for the EntityOrganizationMember model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from .entity_schemas import EntityRole

# ==========================================
# EntityOrganizationMember Schema (Full Representation)
# ==========================================

class EntityOrganizationMember(BaseModel):
    """EntityOrganizationMember schema - full representation"""
    id: int
    organization_id: int = Field(description="Organization ID")
    entity_id: int = Field(description="Entity ID")
    role: EntityRole = Field(default=EntityRole.VIEWER, description="Role for entity access")
    joined_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class CreateEntityOrganizationMember(BaseModel):
    """Schema for creating a new entity organization member"""
    organization_id: int = Field(description="Organization ID")
    entity_id: int = Field(description="Entity ID")
    role: EntityRole = Field(default=EntityRole.VIEWER, description="Role for entity access")

class UpdateEntityOrganizationMember(BaseModel):
    """Schema for updating an entity organization member"""
    role: EntityRole | None = Field(None, description="Role for entity access")

# ==========================================
# Response Types
# ==========================================

class EntityOrganizationMemberResponse(BaseModel):
    """Response containing a single entity organization member"""
    success: bool
    data: EntityOrganizationMember | None = None
    error: str | None = None

class EntityOrganizationMembersResponse(BaseModel):
    """Response containing multiple entity organization members"""
    success: bool
    data: list[EntityOrganizationMember] | None = None
    error: str | None = None