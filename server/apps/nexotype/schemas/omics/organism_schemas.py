from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class OrganismCreate(BaseModel):
    """Schema for creating a new organism"""
    ncbi_taxonomy_id: int
    scientific_name: str
    common_name: str


class OrganismUpdate(BaseModel):
    """Schema for updating an organism"""
    ncbi_taxonomy_id: int = None
    scientific_name: str = None
    common_name: str = None


# ==========================================
# Response Schemas
# ==========================================

class OrganismDetail(BaseModel):
    """Schema for organism details"""
    id: int
    ncbi_taxonomy_id: int
    scientific_name: str
    common_name: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class OrganismListResponse(BaseModel):
    """Response schema for listing organisms"""
    success: bool
    data: list[OrganismDetail] | None = None
    count: int = 0
    error: str | None = None


class OrganismResponse(BaseModel):
    """Response schema for single organism operations"""
    success: bool
    data: OrganismDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
