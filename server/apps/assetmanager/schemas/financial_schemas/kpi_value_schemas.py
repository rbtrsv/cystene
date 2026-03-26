"""
KPIValue Schemas

Pydantic schemas for the KPIValue model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from datetime import date as date_type

# ==========================================
# KPIValue Schema (Full Representation)
# ==========================================

class KPIValue(BaseModel):
    """KPIValue schema - full representation"""
    id: int
    kpi_id: int = Field(description="Associated KPI ID")

    # Time Dimensions
    year: int = Field(description="Fiscal year")
    quarter: str | None = Field(None, description="Fiscal quarter")
    semester: str | None = Field(None, description="Fiscal semester")
    month: str | None = Field(None, description="Fiscal month")
    full_year: bool = Field(description="Whether this is a full year value")
    scenario: str = Field(description="Scenario type (actual, budget, forecast)")
    date: date_type | None = Field(None, description="KPI value date")

    # Value
    value: float | None = Field(None, description="KPI value")
    notes: str | None = Field(None, description="Additional notes")

    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class KPIValueCreate(BaseModel):
    """Schema for creating a new KPI value"""
    # Required fields
    kpi_id: int = Field(description="Associated KPI ID")
    year: int = Field(description="Fiscal year")

    # Fields with defaults
    full_year: bool = Field(default=False, description="Whether this is a full year value")
    scenario: str = Field(default="actual", description="Scenario type (actual, budget, forecast)")

    # Optional fields
    quarter: str | None = Field(None, description="Fiscal quarter")
    semester: str | None = Field(None, description="Fiscal semester")
    month: str | None = Field(None, description="Fiscal month")
    date: date_type | None = Field(None, description="KPI value date")
    value: float | None = Field(None, description="KPI value")
    notes: str | None = Field(None, description="Additional notes")

class KPIValueUpdate(BaseModel):
    """Schema for updating a KPI value"""
    kpi_id: int | None = None

    # Time Dimensions
    year: int | None = None
    quarter: str | None = None
    semester: str | None = None
    month: str | None = None
    full_year: bool | None = None
    scenario: str | None = None
    date: date_type | None = None

    # Value
    value: float | None = None
    notes: str | None = None

# ==========================================
# Response Types
# ==========================================

class KPIValueResponse(BaseModel):
    """Response containing a single KPI value"""
    success: bool
    data: KPIValue | None = None
    error: str | None = None

class KPIValuesResponse(BaseModel):
    """Response containing multiple KPI values"""
    success: bool
    data: list[KPIValue] | None = None
    error: str | None = None
