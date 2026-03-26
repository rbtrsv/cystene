from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class IndicationCreate(BaseModel):
    """Schema for creating a new indication"""
    name: str
    icd_10_code: str | None = None
    meddra_id: str | None = None


class IndicationUpdate(BaseModel):
    """Schema for updating an indication"""
    name: str = None
    icd_10_code: str | None = None
    meddra_id: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class IndicationDetail(BaseModel):
    """Schema for indication details"""
    id: int
    name: str
    icd_10_code: str | None = None
    meddra_id: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class IndicationListResponse(BaseModel):
    """Response schema for listing indications"""
    success: bool
    data: list[IndicationDetail] | None = None
    count: int = 0
    error: str | None = None


class IndicationResponse(BaseModel):
    """Response schema for single indication operations"""
    success: bool
    data: IndicationDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
