from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class TranscriptCreate(BaseModel):
    """Schema for creating a new transcript"""
    gene_id: int
    ensembl_transcript_id: str
    is_canonical: bool = False


class TranscriptUpdate(BaseModel):
    """Schema for updating a transcript"""
    gene_id: int = None
    ensembl_transcript_id: str = None
    is_canonical: bool = None


# ==========================================
# Response Schemas
# ==========================================

class TranscriptDetail(BaseModel):
    """Schema for transcript details"""
    id: int
    gene_id: int
    ensembl_transcript_id: str
    is_canonical: bool
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TranscriptListResponse(BaseModel):
    """Response schema for listing transcripts"""
    success: bool
    data: list[TranscriptDetail] | None = None
    count: int = 0
    error: str | None = None


class TranscriptResponse(BaseModel):
    """Response schema for single transcript operations"""
    success: bool
    data: TranscriptDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
