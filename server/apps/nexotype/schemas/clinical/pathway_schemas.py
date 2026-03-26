from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class PathwayCreate(BaseModel):
    """Schema for creating a new pathway"""
    name: str
    kegg_id: str | None = None
    longevity_tier: str | None = None


class PathwayUpdate(BaseModel):
    """Schema for updating a pathway"""
    name: str = None
    kegg_id: str | None = None
    longevity_tier: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class PathwayDetail(BaseModel):
    """Schema for pathway details"""
    id: int
    name: str
    kegg_id: str | None = None
    longevity_tier: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PathwayListResponse(BaseModel):
    """Response schema for listing pathways"""
    success: bool
    data: list[PathwayDetail] | None = None
    count: int = 0
    error: str | None = None


class PathwayResponse(BaseModel):
    """Response schema for single pathway operations"""
    success: bool
    data: PathwayDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
