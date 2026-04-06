"""
Commitment Schemas

Pydantic schemas for the Commitment model following simplified schema guidelines.
Pro-rata subscription commitment for funding rounds.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Literal
from enum import Enum

# ==========================================
# Enum Types
# ==========================================

class CommitmentStatus(str, Enum):
    """Commitment status options — tracks the full lifecycle flow"""
    INVITED = "invited"
    COMMITTED = "committed"
    PASSED = "passed"
    APPROVED = "approved"
    REJECTED = "rejected"

class CommitmentType(str, Enum):
    """Commitment type options — set when stakeholder responds"""
    FULL_PRO_RATA = "full_pro_rata"
    PARTIAL = "partial"
    OVER_SUBSCRIPTION = "over_subscription"

# ==========================================
# Commitment Schema (Full Representation)
# ==========================================

class Commitment(BaseModel):
    """Commitment schema - full representation"""
    id: int

    # Core references
    entity_id: int = Field(description="Associated entity ID")
    funding_round_id: int = Field(description="Associated funding round ID")
    security_id: int = Field(description="Associated security ID")
    stakeholder_id: int = Field(description="Associated stakeholder ID")

    # Status & Type
    status: CommitmentStatus = Field(description="Commitment status")
    commitment_type: CommitmentType | None = Field(None, description="Commitment type (NULL when invited, set when stakeholder responds)")

    # Pro-rata calculation (snapshot at invitation time — frozen, later cap table changes don't affect)
    pro_rata_percentage: float = Field(description="Pro-rata ownership percentage at invitation time")
    pro_rata_amount: float = Field(description="Pro-rata amount (target_amount × pro_rata_percentage)")

    # Committed amount (NULL when invited/passed, set when stakeholder commits)
    committed_amount: float | None = Field(None, description="Amount committed by stakeholder")

    # Transaction link (populated when admin generates ISSUANCE transaction from approved commitment)
    transaction_id: int | None = Field(None, description="Generated ISSUANCE transaction ID")

    # Notes
    notes: str | None = Field(None, description="Commitment notes")

    # Invitation tracking
    invited_by: int | None = Field(None, description="User ID who sent the invitation")
    invited_at: datetime = Field(description="When the invitation was sent")

    # Response tracking
    responded_at: datetime | None = Field(None, description="When the stakeholder responded")

    # Review tracking
    reviewed_at: datetime | None = Field(None, description="When the admin reviewed")
    reviewed_by: int | None = Field(None, description="User ID who reviewed")

    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Enriched Output Schema (JOIN result)
# ==========================================

class CommitmentDetail(Commitment):
    """Commitment with resolved names from JOINed tables.
    Returned by list/get endpoints — frontend displays these directly
    instead of doing local lookups that fail for cross-entity data."""
    funding_round_name: str = Field(description="From FundingRound.name")
    security_name: str = Field(description="From Security.security_name")
    entity_name: str = Field(description="From Entity.name (cap table owner, via commitment.entity_id)")
    stakeholder_name: str = Field(description="From Stakeholder.source_entity_id → Entity.name (the investor)")

# ==========================================
# Input Schemas
# ==========================================

class CommitmentCreate(BaseModel):
    """Schema for inviting a stakeholder to a funding round (POST).
    Creates one commitment per request — mirrors model columns only.
    raise_amount is NOT here because it's a calculation input, not a persisted field.
    It comes as a query parameter on the endpoint instead.
    Pro-rata percentage and amount are calculated server-side from cap table data."""
    entity_id: int = Field(description="Associated entity ID")
    funding_round_id: int = Field(description="Funding round to invite stakeholder to")
    security_id: int = Field(description="Security to commit to within the funding round")
    stakeholder_id: int = Field(description="Stakeholder to invite")

class CommitmentRespond(BaseModel):
    """Schema for stakeholder responding to an invitation — committed or passed"""
    status: Literal["committed", "passed"] = Field(description="Stakeholder response (committed or passed)")
    commitment_type: CommitmentType | None = Field(None, description="Commitment type (required when status is committed)")
    committed_amount: float | None = Field(None, description="Amount committed (required for partial, equals pro_rata_amount for full_pro_rata)")
    notes: str | None = Field(None, description="Optional notes from stakeholder")

class CommitmentReview(BaseModel):
    """Schema for admin reviewing a committed commitment — approved or rejected"""
    status: Literal["approved", "rejected"] = Field(description="Admin review decision (approved or rejected)")

# ==========================================
# Response Types
# ==========================================

class CommitmentResponse(BaseModel):
    """Response containing a single commitment (enriched with JOINed names)"""
    success: bool
    data: CommitmentDetail | None = None
    error: str | None = None

class CommitmentsResponse(BaseModel):
    """Response containing multiple commitments (enriched with JOINed names)"""
    success: bool
    data: list[CommitmentDetail] | None = None
    error: str | None = None
