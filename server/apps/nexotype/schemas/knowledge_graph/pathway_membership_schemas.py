from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class PathwayMembershipCreate(BaseModel):
    """Schema for creating a new pathway membership"""
    protein_id: int
    pathway_id: int
    role: str | None = None


class PathwayMembershipUpdate(BaseModel):
    """Schema for updating a pathway membership"""
    protein_id: int = None
    pathway_id: int = None
    role: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class PathwayMembershipDetail(BaseModel):
    """Schema for pathway membership details"""
    id: int
    protein_id: int
    pathway_id: int
    role: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PathwayMembershipListResponse(BaseModel):
    """Response schema for listing pathway memberships"""
    success: bool
    data: list[PathwayMembershipDetail] | None = None
    count: int = 0
    error: str | None = None


class PathwayMembershipResponse(BaseModel):
    """Response schema for single pathway membership operations"""
    success: bool
    data: PathwayMembershipDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
