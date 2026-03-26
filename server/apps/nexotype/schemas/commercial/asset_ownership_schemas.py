from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class AssetOwnershipCreate(BaseModel):
    """Schema for creating a new asset ownership"""
    market_organization_id: int
    asset_id: int
    ownership_type: str


class AssetOwnershipUpdate(BaseModel):
    """Schema for updating an asset ownership"""
    market_organization_id: int = None
    asset_id: int = None
    ownership_type: str = None


# ==========================================
# Response Schemas
# ==========================================

class AssetOwnershipDetail(BaseModel):
    """Schema for asset ownership details"""
    id: int
    market_organization_id: int
    asset_id: int
    ownership_type: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AssetOwnershipListResponse(BaseModel):
    """Response schema for listing asset ownerships"""
    success: bool
    data: list[AssetOwnershipDetail] | None = None
    count: int = 0
    error: str | None = None


class AssetOwnershipResponse(BaseModel):
    """Response schema for single asset ownership operations"""
    success: bool
    data: AssetOwnershipDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
