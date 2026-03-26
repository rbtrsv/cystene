from pydantic import BaseModel, ConfigDict
from datetime import datetime
from enum import Enum

# ==========================================
# Enums
# ==========================================

class OrganizationMemberRole(str, Enum):
    """Organization member role types"""
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    EDITOR = "EDITOR"
    VIEWER = "VIEWER"

# ==========================================
# Request Schemas
# ==========================================

class MemberCreate(BaseModel):
    """Schema for adding a member to an organization"""
    user_id: int
    role: OrganizationMemberRole = OrganizationMemberRole.VIEWER


class MemberUpdate(BaseModel):
    """Schema for updating a member's role"""
    role: OrganizationMemberRole

# ==========================================
# Response Schemas
# ==========================================

class MemberDetail(BaseModel):
    """Schema for member details"""
    id: int
    user_id: int
    email: str
    name: str | None
    role: OrganizationMemberRole
    joined_at: datetime
    updated_at: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None