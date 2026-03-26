from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class BiologicalRelationshipCreate(BaseModel):
    """Schema for creating a new biological relationship"""
    protein_a_id: int
    protein_b_id: int
    interaction_type: str


class BiologicalRelationshipUpdate(BaseModel):
    """Schema for updating a biological relationship"""
    protein_a_id: int = None
    protein_b_id: int = None
    interaction_type: str = None


# ==========================================
# Response Schemas
# ==========================================

class BiologicalRelationshipDetail(BaseModel):
    """Schema for biological relationship details"""
    id: int
    protein_a_id: int
    protein_b_id: int
    interaction_type: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class BiologicalRelationshipListResponse(BaseModel):
    """Response schema for listing biological relationships"""
    success: bool
    data: list[BiologicalRelationshipDetail] | None = None
    count: int = 0
    error: str | None = None


class BiologicalRelationshipResponse(BaseModel):
    """Response schema for single biological relationship operations"""
    success: bool
    data: BiologicalRelationshipDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
