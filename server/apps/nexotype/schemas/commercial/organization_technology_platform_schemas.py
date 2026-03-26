from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class OrganizationTechnologyPlatformCreate(BaseModel):
    """Schema for creating a new organization technology platform link"""
    market_organization_id: int
    technology_platform_id: int
    utilization_type: str


class OrganizationTechnologyPlatformUpdate(BaseModel):
    """Schema for updating an organization technology platform link"""
    market_organization_id: int = None
    technology_platform_id: int = None
    utilization_type: str = None


# ==========================================
# Response Schemas
# ==========================================

class OrganizationTechnologyPlatformDetail(BaseModel):
    """Schema for organization technology platform details"""
    id: int
    market_organization_id: int
    technology_platform_id: int
    utilization_type: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class OrganizationTechnologyPlatformListResponse(BaseModel):
    """Response schema for listing organization technology platforms"""
    success: bool
    data: list[OrganizationTechnologyPlatformDetail] | None = None
    count: int = 0
    error: str | None = None


class OrganizationTechnologyPlatformResponse(BaseModel):
    """Response schema for single organization technology platform operations"""
    success: bool
    data: OrganizationTechnologyPlatformDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
