from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class AssayProtocolCreate(BaseModel):
    """Schema for creating a new assay protocol"""
    name: str
    version: str
    method_description: str | None = None


class AssayProtocolUpdate(BaseModel):
    """Schema for updating an assay protocol"""
    name: str = None
    version: str = None
    method_description: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class AssayProtocolDetail(BaseModel):
    """Schema for assay protocol details"""
    id: int
    name: str
    version: str
    method_description: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AssayProtocolListResponse(BaseModel):
    """Response schema for listing assay protocols"""
    success: bool
    data: list[AssayProtocolDetail] | None = None
    count: int = 0
    error: str | None = None


class AssayProtocolResponse(BaseModel):
    """Response schema for single assay protocol operations"""
    success: bool
    data: AssayProtocolDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
