from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class OligonucleotideCreate(BaseModel):
    """Schema for creating a new oligonucleotide"""
    uid: str
    name: str
    project_code: str | None = None
    sequence_na: str
    modification_type: str | None = None


class OligonucleotideUpdate(BaseModel):
    """Schema for updating an oligonucleotide"""
    uid: str = None
    name: str = None
    project_code: str | None = None
    sequence_na: str = None
    modification_type: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class OligonucleotideDetail(BaseModel):
    """Schema for oligonucleotide details"""
    id: int
    uid: str
    name: str
    project_code: str | None = None
    asset_type: str
    sequence_na: str
    modification_type: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class OligonucleotideListResponse(BaseModel):
    """Response schema for listing oligonucleotides"""
    success: bool
    data: list[OligonucleotideDetail] | None = None
    count: int = 0
    error: str | None = None


class OligonucleotideResponse(BaseModel):
    """Response schema for single oligonucleotide operations"""
    success: bool
    data: OligonucleotideDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
