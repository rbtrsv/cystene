"""
Entity Schemas

Pydantic schemas for the Entity model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from enum import Enum

# ==========================================
# Enums
# ==========================================

class EntityType(str, Enum):
    """Entity type options"""
    FUND = "fund"
    COMPANY = "company"
    INDIVIDUAL = "individual"
    SYNDICATE = "syndicate"

class EntityRole(str, Enum):
    """Entity organization member role options"""
    OWNER = "OWNER"
    ADMIN = "ADMIN" 
    EDITOR = "EDITOR"
    VIEWER = "VIEWER"

# ==========================================
# Entity Schema (Full Representation)
# ==========================================

class Entity(BaseModel):
    """Entity schema - full representation"""
    id: int
    name: str = Field(min_length=1, max_length=255, description="Entity name")
    entity_type: EntityType = Field(description="Type of entity")
    parent_id: int | None = Field(None, description="Parent entity ID")
    organization_id: int = Field(description="Organization ID that owns this entity")
    is_discoverable: bool = Field(default=False, description="Whether entity is discoverable by other organizations")
    invite_code: str | None = Field(None, description="Invite code for private access")
    created_at: datetime
    updated_at: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class CreateEntity(BaseModel):
    """Schema for creating a new entity"""
    name: str = Field(min_length=1, max_length=255, description="Entity name")
    entity_type: EntityType = Field(description="Type of entity")
    parent_id: int | None = Field(None, description="Parent entity ID")
    organization_id: int = Field(description="Organization ID that owns this entity")
    is_discoverable: bool = Field(default=False, description="Whether entity is discoverable by other organizations")

class UpdateEntity(BaseModel):
    """Schema for updating an entity"""
    name: str | None = Field(None, min_length=1, max_length=255)
    entity_type: EntityType | None = None
    parent_id: int | None = None
    is_discoverable: bool | None = None

# ==========================================
# Response Types
# ==========================================

class EntityResponse(BaseModel):
    """Response containing a single entity"""
    success: bool
    data: Entity | None = None
    error: str | None = None

class EntitiesResponse(BaseModel):
    """Response containing multiple entities"""
    success: bool
    data: list[Entity] | None = None
    error: str | None = None

# ==========================================
# Discovery Schemas
# ==========================================

class EntityDiscoveryResult(BaseModel):
    """Minimal entity info returned by discovery search.
    Why: returns only public info (id, name, type) — no sensitive data."""
    id: int
    name: str
    entity_type: EntityType

    model_config = ConfigDict(from_attributes=True)

class EntityDiscoveryResponse(BaseModel):
    """Response containing discovery search results"""
    success: bool
    data: list[EntityDiscoveryResult] = []

# ==========================================
# Invite Code Schemas
# ==========================================

class JoinByInviteCode(BaseModel):
    """Schema for joining an entity via invite code"""
    code: str = Field(min_length=1, description="Invite code")
    organization_id: int = Field(description="Organization requesting access")