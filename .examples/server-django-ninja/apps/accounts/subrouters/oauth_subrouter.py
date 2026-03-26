from ninja import Router, Schema
from django.http import HttpRequest
from ninja.errors import HttpError
from typing import Optional, Dict, Any

from ..utils.oauth_utils import get_google_auth_url, google_auth

# ==========================================
# OAuth Router
# ==========================================

router = Router(tags=["OAuth"])

# ==========================================
# Response Schemas
# ==========================================

class OAuthUrlResponse(Schema):
    """Schema for OAuth URL response"""
    auth_url: str
    state: Optional[str] = None

class OAuthCodeRequest(Schema):
    """Schema for OAuth code request"""
    code: str

class TokenResponse(Schema):
    """Schema for token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# ==========================================
# OAuth Endpoints
# ==========================================

@router.get("/google/url", response=OAuthUrlResponse)
def get_oauth_url(request: HttpRequest):
    """
    Generate the Google OAuth URL for login
    
    Returns:
        The authorization URL to redirect the user to
    """
    auth_url, state = get_google_auth_url()
    return {"auth_url": auth_url, "state": state}

@router.post("/google/callback", response=TokenResponse)
def google_callback(request: HttpRequest, payload: OAuthCodeRequest):
    """
    Handle Google OAuth callback
    
    Exchanges authorization code for tokens and user info
    
    Args:
        code: The authorization code from Google OAuth callback
    
    Returns:
        Access token, refresh token, and user info
        
    Raises:
        HttpError: If authentication fails
    """
    try:
        response = google_auth(payload.code, request)
        return response
    except Exception as e:
        raise HttpError(400, f"Google authentication failed: {str(e)}")
