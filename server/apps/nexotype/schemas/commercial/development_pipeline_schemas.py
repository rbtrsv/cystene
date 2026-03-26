from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class DevelopmentPipelineCreate(BaseModel):
    """Schema for creating a new development pipeline"""
    asset_id: int
    indication_id: int
    phase: str
    status: str
    nct_number: str | None = None


class DevelopmentPipelineUpdate(BaseModel):
    """Schema for updating a development pipeline"""
    asset_id: int = None
    indication_id: int = None
    phase: str = None
    status: str = None
    nct_number: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class DevelopmentPipelineDetail(BaseModel):
    """Schema for development pipeline details"""
    id: int
    asset_id: int
    indication_id: int
    phase: str
    status: str
    nct_number: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class DevelopmentPipelineListResponse(BaseModel):
    """Response schema for listing development pipelines"""
    success: bool
    data: list[DevelopmentPipelineDetail] | None = None
    count: int = 0
    error: str | None = None


class DevelopmentPipelineResponse(BaseModel):
    """Response schema for single development pipeline operations"""
    success: bool
    data: DevelopmentPipelineDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
