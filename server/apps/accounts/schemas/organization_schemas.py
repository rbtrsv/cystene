from pydantic import BaseModel, ConfigDict
from datetime import datetime
from .organization_member_schemas import OrganizationMemberRole

# ==========================================
# Request Schemas
# ==========================================

class OrganizationCreate(BaseModel):
    """Schema for creating a new organization"""
    name: str


class OrganizationUpdate(BaseModel):
    """Schema for updating an organization"""
    name: str

# ==========================================
# Response Schemas
# ==========================================

class OrganizationDetail(BaseModel):
    """Schema for organization details"""
    id: int
    name: str
    role: OrganizationMemberRole
    created_at: datetime
    updated_at: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True)


class OrganizationResponse(BaseModel):
    """Response schema for organization operations"""
    success: bool
    data: OrganizationDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None