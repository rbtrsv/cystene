from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class AssayRunCreate(BaseModel):
    """Schema for creating a new assay run"""
    protocol_id: int
    run_date: datetime
    operator_id: int | None = None


class AssayRunUpdate(BaseModel):
    """Schema for updating an assay run"""
    protocol_id: int = None
    run_date: datetime = None
    operator_id: int | None = None


# ==========================================
# Response Schemas
# ==========================================

class AssayRunDetail(BaseModel):
    """Schema for assay run details"""
    id: int
    protocol_id: int
    run_date: datetime
    operator_id: int | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AssayRunListResponse(BaseModel):
    """Response schema for listing assay runs"""
    success: bool
    data: list[AssayRunDetail] | None = None
    count: int = 0
    error: str | None = None


class AssayRunResponse(BaseModel):
    """Response schema for single assay run operations"""
    success: bool
    data: AssayRunDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
