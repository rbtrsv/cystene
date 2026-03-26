from pydantic import BaseModel
from enum import Enum

# ==========================================
# Enums
# ==========================================

class OrganizationInvitationStatus(str, Enum):
    """Organization invitation status types"""
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class OrganizationInvitationRole(str, Enum):
    """Organization invitation role types"""
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    EDITOR = "EDITOR"
    VIEWER = "VIEWER"

# ==========================================
# Request Schemas
# ==========================================

class OrganizationInvitationCreate(BaseModel):
    """Schema for creating a new organization invitation"""
    email: str
    organization_id: int
    role: OrganizationInvitationRole = OrganizationInvitationRole.VIEWER

# ==========================================
# Response Schemas
# ==========================================

class OrganizationInvitationDetail(BaseModel):
    """Schema for organization invitation details"""
    id: int
    email: str
    organization_id: int
    organization_name: str
    role: OrganizationInvitationRole
    status: OrganizationInvitationStatus
    created_at: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None