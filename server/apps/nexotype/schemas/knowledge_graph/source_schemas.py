from pydantic import BaseModel, ConfigDict
from datetime import date, datetime

# ==========================================
# Request Schemas
# ==========================================

class SourceCreate(BaseModel):
    """Schema for creating a new source"""
    source_type: str
    external_id: str
    title: str | None = None
    authors: str | None = None
    journal: str | None = None
    publication_date: date | None = None
    url: str | None = None


class SourceUpdate(BaseModel):
    """Schema for updating a source"""
    source_type: str = None
    external_id: str = None
    title: str | None = None
    authors: str | None = None
    journal: str | None = None
    publication_date: date | None = None
    url: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class SourceDetail(BaseModel):
    """Schema for source details"""
    id: int
    source_type: str
    external_id: str
    title: str | None = None
    authors: str | None = None
    journal: str | None = None
    publication_date: date | None = None
    url: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class SourceListResponse(BaseModel):
    """Response schema for listing sources"""
    success: bool
    data: list[SourceDetail] | None = None
    count: int = 0
    error: str | None = None


class SourceResponse(BaseModel):
    """Response schema for single source operations"""
    success: bool
    data: SourceDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
