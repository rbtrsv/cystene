from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class TherapeuticEfficacyCreate(BaseModel):
    """Schema for creating a new therapeutic efficacy"""
    asset_id: int
    indication_id: int | None = None
    phenotype_id: int | None = None
    biomarker_id: int | None = None
    direction: str
    magnitude: str | None = None


class TherapeuticEfficacyUpdate(BaseModel):
    """Schema for updating a therapeutic efficacy"""
    asset_id: int = None
    indication_id: int | None = None
    phenotype_id: int | None = None
    biomarker_id: int | None = None
    direction: str = None
    magnitude: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class TherapeuticEfficacyDetail(BaseModel):
    """Schema for therapeutic efficacy details"""
    id: int
    asset_id: int
    indication_id: int | None = None
    phenotype_id: int | None = None
    biomarker_id: int | None = None
    direction: str
    magnitude: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TherapeuticEfficacyListResponse(BaseModel):
    """Response schema for listing therapeutic efficacies"""
    success: bool
    data: list[TherapeuticEfficacyDetail] | None = None
    count: int = 0
    error: str | None = None


class TherapeuticEfficacyResponse(BaseModel):
    """Response schema for single therapeutic efficacy operations"""
    success: bool
    data: TherapeuticEfficacyDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
