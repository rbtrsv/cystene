"""
Valuation Schemas

Pydantic schemas for the Valuation model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from datetime import date as date_type

# ==========================================
# Valuation Schema (Full Representation)
# ==========================================

class Valuation(BaseModel):
    """Valuation schema - full representation"""
    id: int
    entity_id: int = Field(description="Associated entity ID")
    funding_round_id: int | None = Field(None, description="Associated funding round ID")
    date: date_type = Field(description="Valuation date")
    valuation_value: float = Field(description="Valuation value")

    # Fund-specific fields (nullable — only fund-type entities use these)
    total_fund_units: float | None = Field(None, description="Total units issued")
    nav_per_share: float | None = Field(None, description="valuation_value / total_fund_units")

    notes: str | None = Field(None, description="Additional notes")
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class ValuationCreate(BaseModel):
    """Schema for creating a new valuation"""
    entity_id: int = Field(description="Associated entity ID")
    valuation_value: float = Field(description="Valuation value")

    funding_round_id: int | None = Field(None, description="Associated funding round ID")
    date: date_type | None = Field(None, description="Valuation date")

    # Fund-specific fields (nullable — only fund-type entities use these)
    total_fund_units: float | None = Field(None, description="Total units issued")
    nav_per_share: float | None = Field(None, description="valuation_value / total_fund_units")

    notes: str | None = Field(None, description="Additional notes")

class ValuationUpdate(BaseModel):
    """Schema for updating a valuation"""
    entity_id: int | None = None
    funding_round_id: int | None = None
    date: date_type | None = None
    valuation_value: float | None = None

    # Fund-specific fields (nullable — only fund-type entities use these)
    total_fund_units: float | None = None
    nav_per_share: float | None = None

    notes: str | None = None

# ==========================================
# Response Types
# ==========================================

class ValuationResponse(BaseModel):
    """Response containing a single valuation"""
    success: bool
    data: Valuation | None = None
    error: str | None = None

class ValuationsResponse(BaseModel):
    """Response containing multiple valuations"""
    success: bool
    data: list[Valuation] | None = None
    error: str | None = None
