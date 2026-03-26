from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class SubjectCreate(BaseModel):
    """Schema for creating a new subject"""
    subject_identifier: str
    organism_id: int
    cohort_name: str | None = None
    sex: str | None = None


class SubjectUpdate(BaseModel):
    """Schema for updating a subject"""
    subject_identifier: str = None
    organism_id: int = None
    cohort_name: str | None = None
    sex: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class SubjectDetail(BaseModel):
    """Schema for subject details"""
    id: int
    subject_identifier: str
    organism_id: int
    cohort_name: str | None = None
    sex: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class SubjectListResponse(BaseModel):
    """Response schema for listing subjects"""
    success: bool
    data: list[SubjectDetail] | None = None
    count: int = 0
    error: str | None = None


class SubjectResponse(BaseModel):
    """Response schema for single subject operations"""
    success: bool
    data: SubjectDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
