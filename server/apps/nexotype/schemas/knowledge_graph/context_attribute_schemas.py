from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class ContextAttributeCreate(BaseModel):
    """Schema for creating a new context attribute"""
    evidence_id: int
    key: str
    value: str


class ContextAttributeUpdate(BaseModel):
    """Schema for updating a context attribute"""
    evidence_id: int = None
    key: str = None
    value: str = None


# ==========================================
# Response Schemas
# ==========================================

class ContextAttributeDetail(BaseModel):
    """Schema for context attribute details"""
    id: int
    evidence_id: int
    key: str
    value: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ContextAttributeListResponse(BaseModel):
    """Response schema for listing context attributes"""
    success: bool
    data: list[ContextAttributeDetail] | None = None
    count: int = 0
    error: str | None = None


class ContextAttributeResponse(BaseModel):
    """Response schema for single context attribute operations"""
    success: bool
    data: ContextAttributeDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
