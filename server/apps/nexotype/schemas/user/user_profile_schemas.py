from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class UserProfileCreate(BaseModel):
    """Schema for creating a new user profile"""
    user_id: int
    subject_id: int


class UserProfileUpdate(BaseModel):
    """Schema for updating a user profile"""
    user_id: int = None
    subject_id: int = None


# ==========================================
# Response Schemas
# ==========================================

class UserProfileDetail(BaseModel):
    """Schema for user profile details"""
    id: int
    user_id: int
    subject_id: int
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UserProfileListResponse(BaseModel):
    """Response schema for listing user profiles"""
    success: bool
    data: list[UserProfileDetail] | None = None
    count: int = 0
    error: str | None = None


class UserProfileResponse(BaseModel):
    """Response schema for single user profile operations"""
    success: bool
    data: UserProfileDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
