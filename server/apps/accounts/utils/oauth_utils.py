from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from core.config import settings
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models import User, Token, Organization, OrganizationMember
import logging
import requests
import secrets
from datetime import datetime, timedelta, timezone
from .token_utils import generate_access_token

# ==========================================
# Configuration
# ==========================================

logger = logging.getLogger(__name__)

# ==========================================
# OAuth Flow Management
# ==========================================

def get_flow():
    """
    Creates a Flow instance for Google OAuth
    
    Returns:
        Flow: A configured OAuth flow instance
    """
    return Flow.from_client_config(
        client_config={
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
            }
        },
        scopes=['openid', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']
    )

def get_google_auth_url():
    """
    Generate the Google OAuth URL for login
    
    Returns:
        tuple: (authorization_url, state) where authorization_url is the URL to redirect the user to,
               and state is a token to prevent CSRF attacks
    """
    flow = get_flow()
    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    
    return authorization_url, state

# ==========================================
# Authentication & User Management
# ==========================================

async def google_auth(code: str, request=None, session: AsyncSession = None):
    """
    Exchange auth code for tokens and user info
    
    Args:
        code: The authorization code from Google OAuth callback
        request: Optional HTTP request object for storing IP and user agent
        session: Database session (if None, will create one)
        
    Returns:
        dict: Authentication data including access token, refresh token, and user info
        
    Raises:
        HTTPException: If authentication fails
    """
    try:
        flow = get_flow()
        flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
        
        # Exchange code for tokens
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Get user info using the credentials
        service = build('oauth2', 'v2', credentials=credentials)
        user_info = service.userinfo().get().execute()
        
        if 'email' not in user_info:
            raise HTTPException(status_code=400, detail="Email not provided by Google")
        
        # Check if user already exists
        result = await session.execute(
            select(User).filter(User.email == user_info['email'])
        )
        user = result.scalar_one_or_none()
        
        if user:
            # Update existing user if email isn't verified
            if not user.email_verified:
                user.email_verified = True
                await session.commit()
        else:
            # Create new user
            user = User(
                email=user_info['email'],
                name=user_info.get('name', ''),
                password_hash='oauth_user',
                email_verified=True  # Google has verified their email
            )
            session.add(user)
            await session.flush()  # Get user ID
            
            # Create organization for new user
            user_name = user_info.get('name', user_info['email'].split('@')[0])
            organization = Organization(
                name=f"{user_name}'s Organization"
            )
            session.add(organization)
            await session.flush()  # Get organization ID
            
            # Create organization membership  
            membership = OrganizationMember(
                user_id=user.id,
                organization_id=organization.id,
                role="OWNER"
            )
            session.add(membership)
            await session.commit()
            await session.refresh(user)
            
            logger.info(f"Created OAuth user {user.email} with organization {organization.id} and OWNER role")
        
        # Generate tokens
        access_token = generate_access_token(user.id)
        refresh_token = secrets.token_hex(32)
        
        # Store token in database
        token_obj = Token(
            user_id=user.id,
            access_token=access_token,
            refresh_token=refresh_token,
            access_token_expires_at=datetime.now(timezone.utc) + timedelta(days=1),
            refresh_token_expires_at=datetime.now(timezone.utc) + timedelta(days=30),
            is_valid=True,
            ip_address=request.client.host if request and hasattr(request, 'client') else None,
            user_agent=request.headers.get('user-agent') if request and hasattr(request, 'headers') else None
        )
        session.add(token_obj)
        await session.commit()
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "email_verified": user.email_verified
            }
        }
        
    except Exception as e:
        logger.error(f"Google auth error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Google authentication failed: {str(e)}")

# ==========================================
# Token Management
# ==========================================

def revoke_credentials(credentials):
    """
    Revoke OAuth credentials with the provider
    
    Args:
        credentials: The OAuth credentials to revoke
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        credentials.revoke(requests.Request())
        return True
    except Exception as e:
        logger.error(f"Failed to revoke credentials: {str(e)}")
        return False

async def get_or_create_user_from_google(user_info: dict, session: AsyncSession) -> User:
    """
    Looks up or creates a local user based on Google account info
    
    Args:
        user_info: Dictionary containing user information from Google
        session: Database session
        
    Returns:
        User: The user object (either existing or newly created)
        
    Raises:
        HTTPException: If email is not provided by Google
    """
    email = user_info.get('email')
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")

    # Check if user already exists
    result = await session.execute(
        select(User).filter(User.email == email)
    )
    user = result.scalar_one_or_none()
    
    if user:
        # If user exists but email isn't verified, update it since Google has verified it
        if not user.email_verified:
            user.email_verified = True
            await session.commit()
    else:
        # Create new user
        user = User(
            email=email,
            name=user_info.get("name", ""),
            password_hash="oauth_user",
            email_verified=True
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
    return user