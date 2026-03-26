from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class RecommendationCreate(BaseModel):
    """Schema for creating a new recommendation"""
    user_profile_id: int
    asset_id: int
    reason: str
    priority: str


class RecommendationUpdate(BaseModel):
    """Schema for updating a recommendation"""
    user_profile_id: int = None
    asset_id: int = None
    reason: str = None
    priority: str = None


# ==========================================
# Response Schemas
# ==========================================

class RecommendationDetail(BaseModel):
    """Schema for recommendation details"""
    id: int
    user_profile_id: int
    asset_id: int
    reason: str
    priority: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class RecommendationListResponse(BaseModel):
    """Response schema for listing recommendations"""
    success: bool
    data: list[RecommendationDetail] | None = None
    count: int = 0
    error: str | None = None


class RecommendationResponse(BaseModel):
    """Response schema for single recommendation operations"""
    success: bool
    data: RecommendationDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
