from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class DataSourceCreate(BaseModel):
    """Schema for creating a new data source"""
    name: str
    source_type: str


class DataSourceUpdate(BaseModel):
    """Schema for updating a data source"""
    name: str = None
    source_type: str = None


# ==========================================
# Response Schemas
# ==========================================

class DataSourceDetail(BaseModel):
    """Schema for data source details"""
    id: int
    name: str
    source_type: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class DataSourceListResponse(BaseModel):
    """Response schema for listing data sources"""
    success: bool
    data: list[DataSourceDetail] | None = None
    count: int = 0
    error: str | None = None


class DataSourceResponse(BaseModel):
    """Response schema for single data source operations"""
    success: bool
    data: DataSourceDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
