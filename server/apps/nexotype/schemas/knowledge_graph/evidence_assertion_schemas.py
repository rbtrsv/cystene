from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class EvidenceAssertionCreate(BaseModel):
    """Schema for creating a new evidence assertion"""
    relationship_table: str
    relationship_id: int
    source_id: int
    confidence_score: float


class EvidenceAssertionUpdate(BaseModel):
    """Schema for updating an evidence assertion"""
    relationship_table: str = None
    relationship_id: int = None
    source_id: int = None
    confidence_score: float = None


# ==========================================
# Response Schemas
# ==========================================

class EvidenceAssertionDetail(BaseModel):
    """Schema for evidence assertion details"""
    id: int
    relationship_table: str
    relationship_id: int
    source_id: int
    confidence_score: float
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class EvidenceAssertionListResponse(BaseModel):
    """Response schema for listing evidence assertions"""
    success: bool
    data: list[EvidenceAssertionDetail] | None = None
    count: int = 0
    error: str | None = None


class EvidenceAssertionResponse(BaseModel):
    """Response schema for single evidence assertion operations"""
    success: bool
    data: EvidenceAssertionDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
