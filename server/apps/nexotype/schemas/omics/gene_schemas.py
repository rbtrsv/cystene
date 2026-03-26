from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class GeneCreate(BaseModel):
    """Schema for creating a new gene"""
    organism_id: int
    hgnc_symbol: str
    ensembl_gene_id: str
    chromosome: str


class GeneUpdate(BaseModel):
    """Schema for updating a gene"""
    organism_id: int = None
    hgnc_symbol: str = None
    ensembl_gene_id: str = None
    chromosome: str = None


# ==========================================
# Response Schemas
# ==========================================

class GeneDetail(BaseModel):
    """Schema for gene details"""
    id: int
    organism_id: int
    hgnc_symbol: str
    ensembl_gene_id: str
    chromosome: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class GeneListResponse(BaseModel):
    """Response schema for listing genes"""
    success: bool
    data: list[GeneDetail] | None = None
    count: int = 0
    error: str | None = None


class GeneResponse(BaseModel):
    """Response schema for single gene operations"""
    success: bool
    data: GeneDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
