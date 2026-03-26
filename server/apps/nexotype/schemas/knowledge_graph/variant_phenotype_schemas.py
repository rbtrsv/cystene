from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class VariantPhenotypeCreate(BaseModel):
    """Schema for creating a new variant phenotype"""
    variant_id: int
    phenotype_id: int
    effect_size: str | None = None


class VariantPhenotypeUpdate(BaseModel):
    """Schema for updating a variant phenotype"""
    variant_id: int = None
    phenotype_id: int = None
    effect_size: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class VariantPhenotypeDetail(BaseModel):
    """Schema for variant phenotype details"""
    id: int
    variant_id: int
    phenotype_id: int
    effect_size: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class VariantPhenotypeListResponse(BaseModel):
    """Response schema for listing variant phenotypes"""
    success: bool
    data: list[VariantPhenotypeDetail] | None = None
    count: int = 0
    error: str | None = None


class VariantPhenotypeResponse(BaseModel):
    """Response schema for single variant phenotype operations"""
    success: bool
    data: VariantPhenotypeDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
