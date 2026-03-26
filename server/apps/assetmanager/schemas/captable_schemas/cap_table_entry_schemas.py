"""
CapTableEntry Schemas

Pydantic schemas for the CapTableEntry model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

# ==========================================
# CapTableEntry Schema (Full Representation)
# ==========================================

class CapTableEntry(BaseModel):
    """CapTableEntry schema - full representation"""
    id: int
    entity_id: int = Field(description="Associated entity ID")
    snapshot_id: int = Field(description="Associated cap table snapshot ID")
    security_id: int = Field(description="Associated security ID")
    stakeholder_id: int = Field(description="Associated stakeholder ID")
    funding_round_id: int | None = Field(None, description="Associated funding round ID")
    ownership_percentage: float = Field(description="Ownership percentage")
    number_of_shares: float = Field(description="Number of shares")

    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class CapTableEntryCreate(BaseModel):
    """Schema for creating a new cap table entry"""
    # Required fields
    entity_id: int = Field(description="Associated entity ID")
    snapshot_id: int = Field(description="Associated cap table snapshot ID")
    security_id: int = Field(description="Associated security ID")
    stakeholder_id: int = Field(description="Associated stakeholder ID")
    ownership_percentage: float = Field(description="Ownership percentage")
    number_of_shares: float = Field(description="Number of shares")

    # Optional fields
    funding_round_id: int | None = Field(None, description="Associated funding round ID")

class CapTableEntryUpdate(BaseModel):
    """Schema for updating a cap table entry"""
    entity_id: int | None = None
    snapshot_id: int | None = None
    security_id: int | None = None
    stakeholder_id: int | None = None
    funding_round_id: int | None = None
    ownership_percentage: float | None = None
    number_of_shares: float | None = None

# ==========================================
# Response Types
# ==========================================

class CapTableEntryResponse(BaseModel):
    """Response containing a single cap table entry"""
    success: bool
    data: CapTableEntry | None = None
    error: str | None = None

class CapTableEntriesResponse(BaseModel):
    """Response containing multiple cap table entries"""
    success: bool
    data: list[CapTableEntry] | None = None
    error: str | None = None
