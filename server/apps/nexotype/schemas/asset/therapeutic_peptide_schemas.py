from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class TherapeuticPeptideCreate(BaseModel):
    """Schema for creating a new therapeutic peptide"""
    uid: str
    name: str
    project_code: str | None = None
    sequence_aa: str
    purity_grade: str | None = None


class TherapeuticPeptideUpdate(BaseModel):
    """Schema for updating a therapeutic peptide"""
    uid: str = None
    name: str = None
    project_code: str | None = None
    sequence_aa: str = None
    purity_grade: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class TherapeuticPeptideDetail(BaseModel):
    """Schema for therapeutic peptide details"""
    id: int
    uid: str
    name: str
    project_code: str | None = None
    asset_type: str
    sequence_aa: str
    purity_grade: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TherapeuticPeptideListResponse(BaseModel):
    """Response schema for listing therapeutic peptides"""
    success: bool
    data: list[TherapeuticPeptideDetail] | None = None
    count: int = 0
    error: str | None = None


class TherapeuticPeptideResponse(BaseModel):
    """Response schema for single therapeutic peptide operations"""
    success: bool
    data: TherapeuticPeptideDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
