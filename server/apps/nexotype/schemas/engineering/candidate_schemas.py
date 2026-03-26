from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class CandidateCreate(BaseModel):
    """Schema for creating a new candidate"""
    parent_candidate_id: int | None = None
    asset_id: int
    version_number: str


class CandidateUpdate(BaseModel):
    """Schema for updating a candidate"""
    parent_candidate_id: int | None = None
    asset_id: int = None
    version_number: str = None


# ==========================================
# Response Schemas
# ==========================================

class CandidateDetail(BaseModel):
    """Schema for candidate details"""
    id: int
    parent_candidate_id: int | None = None
    asset_id: int
    version_number: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class CandidateListResponse(BaseModel):
    """Response schema for listing candidates"""
    success: bool
    data: list[CandidateDetail] | None = None
    count: int = 0
    error: str | None = None


class CandidateResponse(BaseModel):
    """Response schema for single candidate operations"""
    success: bool
    data: CandidateDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
