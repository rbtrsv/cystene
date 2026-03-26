from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class DrugTargetMechanismCreate(BaseModel):
    """Schema for creating a new drug target mechanism"""
    asset_id: int
    protein_id: int
    mechanism: str
    affinity_value: float | None = None


class DrugTargetMechanismUpdate(BaseModel):
    """Schema for updating a drug target mechanism"""
    asset_id: int = None
    protein_id: int = None
    mechanism: str = None
    affinity_value: float | None = None


# ==========================================
# Response Schemas
# ==========================================

class DrugTargetMechanismDetail(BaseModel):
    """Schema for drug target mechanism details"""
    id: int
    asset_id: int
    protein_id: int
    mechanism: str
    affinity_value: float | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class DrugTargetMechanismListResponse(BaseModel):
    """Response schema for listing drug target mechanisms"""
    success: bool
    data: list[DrugTargetMechanismDetail] | None = None
    count: int = 0
    error: str | None = None


class DrugTargetMechanismResponse(BaseModel):
    """Response schema for single drug target mechanism operations"""
    success: bool
    data: DrugTargetMechanismDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
