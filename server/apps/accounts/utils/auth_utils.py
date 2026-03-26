from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
import secrets

from ..models import User, Token
from .token_utils import get_user_id_from_token
from core.db import get_session

# ==========================================
# Authentication
# ==========================================

security = HTTPBearer()

async def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session)
) -> User:
    """
    FastAPI dependency to get current authenticated user
    
    Args:
        token: HTTPAuthorizationCredentials from Authorization header
        session: Database session
        
    Returns:
        User object if authenticated
        
    Raises:
        HTTPException: If authentication fails
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try database lookup first
    result = await session.execute(
        select(Token)
        .options(selectinload(Token.user))
        .filter(Token.access_token == token.credentials, Token.is_valid == True)
    )
    token_obj = result.scalar_one_or_none()
    
    if token_obj and token_obj.user.deleted_at is None:
        return token_obj.user
        
    # If database lookup fails, try JWT decoding
    user_id = get_user_id_from_token(token.credentials)
    if user_id is not None:
        result = await session.execute(
            select(User).filter(User.id == user_id, User.deleted_at == None)
        )
        user = result.scalar_one_or_none()
        if user:
            return user
                
    raise credentials_exception


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    FastAPI dependency to get current active user
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User object if active
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


# ==========================================
# Helper Functions
# ==========================================

def generate_random_string(length: int = 32) -> str:
    """
    Generate a random string of specified length
    
    Args:
        length: Length of the string to generate
        
    Returns:
        Random string
    """
    return secrets.token_hex(length // 2)