from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from enum import Enum
from .organization_member_schemas import OrganizationMemberRole

# ==========================================
# Enums
# ==========================================

class UserRole(str, Enum):
    """User role types within the system"""
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"

# ==========================================
# Request Schemas
# ==========================================

class LoginRequest(BaseModel):
    """Login request with email and password"""
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    """Registration request for new user"""
    name: str
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    """Request to refresh access token"""
    refresh_token: str

class ResetPasswordRequest(BaseModel):
    """Request to reset password"""
    email: EmailStr

class CompleteResetPasswordRequest(BaseModel):
    """Complete password reset with token and new password"""
    token: str
    password: str

# ==========================================
# Response Schemas  
# ==========================================

class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    """User information response"""
    id: int
    name: str | None = None
    email: str
    role: UserRole
    email_verified: bool = False
    created_at: datetime
    updated_at: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True)

class OrganizationResponse(BaseModel):
    """Organization information with user's role"""
    id: int
    name: str
    created_at: datetime
    updated_at: datetime | None = None
    user_role: OrganizationMemberRole
    
    model_config = ConfigDict(from_attributes=True)

class SessionSchema(BaseModel):
    """Session data containing user and organizations"""
    user: UserResponse
    organizations: list[OrganizationResponse]

class AuthResponse(BaseModel):
    """Auth response matching Django Ninja format"""
    success: bool
    data: SessionSchema | None = None
    token: TokenResponse | None = None
    error: str | None = None

class MessageResponse(BaseModel):
    """Generic message response"""
    success: bool
    message: str | None = None
    error: str | None = None