from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class DesignMutationCreate(BaseModel):
    """Schema for creating a new design mutation"""
    candidate_id: int
    position: int
    wild_type: str
    mutant: str


class DesignMutationUpdate(BaseModel):
    """Schema for updating a design mutation"""
    candidate_id: int = None
    position: int = None
    wild_type: str = None
    mutant: str = None


# ==========================================
# Response Schemas
# ==========================================

class DesignMutationDetail(BaseModel):
    """Schema for design mutation details"""
    id: int
    candidate_id: int
    position: int
    wild_type: str
    mutant: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class DesignMutationListResponse(BaseModel):
    """Response schema for listing design mutations"""
    success: bool
    data: list[DesignMutationDetail] | None = None
    count: int = 0
    error: str | None = None


class DesignMutationResponse(BaseModel):
    """Response schema for single design mutation operations"""
    success: bool
    data: DesignMutationDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
