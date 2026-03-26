from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class AssetTechnologyPlatformCreate(BaseModel):
    """Schema for creating a new asset technology platform link"""
    asset_id: int
    technology_platform_id: int
    role: str


class AssetTechnologyPlatformUpdate(BaseModel):
    """Schema for updating an asset technology platform link"""
    asset_id: int = None
    technology_platform_id: int = None
    role: str = None


# ==========================================
# Response Schemas
# ==========================================

class AssetTechnologyPlatformDetail(BaseModel):
    """Schema for asset technology platform details"""
    id: int
    asset_id: int
    technology_platform_id: int
    role: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AssetTechnologyPlatformListResponse(BaseModel):
    """Response schema for listing asset technology platforms"""
    success: bool
    data: list[AssetTechnologyPlatformDetail] | None = None
    count: int = 0
    error: str | None = None


class AssetTechnologyPlatformResponse(BaseModel):
    """Response schema for single asset technology platform operations"""
    success: bool
    data: AssetTechnologyPlatformDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
