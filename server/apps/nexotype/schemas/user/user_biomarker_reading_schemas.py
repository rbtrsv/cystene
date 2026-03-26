from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class UserBiomarkerReadingCreate(BaseModel):
    """Schema for creating a new user biomarker reading"""
    subject_id: int
    biomarker_id: int
    source_id: int
    value: float
    unit_id: int
    measured_at: datetime


class UserBiomarkerReadingUpdate(BaseModel):
    """Schema for updating a user biomarker reading"""
    subject_id: int = None
    biomarker_id: int = None
    source_id: int = None
    value: float = None
    unit_id: int = None
    measured_at: datetime = None


# ==========================================
# Response Schemas
# ==========================================

class UserBiomarkerReadingDetail(BaseModel):
    """Schema for user biomarker reading details"""
    id: int
    subject_id: int
    biomarker_id: int
    source_id: int
    value: float
    unit_id: int
    measured_at: datetime
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UserBiomarkerReadingListResponse(BaseModel):
    """Response schema for listing user biomarker readings"""
    success: bool
    data: list[UserBiomarkerReadingDetail] | None = None
    count: int = 0
    error: str | None = None


class UserBiomarkerReadingResponse(BaseModel):
    """Response schema for single user biomarker reading operations"""
    success: bool
    data: UserBiomarkerReadingDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
