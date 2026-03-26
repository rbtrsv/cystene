from ninja.security import HttpBearer
from django.http import HttpRequest
from typing import Optional
import secrets

from ..models import User, Token
from .token_utils import get_user_id_from_token

# ==========================================
# Authentication
# ==========================================

class AuthBearer(HttpBearer):
    """
    JWT Authentication for Django Ninja
    
    This class handles authentication using JWT tokens.
    It first tries to find the token in the database,
    and if that fails, it tries to decode the JWT token.
    """
    def authenticate(self, request: HttpRequest, token: str) -> Optional[User]:
        """
        Authenticate a request using a JWT token
        
        Args:
            request: The HTTP request
            token: The JWT token from Authorization header
            
        Returns:
            User object if authenticated, None otherwise
        """
        # Store token in request for potential use elsewhere
        request.auth_token = token
        
        # Try database lookup first
        token_obj = Token.objects.filter(
            access_token=token,
            is_valid=True
        ).select_related('user').first()
        
        if token_obj and token_obj.user.deleted_at is None:
            # Set user on request
            request.user = token_obj.user
            return token_obj.user
            
        # If database lookup fails, try JWT decoding
        user_id = get_user_id_from_token(token)
        if user_id is not None:
            try:
                # Get user from database
                user = User.objects.get(id=user_id, deleted_at__isnull=True)
                # Set user on request
                request.user = user
                return user
            except User.DoesNotExist:
                pass
                
        return None


# Helper function to generate a random string
def generate_random_string(length: int = 32) -> str:
    """
    Generate a random string of specified length
    
    Args:
        length: Length of the string to generate
        
    Returns:
        Random string
    """
    return secrets.token_hex(length // 2)
