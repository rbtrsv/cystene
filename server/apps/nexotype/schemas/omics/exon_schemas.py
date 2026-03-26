from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class ExonCreate(BaseModel):
    """Schema for creating a new exon"""
    transcript_id: int
    ensembl_exon_id: str
    start_position: int
    end_position: int


class ExonUpdate(BaseModel):
    """Schema for updating an exon"""
    transcript_id: int = None
    ensembl_exon_id: str = None
    start_position: int = None
    end_position: int = None


# ==========================================
# Response Schemas
# ==========================================

class ExonDetail(BaseModel):
    """Schema for exon details"""
    id: int
    transcript_id: int
    ensembl_exon_id: str
    start_position: int
    end_position: int
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ExonListResponse(BaseModel):
    """Response schema for listing exons"""
    success: bool
    data: list[ExonDetail] | None = None
    count: int = 0
    error: str | None = None


class ExonResponse(BaseModel):
    """Response schema for single exon operations"""
    success: bool
    data: ExonDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
