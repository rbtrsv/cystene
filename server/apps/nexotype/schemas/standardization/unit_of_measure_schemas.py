from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class UnitOfMeasureCreate(BaseModel):
    """Schema for creating a new unit of measure"""
    symbol: str
    name: str
    si_conversion_factor: float | None = None


class UnitOfMeasureUpdate(BaseModel):
    """Schema for updating a unit of measure"""
    symbol: str = None
    name: str = None
    si_conversion_factor: float | None = None


# ==========================================
# Response Schemas
# ==========================================

class UnitOfMeasureDetail(BaseModel):
    """Schema for unit of measure details"""
    id: int
    symbol: str
    name: str
    si_conversion_factor: float | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UnitOfMeasureListResponse(BaseModel):
    """Response schema for listing units of measure"""
    success: bool
    data: list[UnitOfMeasureDetail] | None = None
    count: int = 0
    error: str | None = None


class UnitOfMeasureResponse(BaseModel):
    """Response schema for single unit of measure operations"""
    success: bool
    data: UnitOfMeasureDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
