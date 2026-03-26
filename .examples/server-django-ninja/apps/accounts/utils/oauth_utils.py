from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from django.conf import settings
from ninja.errors import AuthenticationError, HttpError
from ..models import User, Token
import logging
import requests
import secrets
from datetime import datetime, timedelta
from ..utils.token_utils import generate_access_token

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
        client_config=settings.GOOGLE_OAUTH_CONFIG,
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

def google_auth(code: str, request=None):
    """
    Exchange auth code for tokens and user info
    
    Args:
        code: The authorization code from Google OAuth callback
        request: Optional HTTP request object for storing IP and user agent
        
    Returns:
        dict: Authentication data including access token, refresh token, and user info
        
    Raises:
        HttpError: If authentication fails
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
            raise HttpError(400, "Email not provided by Google")
        
        # Create or update user
        user, created = User.objects.get_or_create(
            email=user_info['email'],
            defaults={
                'name': user_info.get('name', ''),
                'password_hash': 'oauth_user',
                'email_verified': True  # Google has verified their email
            }
        )
        
        # If user exists but email isn't verified, update it
        if not created and not user.email_verified:
            user.email_verified = True
            user.save()
            
        # Generate tokens
        access_token = generate_access_token(user.id)
        refresh_token = secrets.token_hex(32)
        
        # Store token in database
        Token.objects.create(
            user=user,
            access_token=access_token,
            refresh_token=refresh_token,
            access_token_expires_at=datetime.now() + timedelta(days=1),
            refresh_token_expires_at=datetime.now() + timedelta(days=30),
            is_valid=True,
            ip_address=request.META.get('REMOTE_ADDR') if request else None,
            user_agent=request.META.get('HTTP_USER_AGENT') if request else None
        )
        
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
        raise HttpError(400, f"Google authentication failed: {str(e)}")

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

def get_or_create_user_from_google(user_info: dict) -> User:
    """
    Looks up or creates a local user based on Google account info
    
    Args:
        user_info: Dictionary containing user information from Google
        
    Returns:
        User: The user object (either existing or newly created)
        
    Raises:
        AuthenticationError: If email is not provided by Google
    """
    email = user_info.get('email')
    if not email:
        raise AuthenticationError("Email not provided by Google")

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "name": user_info.get("name", ""),
            "password_hash": "oauth_user",
            "email_verified": True
        }
    )
    
    # If user exists but email isn't verified, update it since Google has verified it
    if not created and not user.email_verified:
        user.email_verified = True
        user.save()
        
    return user
