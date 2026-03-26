from pydantic import BaseModel, ConfigDict
from datetime import date, datetime

# ==========================================
# Request Schemas
# ==========================================

class UserTreatmentLogCreate(BaseModel):
    """Schema for creating a new user treatment log"""
    subject_id: int
    asset_id: int
    dosage: str
    started_at: date
    ended_at: date | None = None


class UserTreatmentLogUpdate(BaseModel):
    """Schema for updating a user treatment log"""
    subject_id: int = None
    asset_id: int = None
    dosage: str = None
    started_at: date = None
    ended_at: date | None = None


# ==========================================
# Response Schemas
# ==========================================

class UserTreatmentLogDetail(BaseModel):
    """Schema for user treatment log details"""
    id: int
    subject_id: int
    asset_id: int
    dosage: str
    started_at: date
    ended_at: date | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UserTreatmentLogListResponse(BaseModel):
    """Response schema for listing user treatment logs"""
    success: bool
    data: list[UserTreatmentLogDetail] | None = None
    count: int = 0
    error: str | None = None


class UserTreatmentLogResponse(BaseModel):
    """Response schema for single user treatment log operations"""
    success: bool
    data: UserTreatmentLogDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
