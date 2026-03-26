from ninja import Schema
from typing import List, Optional, Dict, Any

class PathwayBase(Schema):
    """Base schema for pathway data"""
    name: str
    kegg_id: str
    description: Optional[str] = None
    pathway_type: Optional[str] = None

class PathwayCreate(PathwayBase):
    """Schema for creating a new pathway"""
    pass

class PathwayUpdate(Schema):
    """Schema for updating a pathway"""
    name: Optional[str] = None
    kegg_id: Optional[str] = None
    description: Optional[str] = None
    pathway_type: Optional[str] = None

class PathwayDetail(PathwayBase):
    """Schema for pathway details"""
    uid: str
    created_at: str

class PathwayResponse(Schema):
    """Response schema for pathway operations"""
    success: bool
    data: Optional[PathwayDetail] = None
    error: Optional[str] = None

class PathwayListResponse(Schema):
    """Response schema for listing pathways"""
    success: bool
    data: Optional[List[PathwayDetail]] = None
    count: int = 0
    error: Optional[str] = None

class PathwaySearchParams(Schema):
    """Schema for pathway search parameters"""
    name: Optional[str] = None
    kegg_id: Optional[str] = None
    pathway_type: Optional[str] = None
    has_gene: Optional[str] = None
    has_protein: Optional[str] = None