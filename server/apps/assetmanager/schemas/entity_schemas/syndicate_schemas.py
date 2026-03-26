"""
Syndicate Schemas

Pydantic schemas for the Syndicate model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

# ==========================================
# Syndicate Schema (Full Representation)
# ==========================================

class Syndicate(BaseModel):
    """Syndicate schema - full representation"""
    id: int
    entity_id: int = Field(description="Managing entity ID")
    name: str = Field(min_length=1, max_length=255, description="Syndicate name")
    carried_interest_percentage: float | None = Field(None, description="Carried interest percentage")
    minimum_investment: float | None = Field(None, description="Minimum investment amount")
    maximum_investment: float | None = Field(None, description="Maximum investment amount")
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class CreateSyndicate(BaseModel):
    """Schema for creating a new syndicate"""
    entity_id: int = Field(description="Managing entity ID")
    name: str = Field(min_length=1, max_length=255, description="Syndicate name")
    carried_interest_percentage: float | None = Field(None, description="Carried interest percentage")
    minimum_investment: float | None = Field(None, description="Minimum investment amount")
    maximum_investment: float | None = Field(None, description="Maximum investment amount")

class UpdateSyndicate(BaseModel):
    """Schema for updating a syndicate"""
    entity_id: int | None = None
    name: str | None = Field(None, min_length=1, max_length=255)
    carried_interest_percentage: float | None = None
    minimum_investment: float | None = None
    maximum_investment: float | None = None

# ==========================================
# Response Types
# ==========================================

class SyndicateResponse(BaseModel):
    """Response containing a single syndicate"""
    success: bool
    data: Syndicate | None = None
    error: str | None = None

class SyndicatesResponse(BaseModel):
    """Response containing multiple syndicates"""
    success: bool
    data: list[Syndicate] | None = None
    error: str | None = None
