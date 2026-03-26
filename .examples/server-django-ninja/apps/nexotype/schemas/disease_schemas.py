from ninja import Schema
from typing import List, Optional, Dict, Any

class DiseaseBase(Schema):
    """Base schema for disease data"""
    name: str
    omim_id: Optional[str] = None
    description: Optional[str] = None
    disease_class: Optional[str] = None

class DiseaseCreate(DiseaseBase):
    """Schema for creating a new disease"""
    pass

class DiseaseUpdate(Schema):
    """Schema for updating a disease"""
    name: Optional[str] = None
    omim_id: Optional[str] = None
    description: Optional[str] = None
    disease_class: Optional[str] = None

class DiseaseDetail(DiseaseBase):
    """Schema for disease details"""
    uid: str
    created_at: str

class DiseaseResponse(Schema):
    """Response schema for disease operations"""
    success: bool
    data: Optional[DiseaseDetail] = None
    error: Optional[str] = None

class DiseaseListResponse(Schema):
    """Response schema for listing diseases"""
    success: bool
    data: Optional[List[DiseaseDetail]] = None
    count: int = 0
    error: Optional[str] = None

class DiseaseSearchParams(Schema):
    """Schema for disease search parameters"""
    name: Optional[str] = None
    omim_id: Optional[str] = None
    disease_class: Optional[str] = None
    associated_gene: Optional[str] = None
    has_biomarker: Optional[str] = None