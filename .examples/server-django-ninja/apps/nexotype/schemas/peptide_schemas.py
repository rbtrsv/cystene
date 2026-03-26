from ninja import Schema
from typing import List, Optional, Dict, Any

class PeptideBase(Schema):
    """Base schema for peptide data"""
    sequence: str
    length: int
    molecular_weight: float
    isoelectric_point: Optional[float] = None

class PeptideCreate(PeptideBase):
    """Schema for creating a new peptide"""
    predicted_activities: Optional[List[str]] = None
    synthesis_difficulty: Optional[int] = None
    stability_score: Optional[float] = None

class PeptideUpdate(Schema):
    """Schema for updating a peptide"""
    sequence: Optional[str] = None
    length: Optional[int] = None
    molecular_weight: Optional[float] = None
    isoelectric_point: Optional[float] = None
    predicted_activities: Optional[List[str]] = None
    synthesis_difficulty: Optional[int] = None
    stability_score: Optional[float] = None

class PeptideDetail(PeptideBase):
    """Schema for peptide details"""
    uid: str
    predicted_activities: Optional[List[str]] = None
    synthesis_difficulty: Optional[int] = None
    stability_score: Optional[float] = None
    created_at: str

class PeptideResponse(Schema):
    """Response schema for peptide operations"""
    success: bool
    data: Optional[PeptideDetail] = None
    error: Optional[str] = None

class PeptideListResponse(Schema):
    """Response schema for listing peptides"""
    success: bool
    data: Optional[List[PeptideDetail]] = None
    count: int = 0
    error: Optional[str] = None

class PeptideSearchParams(Schema):
    """Schema for peptide search parameters"""
    sequence_pattern: Optional[str] = None
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    min_molecular_weight: Optional[float] = None
    max_molecular_weight: Optional[float] = None
    min_stability: Optional[float] = None
    has_activity: Optional[str] = None
    from_protein: Optional[str] = None

class SimilarPeptideDetail(Schema):
    """Schema for similar peptide with similarity score"""
    peptide: PeptideDetail
    similarity_score: float