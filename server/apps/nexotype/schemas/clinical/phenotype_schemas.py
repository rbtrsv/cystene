from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class PhenotypeCreate(BaseModel):
    """Schema for creating a new phenotype"""
    name: str
    hpo_id: str | None = None


class PhenotypeUpdate(BaseModel):
    """Schema for updating a phenotype"""
    name: str = None
    hpo_id: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class PhenotypeDetail(BaseModel):
    """Schema for phenotype details"""
    id: int
    name: str
    hpo_id: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PhenotypeListResponse(BaseModel):
    """Response schema for listing phenotypes"""
    success: bool
    data: list[PhenotypeDetail] | None = None
    count: int = 0
    error: str | None = None


class PhenotypeResponse(BaseModel):
    """Response schema for single phenotype operations"""
    success: bool
    data: PhenotypeDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
