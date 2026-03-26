from ninja import Schema
from typing import List, Optional, Dict, Any

class ProteinBase(Schema):
    """Base schema for protein data"""
    uniprot_id: str
    name: str
    sequence: str
    molecular_weight: float
    isoelectric_point: Optional[float] = None

class ProteinCreate(ProteinBase):
    """Schema for creating a new protein"""
    gene_ids: Optional[List[str]] = None

class ProteinUpdate(Schema):
    """Schema for updating a protein"""
    uniprot_id: Optional[str] = None
    name: Optional[str] = None
    sequence: Optional[str] = None
    molecular_weight: Optional[float] = None
    isoelectric_point: Optional[float] = None

class ProteinDetail(ProteinBase):
    """Schema for protein details"""
    uid: str
    created_at: str

class ProteinResponse(Schema):
    """Response schema for protein operations"""
    success: bool
    data: Optional[ProteinDetail] = None
    error: Optional[str] = None

class ProteinListResponse(Schema):
    """Response schema for listing proteins"""
    success: bool
    data: Optional[List[ProteinDetail]] = None
    count: int = 0
    error: Optional[str] = None

class ProteinSearchParams(Schema):
    """Schema for protein search parameters"""
    name: Optional[str] = None
    uniprot_id: Optional[str] = None
    min_molecular_weight: Optional[float] = None
    max_molecular_weight: Optional[float] = None
    from_gene: Optional[str] = None
    has_domain: Optional[str] = None
    in_pathway: Optional[str] = None