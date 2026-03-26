from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class ProteinDomainCreate(BaseModel):
    """Schema for creating a new protein domain"""
    protein_id: int
    pfam_id: str
    name: str


class ProteinDomainUpdate(BaseModel):
    """Schema for updating a protein domain"""
    protein_id: int = None
    pfam_id: str = None
    name: str = None


# ==========================================
# Response Schemas
# ==========================================

class ProteinDomainDetail(BaseModel):
    """Schema for protein domain details"""
    id: int
    protein_id: int
    pfam_id: str
    name: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ProteinDomainListResponse(BaseModel):
    """Response schema for listing protein domains"""
    success: bool
    data: list[ProteinDomainDetail] | None = None
    count: int = 0
    error: str | None = None


class ProteinDomainResponse(BaseModel):
    """Response schema for single protein domain operations"""
    success: bool
    data: ProteinDomainDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
