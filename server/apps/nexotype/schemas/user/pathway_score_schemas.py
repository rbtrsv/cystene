from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class PathwayScoreCreate(BaseModel):
    """Schema for creating a new pathway score"""
    subject_id: int
    pathway_id: int
    score: float
    calculated_at: datetime


class PathwayScoreUpdate(BaseModel):
    """Schema for updating a pathway score"""
    subject_id: int = None
    pathway_id: int = None
    score: float = None
    calculated_at: datetime = None


# ==========================================
# Response Schemas
# ==========================================

class PathwayScoreDetail(BaseModel):
    """Schema for pathway score details"""
    id: int
    subject_id: int
    pathway_id: int
    score: float
    calculated_at: datetime
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PathwayScoreListResponse(BaseModel):
    """Response schema for listing pathway scores"""
    success: bool
    data: list[PathwayScoreDetail] | None = None
    count: int = 0
    error: str | None = None


class PathwayScoreResponse(BaseModel):
    """Response schema for single pathway score operations"""
    success: bool
    data: PathwayScoreDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
