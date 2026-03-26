from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class VariantCreate(BaseModel):
    """Schema for creating a new variant"""
    gene_id: int
    db_snp_id: str
    hgvs_c: str | None = None
    hgvs_p: str | None = None


class VariantUpdate(BaseModel):
    """Schema for updating a variant"""
    gene_id: int = None
    db_snp_id: str = None
    hgvs_c: str | None = None
    hgvs_p: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class VariantDetail(BaseModel):
    """Schema for variant details"""
    id: int
    gene_id: int
    db_snp_id: str
    hgvs_c: str | None = None
    hgvs_p: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class VariantListResponse(BaseModel):
    """Response schema for listing variants"""
    success: bool
    data: list[VariantDetail] | None = None
    count: int = 0
    error: str | None = None


class VariantResponse(BaseModel):
    """Response schema for single variant operations"""
    success: bool
    data: VariantDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
