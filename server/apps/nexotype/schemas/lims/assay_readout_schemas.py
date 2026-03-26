from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class AssayReadoutCreate(BaseModel):
    """Schema for creating a new assay readout"""
    run_id: int
    biospecimen_id: int | None = None
    asset_id: int | None = None
    raw_value: float
    unit_id: int


class AssayReadoutUpdate(BaseModel):
    """Schema for updating an assay readout"""
    run_id: int = None
    biospecimen_id: int | None = None
    asset_id: int | None = None
    raw_value: float = None
    unit_id: int = None


# ==========================================
# Response Schemas
# ==========================================

class AssayReadoutDetail(BaseModel):
    """Schema for assay readout details"""
    id: int
    run_id: int
    biospecimen_id: int | None = None
    asset_id: int | None = None
    raw_value: float
    unit_id: int
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AssayReadoutListResponse(BaseModel):
    """Response schema for listing assay readouts"""
    success: bool
    data: list[AssayReadoutDetail] | None = None
    count: int = 0
    error: str | None = None


class AssayReadoutResponse(BaseModel):
    """Response schema for single assay readout operations"""
    success: bool
    data: AssayReadoutDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
