"""
Stakeholder Schemas

Pydantic schemas for the Stakeholder model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from enum import Enum

class StakeholderType(str, Enum):
    """Stakeholder type options"""
    GENERAL_PARTNER = "general_partner"
    LIMITED_PARTNER = "limited_partner" 
    EMPLOYEE = "employee"
    ADVISOR = "advisor"
    BOARD_MEMBER = "board_member"
    INVESTOR = "investor"

# ==========================================
# Stakeholder Schema (Full Representation)
# ==========================================

class Stakeholder(BaseModel):
    """Stakeholder schema - full representation"""
    id: int
    name: str = Field(min_length=1, max_length=255, description="Stakeholder name")
    type: StakeholderType = Field(description="Stakeholder type")
    entity_id: int | None = Field(None, description="Associated entity ID")
    source_syndicate_id: int | None = Field(None, description="Source syndicate ID (when stakeholder is a syndicate proxy)")
    carried_interest_percentage: float | None = Field(None, description="Carried interest percentage")
    preferred_return_rate: float | None = Field(None, description="Preferred return rate")
    distribution_tier: int = Field(default=1, description="Distribution tier")
    board_seats: int = Field(default=0, description="Number of board seats")
    voting_rights: bool = Field(default=True, description="Has voting rights")
    pro_rata_rights: bool = Field(default=False, description="Has pro rata rights")
    drag_along: bool = Field(default=False, description="Has drag along rights")
    tag_along: bool = Field(default=False, description="Has tag along rights")
    observer_rights: bool = Field(default=False, description="Has observer rights")
    minimum_investment: float | None = Field(None, description="Minimum investment amount")
    maximum_investment: float | None = Field(None, description="Maximum investment amount")
    created_at: datetime
    updated_at: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class CreateStakeholder(BaseModel):
    """Schema for creating a new stakeholder"""
    name: str = Field(min_length=1, max_length=255, description="Stakeholder name")
    type: StakeholderType = Field(description="Stakeholder type")
    entity_id: int | None = Field(None, description="Associated entity ID")
    source_syndicate_id: int | None = Field(None, description="Source syndicate ID (when stakeholder is a syndicate proxy)")
    carried_interest_percentage: float | None = Field(None, description="Carried interest percentage")
    preferred_return_rate: float | None = Field(None, description="Preferred return rate")
    distribution_tier: int = Field(default=1, description="Distribution tier")
    board_seats: int = Field(default=0, description="Number of board seats")
    voting_rights: bool = Field(default=True, description="Has voting rights")
    pro_rata_rights: bool = Field(default=False, description="Has pro rata rights")
    drag_along: bool = Field(default=False, description="Has drag along rights")
    tag_along: bool = Field(default=False, description="Has tag along rights")
    observer_rights: bool = Field(default=False, description="Has observer rights")
    minimum_investment: float | None = Field(None, description="Minimum investment amount")
    maximum_investment: float | None = Field(None, description="Maximum investment amount")

class UpdateStakeholder(BaseModel):
    """Schema for updating a stakeholder"""
    name: str | None = Field(None, min_length=1, max_length=255)
    type: StakeholderType | None = None
    entity_id: int | None = None
    source_syndicate_id: int | None = None
    carried_interest_percentage: float | None = None
    preferred_return_rate: float | None = None
    distribution_tier: int | None = None
    board_seats: int | None = None
    voting_rights: bool | None = None
    pro_rata_rights: bool | None = None
    drag_along: bool | None = None
    tag_along: bool | None = None
    observer_rights: bool | None = None
    minimum_investment: float | None = None
    maximum_investment: float | None = None

# ==========================================
# Response Types
# ==========================================

class StakeholderResponse(BaseModel):
    """Response containing a single stakeholder"""
    success: bool
    data: Stakeholder | None = None
    error: str | None = None

class StakeholdersResponse(BaseModel):
    """Response containing multiple stakeholders"""
    success: bool
    data: list[Stakeholder] | None = None
    error: str | None = None