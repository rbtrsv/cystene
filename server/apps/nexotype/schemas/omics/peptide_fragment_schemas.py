from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class PeptideFragmentCreate(BaseModel):
    """Schema for creating a new peptide fragment"""
    protein_id: int
    sequence: str


class PeptideFragmentUpdate(BaseModel):
    """Schema for updating a peptide fragment"""
    protein_id: int = None
    sequence: str = None


# ==========================================
# Response Schemas
# ==========================================

class PeptideFragmentDetail(BaseModel):
    """Schema for peptide fragment details"""
    id: int
    protein_id: int
    sequence: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PeptideFragmentListResponse(BaseModel):
    """Response schema for listing peptide fragments"""
    success: bool
    data: list[PeptideFragmentDetail] | None = None
    count: int = 0
    error: str | None = None


class PeptideFragmentResponse(BaseModel):
    """Response schema for single peptide fragment operations"""
    success: bool
    data: PeptideFragmentDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
