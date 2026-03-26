from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class DrugInteractionCreate(BaseModel):
    """Schema for creating a new drug interaction"""
    asset_a_id: int
    asset_b_id: int
    interaction_type: str


class DrugInteractionUpdate(BaseModel):
    """Schema for updating a drug interaction"""
    asset_a_id: int = None
    asset_b_id: int = None
    interaction_type: str = None


# ==========================================
# Response Schemas
# ==========================================

class DrugInteractionDetail(BaseModel):
    """Schema for drug interaction details"""
    id: int
    asset_a_id: int
    asset_b_id: int
    interaction_type: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class DrugInteractionListResponse(BaseModel):
    """Response schema for listing drug interactions"""
    success: bool
    data: list[DrugInteractionDetail] | None = None
    count: int = 0
    error: str | None = None


class DrugInteractionResponse(BaseModel):
    """Response schema for single drug interaction operations"""
    success: bool
    data: DrugInteractionDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
