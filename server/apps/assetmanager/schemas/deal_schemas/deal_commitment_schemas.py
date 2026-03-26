"""
DealCommitment Schemas

Pydantic schemas for the DealCommitment model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from enum import Enum

# ==========================================
# Enum Types
# ==========================================

class CommitmentType(str, Enum):
    """Commitment type options"""
    SOFT = "soft"
    FIRM = "firm"

# ==========================================
# DealCommitment Schema (Full Representation)
# ==========================================

class DealCommitment(BaseModel):
    """DealCommitment schema - full representation"""
    id: int
    deal_id: int = Field(description="Associated deal ID")
    entity_id: int = Field(description="Committing entity ID")
    syndicate_id: int | None = Field(None, description="Associated syndicate ID")

    commitment_type: CommitmentType = Field(description="Commitment type (soft/firm)")
    amount: float = Field(description="Commitment amount")
    notes: str | None = Field(None, description="Additional notes")

    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class DealCommitmentCreate(BaseModel):
    """Schema for creating a new deal commitment"""
    deal_id: int = Field(description="Associated deal ID")
    entity_id: int = Field(description="Committing entity ID")
    syndicate_id: int | None = Field(None, description="Associated syndicate ID")

    commitment_type: CommitmentType = Field(default=CommitmentType.SOFT, description="Commitment type (soft/firm)")
    amount: float = Field(gt=0, description="Commitment amount")
    notes: str | None = Field(None, description="Additional notes")

class DealCommitmentUpdate(BaseModel):
    """Schema for updating a deal commitment"""
    deal_id: int | None = None
    entity_id: int | None = None
    syndicate_id: int | None = None

    commitment_type: CommitmentType | None = None
    amount: float | None = Field(None, gt=0)
    notes: str | None = None

# ==========================================
# Response Types
# ==========================================

class DealCommitmentResponse(BaseModel):
    """Response containing a single deal commitment"""
    success: bool
    data: DealCommitment | None = None
    error: str | None = None

class DealCommitmentsResponse(BaseModel):
    """Response containing multiple deal commitments"""
    success: bool
    data: list[DealCommitment] | None = None
    error: str | None = None
