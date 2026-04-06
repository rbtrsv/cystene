"""
Scan Job Schemas

Pydantic schemas for the ScanJob model following simplified schema guidelines.
No Create schema — jobs are created via POST /start endpoint in subrouter.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from enum import Enum


# ==========================================
# Enums
# ==========================================

class JobStatus(str, Enum):
    """Scan job lifecycle status options"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


# ==========================================
# ScanJob Schema (Full Representation)
# ==========================================

class ScanJobDetail(BaseModel):
    """Scan job schema - full representation"""
    id: int
    target_id: int = Field(description="What was scanned")
    template_id: int = Field(description="Which config was used")
    schedule_id: int | None = Field(None, description="Which schedule triggered it")
    status: JobStatus = Field(description="Job lifecycle status")
    started_at: datetime | None = None
    completed_at: datetime | None = None
    duration_seconds: int | None = None
    scan_types_run: str | None = Field(None, description="What actually ran (comma-separated)")
    total_findings: int = 0
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    info_count: int = 0
    total_assets: int = 0
    execution_point: str = Field(default="cloud", description="Where scan ran (cloud or remote_agent)")
    security_score: int | None = Field(None, description="0-100 security score")
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Response Types
# ==========================================

class ScanJobResponse(BaseModel):
    """Response containing a single scan job"""
    success: bool
    data: ScanJobDetail | None = None
    error: str | None = None


class ScanJobsResponse(BaseModel):
    """Response containing multiple scan jobs"""
    success: bool
    data: list[ScanJobDetail] | None = None
    error: str | None = None
