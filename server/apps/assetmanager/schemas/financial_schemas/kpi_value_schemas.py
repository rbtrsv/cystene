"""
KPIValue Schemas

Pydantic schemas for the KPIValue model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from datetime import date as date_type
from .shared_financial_schemas import Scenario, Quarter, Semester, Month

# ==========================================
# KPIValue Schema (Full Representation)
# ==========================================

class KPIValue(BaseModel):
    """KPIValue schema - full representation"""
    id: int
    kpi_id: int = Field(description="Associated KPI ID")

    # Time Dimensions
    year: int = Field(description="Fiscal year")
    quarter: Quarter | None = Field(None, description="Fiscal quarter")
    semester: Semester | None = Field(None, description="Fiscal semester")
    month: Month | None = Field(None, description="Fiscal month")
    full_year: bool = Field(description="Whether this is a full year value")
    scenario: Scenario = Field(description="Scenario type")
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
    scenario: Scenario = Field(default=Scenario.ACTUAL, description="Scenario type")

    # Optional fields
    quarter: Quarter | None = Field(None, description="Fiscal quarter")
    semester: Semester | None = Field(None, description="Fiscal semester")
    month: Month | None = Field(None, description="Fiscal month")
    date: date_type | None = Field(None, description="KPI value date")
    value: float | None = Field(None, description="KPI value")
    notes: str | None = Field(None, description="Additional notes")

class KPIValueUpdate(BaseModel):
    """Schema for updating a KPI value"""
    kpi_id: int | None = None

    # Time Dimensions
    year: int | None = None
    quarter: Quarter | None = None
    semester: Semester | None = None
    month: Month | None = None
    full_year: bool | None = None
    scenario: Scenario | None = None
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
