from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class BiomarkerAssociationCreate(BaseModel):
    """Schema for creating a new biomarker association"""
    biomarker_id: int
    indication_id: int | None = None
    phenotype_id: int | None = None
    correlation: str


class BiomarkerAssociationUpdate(BaseModel):
    """Schema for updating a biomarker association"""
    biomarker_id: int = None
    indication_id: int | None = None
    phenotype_id: int | None = None
    correlation: str = None


# ==========================================
# Response Schemas
# ==========================================

class BiomarkerAssociationDetail(BaseModel):
    """Schema for biomarker association details"""
    id: int
    biomarker_id: int
    indication_id: int | None = None
    phenotype_id: int | None = None
    correlation: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class BiomarkerAssociationListResponse(BaseModel):
    """Response schema for listing biomarker associations"""
    success: bool
    data: list[BiomarkerAssociationDetail] | None = None
    count: int = 0
    error: str | None = None


class BiomarkerAssociationResponse(BaseModel):
    """Response schema for single biomarker association operations"""
    success: bool
    data: BiomarkerAssociationDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
