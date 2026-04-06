"""
Report Schemas

Pydantic schemas for the Report model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from enum import Enum


# ==========================================
# Enums
# ==========================================

class ReportType(str, Enum):
    """Report type options"""
    FULL = "full"
    EXECUTIVE_SUMMARY = "executive_summary"
    COMPLIANCE = "compliance"
    DELTA = "delta"


class ReportFormat(str, Enum):
    """Report output format options"""
    PDF = "pdf"
    HTML = "html"
    JSON = "json"


# ==========================================
# Report Schema (Full Representation)
# ==========================================

class ReportDetail(BaseModel):
    """Report schema - full representation"""
    id: int
    target_id: int = Field(description="Scan target this report covers")
    scan_job_id: int | None = Field(None, description="Source scan job")
    name: str = Field(description="Report name")
    report_type: ReportType = Field(description="Type of report")
    format: ReportFormat = Field(description="Output format")
    content: str | None = Field(None, description="Report content (HTML/JSON)")
    summary: str | None = Field(None, description="Executive summary text")
    total_findings: int = 0
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    info_count: int = 0
    generated_at: datetime
    generated_by: int | None = Field(None, description="User ID who triggered generation")
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Input Schemas
# ==========================================

class ReportCreate(BaseModel):
    """Schema for generating a new report"""
    target_id: int = Field(description="Scan target to report on")
    scan_job_id: int | None = Field(None, description="Specific scan job (optional — omit for target-wide report)")
    name: str = Field(min_length=1, max_length=255, description="Report name")
    report_type: ReportType = Field(default=ReportType.FULL, description="Type of report")
    format: ReportFormat = Field(default=ReportFormat.PDF, description="Output format")


# ==========================================
# Response Types
# ==========================================

class ReportResponse(BaseModel):
    """Response containing a single report"""
    success: bool
    data: ReportDetail | None = None
    error: str | None = None


class ReportsResponse(BaseModel):
    """Response containing multiple reports"""
    success: bool
    data: list[ReportDetail] | None = None
    error: str | None = None
