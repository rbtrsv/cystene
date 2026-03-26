"""
HoldingPerformance Schemas

Pydantic schemas for the HoldingPerformance model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from datetime import date as date_type

# ==========================================
# HoldingPerformance Schema (Full Representation)
# ==========================================

class HoldingPerformance(BaseModel):
    """HoldingPerformance schema - full representation"""
    id: int
    entity_id: int = Field(description="Associated entity ID")
    funding_round_id: int | None = Field(None, description="Associated funding round ID")
    report_date: date_type = Field(description="Report date")

    # Performance Metrics
    total_invested_amount: float | None = Field(None, description="Total invested amount")
    fair_value: float | None = Field(None, description="Fair value")
    cash_realized: float | None = Field(None, description="Cash realized")
    tvpi: float | None = Field(None, description="Total value to paid-in")
    dpi: float | None = Field(None, description="Distributions to paid-in")
    rvpi: float | None = Field(None, description="Residual value to paid-in")
    irr: float | None = Field(None, description="Internal rate of return")
    multiple_to_cost: float | None = Field(None, description="Multiple to cost")

    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class HoldingPerformanceCreate(BaseModel):
    """Schema for creating a new holding performance record"""
    # Required fields
    entity_id: int = Field(description="Associated entity ID")

    # Optional fields
    funding_round_id: int | None = Field(None, description="Associated funding round ID")
    report_date: date_type | None = Field(None, description="Report date")

    # Performance Metrics
    total_invested_amount: float | None = Field(None, description="Total invested amount")
    fair_value: float | None = Field(None, description="Fair value")
    cash_realized: float | None = Field(None, description="Cash realized")
    tvpi: float | None = Field(None, description="Total value to paid-in")
    dpi: float | None = Field(None, description="Distributions to paid-in")
    rvpi: float | None = Field(None, description="Residual value to paid-in")
    irr: float | None = Field(None, description="Internal rate of return")
    multiple_to_cost: float | None = Field(None, description="Multiple to cost")

class HoldingPerformanceUpdate(BaseModel):
    """Schema for updating a holding performance record"""
    entity_id: int | None = None
    funding_round_id: int | None = None
    report_date: date_type | None = None

    # Performance Metrics
    total_invested_amount: float | None = None
    fair_value: float | None = None
    cash_realized: float | None = None
    tvpi: float | None = None
    dpi: float | None = None
    rvpi: float | None = None
    irr: float | None = None
    multiple_to_cost: float | None = None

# ==========================================
# Response Types
# ==========================================

class HoldingPerformanceResponse(BaseModel):
    """Response containing a single holding performance record"""
    success: bool
    data: HoldingPerformance | None = None
    error: str | None = None

class HoldingPerformancesResponse(BaseModel):
    """Response containing multiple holding performance records"""
    success: bool
    data: list[HoldingPerformance] | None = None
    error: str | None = None
