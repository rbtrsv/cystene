from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class BiospecimenCreate(BaseModel):
    """Schema for creating a new biospecimen"""
    subject_id: int
    barcode: str
    sample_type: str
    freezer_location: str | None = None


class BiospecimenUpdate(BaseModel):
    """Schema for updating a biospecimen"""
    subject_id: int = None
    barcode: str = None
    sample_type: str = None
    freezer_location: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class BiospecimenDetail(BaseModel):
    """Schema for biospecimen details"""
    id: int
    subject_id: int
    barcode: str
    sample_type: str
    freezer_location: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class BiospecimenListResponse(BaseModel):
    """Response schema for listing biospecimens"""
    success: bool
    data: list[BiospecimenDetail] | None = None
    count: int = 0
    error: str | None = None


class BiospecimenResponse(BaseModel):
    """Response schema for single biospecimen operations"""
    success: bool
    data: BiospecimenDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
