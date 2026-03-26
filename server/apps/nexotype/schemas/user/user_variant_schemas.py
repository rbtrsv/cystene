from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class UserVariantCreate(BaseModel):
    """Schema for creating a new user variant"""
    subject_id: int
    variant_id: int
    zygosity: str


class UserVariantUpdate(BaseModel):
    """Schema for updating a user variant"""
    subject_id: int = None
    variant_id: int = None
    zygosity: str = None


# ==========================================
# Response Schemas
# ==========================================

class UserVariantDetail(BaseModel):
    """Schema for user variant details"""
    id: int
    subject_id: int
    variant_id: int
    zygosity: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UserVariantListResponse(BaseModel):
    """Response schema for listing user variants"""
    success: bool
    data: list[UserVariantDetail] | None = None
    count: int = 0
    error: str | None = None


class UserVariantResponse(BaseModel):
    """Response schema for single user variant operations"""
    success: bool
    data: UserVariantDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
