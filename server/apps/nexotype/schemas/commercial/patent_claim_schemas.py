from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class PatentClaimCreate(BaseModel):
    """Schema for creating a new patent claim"""
    patent_id: int
    asset_id: int
    claim_type: str


class PatentClaimUpdate(BaseModel):
    """Schema for updating a patent claim"""
    patent_id: int = None
    asset_id: int = None
    claim_type: str = None


# ==========================================
# Response Schemas
# ==========================================

class PatentClaimDetail(BaseModel):
    """Schema for patent claim details"""
    id: int
    patent_id: int
    asset_id: int
    claim_type: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PatentClaimListResponse(BaseModel):
    """Response schema for listing patent claims"""
    success: bool
    data: list[PatentClaimDetail] | None = None
    count: int = 0
    error: str | None = None


class PatentClaimResponse(BaseModel):
    """Response schema for single patent claim operations"""
    success: bool
    data: PatentClaimDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
