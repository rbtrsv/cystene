from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class GenomicAssociationCreate(BaseModel):
    """Schema for creating a new genomic association"""
    variant_id: int
    indication_id: int
    odds_ratio: float | None = None


class GenomicAssociationUpdate(BaseModel):
    """Schema for updating a genomic association"""
    variant_id: int = None
    indication_id: int = None
    odds_ratio: float | None = None


# ==========================================
# Response Schemas
# ==========================================

class GenomicAssociationDetail(BaseModel):
    """Schema for genomic association details"""
    id: int
    variant_id: int
    indication_id: int
    odds_ratio: float | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class GenomicAssociationListResponse(BaseModel):
    """Response schema for listing genomic associations"""
    success: bool
    data: list[GenomicAssociationDetail] | None = None
    count: int = 0
    error: str | None = None


class GenomicAssociationResponse(BaseModel):
    """Response schema for single genomic association operations"""
    success: bool
    data: GenomicAssociationDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
