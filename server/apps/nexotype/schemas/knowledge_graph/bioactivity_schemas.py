from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class BioActivityCreate(BaseModel):
    """Schema for creating a new bioactivity"""
    asset_id: int
    pathway_id: int
    activity_type: str


class BioActivityUpdate(BaseModel):
    """Schema for updating a bioactivity"""
    asset_id: int = None
    pathway_id: int = None
    activity_type: str = None


# ==========================================
# Response Schemas
# ==========================================

class BioActivityDetail(BaseModel):
    """Schema for bioactivity details"""
    id: int
    asset_id: int
    pathway_id: int
    activity_type: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class BioActivityListResponse(BaseModel):
    """Response schema for listing bioactivities"""
    success: bool
    data: list[BioActivityDetail] | None = None
    count: int = 0
    error: str | None = None


class BioActivityResponse(BaseModel):
    """Response schema for single bioactivity operations"""
    success: bool
    data: BioActivityDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
