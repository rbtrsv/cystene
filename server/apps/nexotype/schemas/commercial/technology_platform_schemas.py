from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class TechnologyPlatformCreate(BaseModel):
    """Schema for creating a new technology platform"""
    name: str
    category: str
    readiness_level: int | None = None
    description: str | None = None


class TechnologyPlatformUpdate(BaseModel):
    """Schema for updating a technology platform"""
    name: str = None
    category: str = None
    readiness_level: int | None = None
    description: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class TechnologyPlatformDetail(BaseModel):
    """Schema for technology platform details"""
    id: int
    name: str
    category: str
    readiness_level: int | None = None
    description: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TechnologyPlatformListResponse(BaseModel):
    """Response schema for listing technology platforms"""
    success: bool
    data: list[TechnologyPlatformDetail] | None = None
    count: int = 0
    error: str | None = None


class TechnologyPlatformResponse(BaseModel):
    """Response schema for single technology platform operations"""
    success: bool
    data: TechnologyPlatformDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
