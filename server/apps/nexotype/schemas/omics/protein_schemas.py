from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class ProteinCreate(BaseModel):
    """Schema for creating a new protein"""
    transcript_id: int
    uniprot_accession: str
    sequence_aa: str


class ProteinUpdate(BaseModel):
    """Schema for updating a protein"""
    transcript_id: int = None
    uniprot_accession: str = None
    sequence_aa: str = None


# ==========================================
# Response Schemas
# ==========================================

class ProteinDetail(BaseModel):
    """Schema for protein details"""
    id: int
    transcript_id: int
    uniprot_accession: str
    sequence_aa: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ProteinListResponse(BaseModel):
    """Response schema for listing proteins"""
    success: bool
    data: list[ProteinDetail] | None = None
    count: int = 0
    error: str | None = None


class ProteinResponse(BaseModel):
    """Response schema for single protein operations"""
    success: bool
    data: ProteinDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
