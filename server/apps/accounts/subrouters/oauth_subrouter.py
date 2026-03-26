from fastapi import APIRouter, HTTPException, status, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from ..schemas.oauth_schemas import OAuthUrlResponse, OAuthCodeRequest, TokenResponse
from ..utils.oauth_utils import get_google_auth_url, google_auth

# ==========================================
# OAuth Router
# ==========================================

router = APIRouter(tags=["OAuth"])

# ==========================================
# OAuth Endpoints
# ==========================================

@router.get("/google/url", response_model=OAuthUrlResponse)
async def get_oauth_url():
    """
    Generate the Google OAuth URL for login
    
    Returns:
        The authorization URL to redirect the user to
    """
    auth_url, state = get_google_auth_url()
    return OAuthUrlResponse(auth_url=auth_url, state=state)


@router.post("/google/callback", response_model=TokenResponse)
async def google_callback(
    payload: OAuthCodeRequest, 
    request: Request,
    db: AsyncSession = Depends(get_session)
):
    """
    Handle Google OAuth callback
    
    Exchanges authorization code for tokens and user info
    
    Args:
        payload: The authorization code from Google OAuth callback
        request: FastAPI request object
        db: Database session
    
    Returns:
        Access token, refresh token, and user info
        
    Raises:
        HTTPException: If authentication fails
    """
    try:
        response = await google_auth(payload.code, request, db)
        return TokenResponse(**response)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google authentication failed: {str(e)}"
        )