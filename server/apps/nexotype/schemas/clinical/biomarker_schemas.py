from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class BiomarkerCreate(BaseModel):
    """Schema for creating a new biomarker"""
    name: str
    loinc_code: str | None = None


class BiomarkerUpdate(BaseModel):
    """Schema for updating a biomarker"""
    name: str = None
    loinc_code: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class BiomarkerDetail(BaseModel):
    """Schema for biomarker details"""
    id: int
    name: str
    loinc_code: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class BiomarkerListResponse(BaseModel):
    """Response schema for listing biomarkers"""
    success: bool
    data: list[BiomarkerDetail] | None = None
    count: int = 0
    error: str | None = None


class BiomarkerResponse(BaseModel):
    """Response schema for single biomarker operations"""
    success: bool
    data: BiomarkerDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
