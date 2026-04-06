"""
Scan Schedule Schemas

Pydantic schemas for the ScanSchedule model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from enum import Enum


# ==========================================
# Enums
# ==========================================

class ScheduleFrequency(str, Enum):
    """Schedule frequency options"""
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


# ==========================================
# ScanSchedule Schema (Full Representation)
# ==========================================

class ScanScheduleDetail(BaseModel):
    """Scan schedule schema - full representation"""
    id: int
    target_id: int = Field(description="Scan target")
    template_id: int = Field(description="Scan template to use")
    name: str = Field(description="Schedule name")
    frequency: ScheduleFrequency = Field(description="How often to scan")
    cron_expression: str | None = Field(None, description="Optional cron override")
    is_active: bool = True
    last_run_at: datetime | None = None
    next_run_at: datetime | None = None
    last_run_status: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Input Schemas
# ==========================================

class ScanScheduleCreate(BaseModel):
    """Schema for creating a new scan schedule"""
    target_id: int = Field(description="Scan target")
    template_id: int = Field(description="Scan template to use")
    name: str = Field(min_length=1, max_length=255, description="Schedule name")
    frequency: ScheduleFrequency = Field(description="How often to scan")
    cron_expression: str | None = Field(None, max_length=100, description="Optional cron override")
    is_active: bool = True


class ScanScheduleUpdate(BaseModel):
    """Schema for updating a scan schedule"""
    name: str | None = Field(None, min_length=1, max_length=255)
    frequency: ScheduleFrequency | None = None
    cron_expression: str | None = Field(None, max_length=100)
    is_active: bool | None = None


# ==========================================
# Response Types
# ==========================================

class ScanScheduleResponse(BaseModel):
    """Response containing a single scan schedule"""
    success: bool
    data: ScanScheduleDetail | None = None
    error: str | None = None


class ScanSchedulesResponse(BaseModel):
    """Response containing multiple scan schedules"""
    success: bool
    data: list[ScanScheduleDetail] | None = None
    error: str | None = None
