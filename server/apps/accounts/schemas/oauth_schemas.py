from pydantic import BaseModel
from typing import Any

# ==========================================
# Request Schemas
# ==========================================

class OAuthCodeRequest(BaseModel):
    """Schema for OAuth code request"""
    code: str

# ==========================================
# Response Schemas
# ==========================================

class OAuthUrlResponse(BaseModel):
    """Schema for OAuth URL response"""
    auth_url: str
    state: str | None = None


class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict[str, Any]