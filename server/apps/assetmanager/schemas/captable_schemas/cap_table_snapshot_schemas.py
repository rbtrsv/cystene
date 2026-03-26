"""
CapTableSnapshot Schemas

Pydantic schemas for the CapTableSnapshot model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from datetime import date as date_type

# ==========================================
# CapTableSnapshot Schema (Full Representation)
# ==========================================

class CapTableSnapshot(BaseModel):
    """CapTableSnapshot schema - full representation"""
    id: int
    entity_id: int = Field(description="Associated entity ID")
    funding_round_id: int | None = Field(None, description="Associated funding round ID")
    snapshot_date: date_type = Field(description="Snapshot date")
    name: str | None = Field(None, description="Snapshot name")
    notes: str | None = Field(None, description="Additional notes")

    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class CapTableSnapshotCreate(BaseModel):
    """Schema for creating a new cap table snapshot"""
    # Required fields
    entity_id: int = Field(description="Associated entity ID")
    snapshot_date: date_type = Field(description="Snapshot date")

    # Optional fields
    funding_round_id: int | None = Field(None, description="Associated funding round ID")
    name: str | None = Field(None, description="Snapshot name")
    notes: str | None = Field(None, description="Additional notes")

class CapTableSnapshotUpdate(BaseModel):
    """Schema for updating a cap table snapshot"""
    entity_id: int | None = None
    funding_round_id: int | None = None
    snapshot_date: date_type | None = None
    name: str | None = None
    notes: str | None = None

# ==========================================
# Response Types
# ==========================================

class CapTableSnapshotResponse(BaseModel):
    """Response containing a single cap table snapshot"""
    success: bool
    data: CapTableSnapshot | None = None
    error: str | None = None

class CapTableSnapshotsResponse(BaseModel):
    """Response containing multiple cap table snapshots"""
    success: bool
    data: list[CapTableSnapshot] | None = None
    error: str | None = None
