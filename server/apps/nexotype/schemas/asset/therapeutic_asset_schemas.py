from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class TherapeuticAssetCreate(BaseModel):
    """Schema for creating a new therapeutic asset"""
    uid: str
    name: str
    project_code: str | None = None
    asset_type: str


class TherapeuticAssetUpdate(BaseModel):
    """Schema for updating a therapeutic asset"""
    uid: str = None
    name: str = None
    project_code: str | None = None
    asset_type: str = None


# ==========================================
# Response Schemas
# ==========================================

class TherapeuticAssetDetail(BaseModel):
    """Schema for therapeutic asset details"""
    id: int
    uid: str
    name: str
    project_code: str | None = None
    asset_type: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TherapeuticAssetListResponse(BaseModel):
    """Response schema for listing therapeutic assets"""
    success: bool
    data: list[TherapeuticAssetDetail] | None = None
    count: int = 0
    error: str | None = None


class TherapeuticAssetResponse(BaseModel):
    """Response schema for single therapeutic asset operations"""
    success: bool
    data: TherapeuticAssetDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
