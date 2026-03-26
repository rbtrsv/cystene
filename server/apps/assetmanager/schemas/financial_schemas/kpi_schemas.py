"""
KPI Schemas

Pydantic schemas for the KPI model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

# ==========================================
# KPI Schema (Full Representation)
# ==========================================

class KPI(BaseModel):
    """KPI schema - full representation"""
    id: int
    entity_id: int = Field(description="Associated entity ID")
    name: str = Field(description="KPI name")
    description: str | None = Field(None, description="KPI description")
    data_type: str = Field(description="Data type (decimal, integer, percentage, etc.)")
    is_calculated: bool = Field(description="Whether the KPI is calculated from a formula")
    formula: str | None = Field(None, description="Calculation formula")

    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class KPICreate(BaseModel):
    """Schema for creating a new KPI"""
    # Required fields
    entity_id: int = Field(description="Associated entity ID")
    name: str = Field(description="KPI name")

    # Fields with defaults
    data_type: str = Field(default="decimal", description="Data type (decimal, integer, percentage, etc.)")
    is_calculated: bool = Field(default=False, description="Whether the KPI is calculated from a formula")

    # Optional fields
    description: str | None = Field(None, description="KPI description")
    formula: str | None = Field(None, description="Calculation formula")

class KPIUpdate(BaseModel):
    """Schema for updating a KPI"""
    entity_id: int | None = None
    name: str | None = None
    description: str | None = None
    data_type: str | None = None
    is_calculated: bool | None = None
    formula: str | None = None

# ==========================================
# Response Types
# ==========================================

class KPIResponse(BaseModel):
    """Response containing a single KPI"""
    success: bool
    data: KPI | None = None
    error: str | None = None

class KPIsResponse(BaseModel):
    """Response containing multiple KPIs"""
    success: bool
    data: list[KPI] | None = None
    error: str | None = None
