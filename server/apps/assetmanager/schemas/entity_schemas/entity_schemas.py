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
    current_valuation: float | None = Field(None, description="Current valuation")
    organization_id: int = Field(description="Organization ID that owns this entity")
    cash_balance: float = Field(default=0, description="Cash balance")
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
    current_valuation: float | None = Field(None, description="Current valuation")
    organization_id: int = Field(description="Organization ID that owns this entity")
    cash_balance: float = Field(default=0, description="Cash balance")

class UpdateEntity(BaseModel):
    """Schema for updating an entity"""
    name: str | None = Field(None, min_length=1, max_length=255)
    entity_type: EntityType | None = None
    parent_id: int | None = None
    current_valuation: float | None = None
    cash_balance: float | None = None

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