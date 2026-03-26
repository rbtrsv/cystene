from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class BiologicCreate(BaseModel):
    """Schema for creating a new biologic"""
    uid: str
    name: str
    project_code: str | None = None
    sequence_aa: str
    biologic_type: str


class BiologicUpdate(BaseModel):
    """Schema for updating a biologic"""
    uid: str = None
    name: str = None
    project_code: str | None = None
    sequence_aa: str = None
    biologic_type: str = None


# ==========================================
# Response Schemas
# ==========================================

class BiologicDetail(BaseModel):
    """Schema for biologic details"""
    id: int
    uid: str
    name: str
    project_code: str | None = None
    asset_type: str
    sequence_aa: str
    biologic_type: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class BiologicListResponse(BaseModel):
    """Response schema for listing biologics"""
    success: bool
    data: list[BiologicDetail] | None = None
    count: int = 0
    error: str | None = None


class BiologicResponse(BaseModel):
    """Response schema for single biologic operations"""
    success: bool
    data: BiologicDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
