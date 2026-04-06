"""
DealPipeline Schemas

Pydantic schemas for the DealPipeline model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from datetime import date as date_type
from enum import Enum

# ==========================================
# Enum Types
# ==========================================

class PipelinePriority(str, Enum):
    """Pipeline priority options"""
    P1 = "p1"
    P2 = "p2"
    P3 = "p3"
    P4 = "p4"
    P5 = "p5"

class PipelineStatus(str, Enum):
    """Pipeline status options"""
    INITIAL_SCREENING = "initial_screening"
    DUE_DILIGENCE = "due_diligence"
    TERM_SHEET = "term_sheet"
    NEGOTIATION = "negotiation"
    CLOSING = "closing"
    CLOSED = "closed"
    PASSED = "passed"
    REJECTED = "rejected"

# ==========================================
# DealPipeline Schema (Full Representation)
# ==========================================

class DealPipeline(BaseModel):
    """DealPipeline schema - full representation"""
    id: int
    entity_id: int = Field(description="Associated entity ID")
    target_entity_id: int | None = Field(None, description="Target entity ID")
    company_name: str | None = Field(None, description="Company name")
    deal_name: str = Field(description="Deal name")
    priority: PipelinePriority = Field(description="Priority level")
    status: PipelineStatus = Field(description="Pipeline status")
    round_type: str = Field(description="Round type")
    sector: str | None = Field(None, description="Sector")

    # Financial Details
    target_raise: float | None = Field(None, description="Target raise amount")
    pre_money_valuation: float | None = Field(None, description="Pre-money valuation")
    post_money_valuation: float | None = Field(None, description="Post-money valuation")
    expected_ownership: float | None = Field(None, description="Expected ownership percentage")
    investment_amount: float | None = Field(None, description="Investment amount")
    is_lead_investor: bool = Field(description="Whether lead investor")
    other_investors: str | None = Field(None, description="Other investors")

    # Dates
    first_contact_date: date_type | None = Field(None, description="First contact date")
    last_interaction_date: date_type | None = Field(None, description="Last interaction date")
    next_meeting_date: date_type | None = Field(None, description="Next meeting date")
    expected_close_date: date_type | None = Field(None, description="Expected close date")

    # Notes & Analysis
    investment_thesis: str | None = Field(None, description="Investment thesis")
    key_risks: str | None = Field(None, description="Key risks")
    due_diligence_notes: str | None = Field(None, description="Due diligence notes")
    next_steps: str | None = Field(None, description="Next steps")
    rejection_reason: str | None = Field(None, description="Rejection reason")
    notes: str | None = Field(None, description="Additional notes")

    # Assignment
    assigned_to_id: int | None = Field(None, description="Assigned user ID")

    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class DealPipelineCreate(BaseModel):
    """Schema for creating a new deal pipeline entry"""
    # Required fields
    entity_id: int = Field(description="Associated entity ID")
    deal_name: str = Field(min_length=1, max_length=255, description="Deal name")
    priority: PipelinePriority = Field(description="Priority level (p1-p5)")
    round_type: str = Field(max_length=50, description="Round type")
    sector: str = Field(max_length=50, description="Sector")

    # Fields with defaults
    status: PipelineStatus = Field(default=PipelineStatus.INITIAL_SCREENING, description="Pipeline status")
    is_lead_investor: bool = Field(default=False, description="Whether lead investor")

    # Optional fields
    target_entity_id: int | None = Field(None, description="Target entity ID")
    company_name: str | None = Field(None, max_length=255, description="Company name")

    # Financial Details
    target_raise: float | None = Field(None, description="Target raise amount")
    pre_money_valuation: float | None = Field(None, description="Pre-money valuation")
    post_money_valuation: float | None = Field(None, description="Post-money valuation")
    expected_ownership: float | None = Field(None, description="Expected ownership percentage")
    investment_amount: float | None = Field(None, description="Investment amount")
    other_investors: str | None = Field(None, description="Other investors")

    # Dates
    first_contact_date: date_type | None = Field(None, description="First contact date")
    last_interaction_date: date_type | None = Field(None, description="Last interaction date")
    next_meeting_date: date_type | None = Field(None, description="Next meeting date")
    expected_close_date: date_type | None = Field(None, description="Expected close date")

    # Notes & Analysis
    investment_thesis: str | None = Field(None, description="Investment thesis")
    key_risks: str | None = Field(None, description="Key risks")
    due_diligence_notes: str | None = Field(None, description="Due diligence notes")
    next_steps: str | None = Field(None, description="Next steps")
    rejection_reason: str | None = Field(None, description="Rejection reason")
    notes: str | None = Field(None, description="Additional notes")

    # Assignment
    assigned_to_id: int | None = Field(None, description="Assigned user ID")

class DealPipelineUpdate(BaseModel):
    """Schema for updating a deal pipeline entry"""
    entity_id: int | None = None
    target_entity_id: int | None = None
    company_name: str | None = Field(None, max_length=255)
    deal_name: str | None = Field(None, min_length=1, max_length=255)
    priority: PipelinePriority | None = None
    status: PipelineStatus | None = None
    round_type: str | None = Field(None, max_length=50)
    sector: str | None = Field(None, max_length=50)

    # Financial Details
    target_raise: float | None = None
    pre_money_valuation: float | None = None
    post_money_valuation: float | None = None
    expected_ownership: float | None = None
    investment_amount: float | None = None
    is_lead_investor: bool | None = None
    other_investors: str | None = None

    # Dates
    first_contact_date: date_type | None = None
    last_interaction_date: date_type | None = None
    next_meeting_date: date_type | None = None
    expected_close_date: date_type | None = None

    # Notes & Analysis
    investment_thesis: str | None = None
    key_risks: str | None = None
    due_diligence_notes: str | None = None
    next_steps: str | None = None
    rejection_reason: str | None = None
    notes: str | None = None

    # Assignment
    assigned_to_id: int | None = None

# ==========================================
# Response Types
# ==========================================

class DealPipelineResponse(BaseModel):
    """Response containing a single deal pipeline entry"""
    success: bool
    data: DealPipeline | None = None
    error: str | None = None

class DealPipelinesResponse(BaseModel):
    """Response containing multiple deal pipeline entries"""
    success: bool
    data: list[DealPipeline] | None = None
    error: str | None = None
