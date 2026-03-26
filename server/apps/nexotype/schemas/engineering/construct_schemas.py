from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class ConstructCreate(BaseModel):
    """Schema for creating a new construct"""
    candidate_id: int
    plasmid_map_url: str | None = None


class ConstructUpdate(BaseModel):
    """Schema for updating a construct"""
    candidate_id: int = None
    plasmid_map_url: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class ConstructDetail(BaseModel):
    """Schema for construct details"""
    id: int
    candidate_id: int
    plasmid_map_url: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ConstructListResponse(BaseModel):
    """Response schema for listing constructs"""
    success: bool
    data: list[ConstructDetail] | None = None
    count: int = 0
    error: str | None = None


class ConstructResponse(BaseModel):
    """Response schema for single construct operations"""
    success: bool
    data: ConstructDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
