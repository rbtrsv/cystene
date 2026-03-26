"""
SyndicateMember Schemas

Pydantic schemas for the SyndicateMember model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

# ==========================================
# SyndicateMember Schema (Full Representation)
# ==========================================

class SyndicateMember(BaseModel):
    """SyndicateMember schema - full representation"""
    id: int
    syndicate_id: int = Field(description="Syndicate ID")
    member_entity_id: int = Field(description="Member entity ID")
    ownership_percentage: float = Field(description="Ownership percentage in syndicate")
    investment_amount: float | None = Field(None, description="Investment amount")
    joined_date: datetime = Field(description="Date when member joined syndicate")

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class CreateSyndicateMember(BaseModel):
    """Schema for creating a new syndicate member"""
    syndicate_id: int = Field(description="Syndicate ID")
    member_entity_id: int = Field(description="Member entity ID")
    ownership_percentage: float = Field(description="Ownership percentage in syndicate")
    investment_amount: float | None = Field(None, description="Investment amount")

class UpdateSyndicateMember(BaseModel):
    """Schema for updating a syndicate member"""
    syndicate_id: int | None = None
    member_entity_id: int | None = None
    ownership_percentage: float | None = None
    investment_amount: float | None = None

# ==========================================
# Response Types
# ==========================================

class SyndicateMemberResponse(BaseModel):
    """Response containing a single syndicate member"""
    success: bool
    data: SyndicateMember | None = None
    error: str | None = None

class SyndicateMembersResponse(BaseModel):
    """Response containing multiple syndicate members"""
    success: bool
    data: list[SyndicateMember] | None = None
    error: str | None = None
