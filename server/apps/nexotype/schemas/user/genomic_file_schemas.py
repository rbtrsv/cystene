from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class GenomicFileCreate(BaseModel):
    """Schema for creating a new genomic file"""
    subject_id: int
    file_url: str
    status: str


class GenomicFileUpdate(BaseModel):
    """Schema for updating a genomic file"""
    subject_id: int = None
    file_url: str = None
    status: str = None


# ==========================================
# Response Schemas
# ==========================================

class GenomicFileDetail(BaseModel):
    """Schema for genomic file details"""
    id: int
    subject_id: int
    file_url: str
    status: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class GenomicFileListResponse(BaseModel):
    """Response schema for listing genomic files"""
    success: bool
    data: list[GenomicFileDetail] | None = None
    count: int = 0
    error: str | None = None


class GenomicFileResponse(BaseModel):
    """Response schema for single genomic file operations"""
    success: bool
    data: GenomicFileDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
