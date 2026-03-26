from ninja import Schema
from typing import List, Optional, Dict, Any

class GeneBase(Schema):
    """Base schema for gene data"""
    name: str
    ensembl_id: str
    chromosome: str
    start_position: int
    end_position: int
    species: str = "Homo sapiens"
    gene_type: Optional[str] = None

class GeneCreate(GeneBase):
    """Schema for creating a new gene"""
    pass

class GeneUpdate(Schema):
    """Schema for updating a gene"""
    name: Optional[str] = None
    ensembl_id: Optional[str] = None
    chromosome: Optional[str] = None
    start_position: Optional[int] = None
    end_position: Optional[int] = None
    species: Optional[str] = None
    gene_type: Optional[str] = None

class GeneDetail(GeneBase):
    """Schema for gene details"""
    uid: str
    created_at: str

class GeneResponse(Schema):
    """Response schema for gene operations"""
    success: bool
    data: Optional[GeneDetail] = None
    error: Optional[str] = None

class GeneListResponse(Schema):
    """Response schema for listing genes"""
    success: bool
    data: Optional[List[GeneDetail]] = None
    count: int = 0
    error: Optional[str] = None

class GeneSearchParams(Schema):
    """Schema for gene search parameters"""
    name: Optional[str] = None
    ensembl_id: Optional[str] = None
    chromosome: Optional[str] = None
    start_position_min: Optional[int] = None
    start_position_max: Optional[int] = None
    end_position_min: Optional[int] = None
    end_position_max: Optional[int] = None
    species: Optional[str] = None
    gene_type: Optional[str] = None
    associated_disease: Optional[str] = None
    in_pathway: Optional[str] = None