"""
Scan Target Schemas

Pydantic schemas for the ScanTarget model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from enum import Enum


# ==========================================
# Enums
# ==========================================

class TargetType(str, Enum):
    """Scan target type options"""
    DOMAIN = "domain"
    IP = "ip"
    IP_RANGE = "ip_range"
    URL = "url"


class VerificationMethod(str, Enum):
    """Target ownership verification method options"""
    DNS_TXT = "dns_txt"
    FILE_UPLOAD = "file_upload"
    META_TAG = "meta_tag"


# ==========================================
# ScanTarget Schema (Full Representation)
# ==========================================

class ScanTargetDetail(BaseModel):
    """Scan target schema - full representation"""
    id: int
    user_id: int = Field(description="User who created this target")
    organization_id: int = Field(description="Organization that owns this target")
    infrastructure_id: int | None = Field(None, description="Linked infrastructure item for business context")
    name: str = Field(description="Target name")
    target_type: TargetType = Field(description="Type of target")
    target_value: str = Field(description="Actual target value (domain, IP, URL)")
    is_verified: bool = Field(description="Whether ownership has been verified")
    verification_method: VerificationMethod | None = None
    verification_token: str | None = None
    notes: str | None = None
    tags: str | None = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Input Schemas
# ==========================================

class ScanTargetCreate(BaseModel):
    """Schema for creating a new scan target"""
    name: str = Field(min_length=1, max_length=255, description="Target name")
    target_type: TargetType = Field(description="Type of target")
    target_value: str = Field(min_length=1, max_length=500, description="Actual target (domain, IP, URL)")
    infrastructure_id: int | None = Field(None, description="Link to infrastructure for business context")
    notes: str | None = None
    tags: str | None = Field(None, max_length=500)
    is_active: bool = True


class ScanTargetUpdate(BaseModel):
    """Schema for updating a scan target"""
    name: str | None = Field(None, min_length=1, max_length=255)
    target_type: TargetType | None = None
    target_value: str | None = Field(None, min_length=1, max_length=500)
    infrastructure_id: int | None = None
    notes: str | None = None
    tags: str | None = Field(None, max_length=500)
    is_active: bool | None = None


# ==========================================
# Response Types
# ==========================================

class ScanTargetResponse(BaseModel):
    """Response containing a single scan target"""
    success: bool
    data: ScanTargetDetail | None = None
    error: str | None = None


class ScanTargetsResponse(BaseModel):
    """Response containing multiple scan targets"""
    success: bool
    data: list[ScanTargetDetail] | None = None
    error: str | None = None
