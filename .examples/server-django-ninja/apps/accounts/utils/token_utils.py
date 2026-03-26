import jwt
import secrets
from datetime import timedelta
from django.utils import timezone
from typing import Optional, Dict, Any
from django.conf import settings

# ==========================================
# Configuration
# ==========================================

# Get JWT settings from Django settings or use defaults
JWT_SECRET_KEY = getattr(settings, 'JWT_SECRET_KEY')
JWT_ALGORITHM = getattr(settings, 'JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = getattr(settings, 'ACCESS_TOKEN_EXPIRE_MINUTES')

# ==========================================
# Token Generation
# ==========================================

def generate_access_token(user_id: int) -> str:
    """
    Generate JWT access token for a user
    
    Args:
        user_id: The ID of the user
        
    Returns:
        JWT access token
    """
    now = timezone.now()
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Create access token payload
    payload = {
        "sub": str(user_id),
        "type": "access",
        "exp": expire,
        "iat": now
    }
    
    # Generate token
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    # PyJWT returns bytes in Python 3.6, but we want a string
    if isinstance(token, bytes):
        return token.decode('utf-8')
    return token


def generate_refresh_token() -> str:
    """
    Generate a secure random refresh token
    
    Returns:
        A random string to use as a refresh token
    """
    # Generate a secure random string (32 bytes = 64 hex characters)
    return secrets.token_hex(32)


def generate_password_reset_token(user_id: int) -> str:
    """
    Generate a password reset token
    
    Args:
        user_id: The ID of the user
        
    Returns:
        JWT token for password reset
    """
    now = timezone.now()
    expire = now + timedelta(hours=24)
    
    payload = {
        "sub": str(user_id),
        "type": "password_reset",
        "exp": expire,
        "iat": now
    }
    
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    # PyJWT returns bytes in Python 3.6, but we want a string
    if isinstance(token, bytes):
        return token.decode('utf-8')
    return token


# ==========================================
# Token Verification
# ==========================================

def verify_token(token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
    """
    Verify a JWT token and return the payload
    
    Args:
        token: The JWT token to verify
        token_type: The expected token type ('access', 'password_reset')
        
    Returns:
        The token payload if valid, None otherwise
    """
    try:
        # Decode and verify the token
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        # Check token type
        if payload.get("type") != token_type:
            return None
        
        # Check expiration (jwt library should do this automatically)
        if "exp" not in payload:
            return None
            
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    except Exception:
        return None


def get_user_id_from_token(token: str) -> Optional[int]:
    """
    Extract user ID from a JWT token if valid
    
    Args:
        token: The JWT token
        
    Returns:
        The user ID if token is valid, None otherwise
    """
    try:
        # Verify the token
        payload = verify_token(token)
        
        if not payload or "sub" not in payload:
            return None
            
        user_id = payload["sub"]
        
        # Convert to int if it's a string
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except ValueError:
                return None
                
        return user_id
    except Exception:
        return None
