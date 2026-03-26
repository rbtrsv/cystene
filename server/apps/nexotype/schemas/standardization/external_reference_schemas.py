from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class ExternalReferenceCreate(BaseModel):
    """Schema for creating a new external reference"""
    entity_type: str
    entity_id: int
    source: str
    external_id: str


class ExternalReferenceUpdate(BaseModel):
    """Schema for updating an external reference"""
    entity_type: str = None
    entity_id: int = None
    source: str = None
    external_id: str = None


# ==========================================
# Response Schemas
# ==========================================

class ExternalReferenceDetail(BaseModel):
    """Schema for external reference details"""
    id: int
    entity_type: str
    entity_id: int
    source: str
    external_id: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ExternalReferenceListResponse(BaseModel):
    """Response schema for listing external references"""
    success: bool
    data: list[ExternalReferenceDetail] | None = None
    count: int = 0
    error: str | None = None


class ExternalReferenceResponse(BaseModel):
    """Response schema for single external reference operations"""
    success: bool
    data: ExternalReferenceDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
