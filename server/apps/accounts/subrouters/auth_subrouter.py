from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone, timedelta
import logging

from core.db import get_session
from core.config import settings
from ..models import User, Organization, OrganizationMember, Token
from ..schemas.auth_schemas import (
    LoginRequest, RegisterRequest, TokenResponse, SessionSchema, AuthResponse,
    UserResponse, OrganizationResponse, RefreshTokenRequest, UserRole,
    ResetPasswordRequest, CompleteResetPasswordRequest, MessageResponse
)
from ..schemas.organization_member_schemas import OrganizationMemberRole
from ..utils.auth_utils import get_current_user
from ..utils.password_utils import hash_password, compare_passwords, is_strong_password
from ..utils.token_utils import generate_access_token, generate_refresh_token, generate_password_reset_token
from ..utils.email_utils import send_password_reset_email

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Authentication"])

# Security scheme for JWT Bearer tokens
security = HTTPBearer()

@router.post("/register", response_model=AuthResponse)
async def register(
    register_request: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_session)
):
    """Register a new user with organization"""
    # Check if user exists
    result = await db.execute(select(User).where(User.email == register_request.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate password strength
    if not is_strong_password(register_request.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is not strong enough. Must be at least 8 characters with uppercase, lowercase, and number."
        )
    
    # Create user
    user = User(
        email=register_request.email,
        name=register_request.name,
        password_hash=hash_password(register_request.password)
    )
    db.add(user)
    await db.flush()

    # Create tokens
    access_token = generate_access_token(user.id)
    refresh_token = generate_refresh_token()
    
    # Store token in database
    token_record = Token(
        user_id=user.id,
        access_token=access_token,
        refresh_token=refresh_token,
        access_token_expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        refresh_token_expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        is_valid=True,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(token_record)
    
    await db.commit()
    await db.refresh(user)

    # Create session data (no organizations yet - user creates org later)
    session = SessionSchema(
        user=UserResponse.model_validate(user),
        organizations=[]
    )
    
    return AuthResponse(
        success=True,
        data=session,
        token=TokenResponse(  # Note: "token" not "tokens"
            access_token=access_token,
            refresh_token=refresh_token
        )
    )

@router.post("/login", response_model=AuthResponse)
async def login(
    login_request: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_session)
):
    """Login user"""
    # Find user
    result = await db.execute(
        select(User).where(User.email == login_request.email)
    )
    user = result.scalar_one_or_none()
    
    if not user or not compare_passwords(login_request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    # Get user's organizations
    result = await db.execute(
        select(OrganizationMember)
        .options(selectinload(OrganizationMember.organization))
        .where(OrganizationMember.user_id == user.id)
    )
    memberships = result.scalars().all()
    
    # Create tokens
    access_token = generate_access_token(user.id)
    refresh_token = generate_refresh_token()
    
    # Store token in database - exactly like Django Ninja
    token_record = Token(
        user_id=user.id,
        access_token=access_token,
        refresh_token=refresh_token,
        access_token_expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        refresh_token_expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        is_valid=True,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(token_record)
    await db.commit()
    
    organizations = [
        OrganizationResponse(
            id=m.organization.id,
            name=m.organization.name,
            created_at=m.organization.created_at,
            updated_at=m.organization.updated_at,
            user_role=m.role
        )
        for m in memberships
    ]
    
    # Create session data
    session = SessionSchema(
        user=UserResponse.model_validate(user),
        organizations=organizations
    )
    
    return AuthResponse(
        success=True,
        data=session,
        token=TokenResponse(  # Note: "token" not "tokens"
            access_token=access_token,
            refresh_token=refresh_token
        )
    )

@router.post("/refresh-token", response_model=AuthResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_session)
):
    """
    Refresh access token using opaque refresh token

    Refresh tokens are random hex strings (not JWTs), validated via DB lookup only.
    This is the industry standard approach used by Auth0, Firebase, Supabase.
    """
    # Lookup refresh token in database (opaque token, not JWT)
    result = await db.execute(
        select(Token)
        .where(Token.refresh_token == request.refresh_token)
        .where(Token.is_valid == True)
        .where(Token.refresh_token_expires_at > datetime.now(timezone.utc))
    )
    token_record = result.scalar_one_or_none()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    # Create new tokens (rotation: old token invalidated, new token issued)
    user_id = token_record.user_id
    new_access_token = generate_access_token(user_id)
    new_refresh_token = generate_refresh_token()

    # Invalidate old token
    token_record.is_valid = False

    # Create new token record
    new_token_record = Token(
        user_id=user_id,
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        access_token_expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        refresh_token_expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        is_valid=True
    )
    db.add(new_token_record)
    await db.commit()

    return AuthResponse(
        success=True,
        token=TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token
        )
    )

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_session)
):
    """Logout user by invalidating tokens"""
    # Invalidate all tokens for this access token
    result = await db.execute(
        select(Token)
        .where(Token.access_token == credentials.credentials)
        .where(Token.is_valid == True)
    )
    token = result.scalar_one_or_none()
    
    if token:
        token.is_valid = False
        await db.commit()
    
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=AuthResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Get current user information with organizations"""
    # Get user's organizations
    result = await db.execute(
        select(OrganizationMember)
        .options(selectinload(OrganizationMember.organization))
        .where(OrganizationMember.user_id == current_user.id)
    )
    memberships = result.scalars().all()
    
    organizations = [
        OrganizationResponse(
            id=m.organization.id,
            name=m.organization.name,
            created_at=m.organization.created_at,
            updated_at=m.organization.updated_at,
            user_role=m.role
        )
        for m in memberships
    ]
    
    # Create session data
    session = SessionSchema(
        user=UserResponse.model_validate(current_user),
        organizations=organizations
    )
    
    return AuthResponse(
        success=True,
        data=session
    )


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_session)
):
    """
    Request a password reset link
    
    This endpoint:
    1. Generates a password reset token
    2. Returns a success message (even if email not found for security)
    """
    try:
        # Find user by email
        result = await db.execute(
            select(User).where(User.email == data.email, User.deleted_at == None)
        )
        user = result.scalar_one_or_none()
        
        # Generate reset token if user exists
        if user:
            reset_token = generate_password_reset_token(user.id)
            
            # Store the token in database
            token_record = Token(
                user_id=user.id,
                access_token='password_reset',
                refresh_token=reset_token,
                access_token_expires_at=datetime.now(timezone.utc) + timedelta(hours=1),  # 1 hour expiry
                refresh_token_expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
                is_valid=True
            )
            db.add(token_record)
            await db.commit()
            
            # Send password reset email
            try:
                logger.info(f"Attempting to send password reset email to {user.email}")
                email_sent = await send_password_reset_email(user.email, user.name, reset_token)
                if email_sent:
                    logger.info(f"Password reset email sent successfully to {user.email}")
                else:
                    logger.warning(f"Password reset email failed to send to {user.email}")
            except Exception as e:
                # Log error but don't expose it to prevent email enumeration
                logger.error(f"Error sending password reset email to {user.email}: {str(e)}")
            
        # Still return success to avoid email enumeration
        return MessageResponse(
            success=True,
            message="If your email is registered, you will receive a reset link"
        )
    except Exception as e:
        return MessageResponse(
            success=False,
            error=str(e)
        )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    data: CompleteResetPasswordRequest,
    db: AsyncSession = Depends(get_session)
):
    """
    Reset a user's password using a reset token
    
    This endpoint:
    1. Validates the reset token
    2. Updates the user's password
    3. Returns a success message
    """
    try:
        # Validate password strength
        if not is_strong_password(data.password):
            return MessageResponse(
                success=False,
                error="Password must include uppercase, lowercase, and numeric characters"
            )
            
        # Get token from database
        result = await db.execute(
            select(Token)
            .options(selectinload(Token.user))
            .where(
                Token.refresh_token == data.token,
                Token.access_token == 'password_reset',
                Token.is_valid == True,
                Token.access_token_expires_at > datetime.now(timezone.utc)
            )
        )
        token = result.scalar_one_or_none()
        
        if not token:
            return MessageResponse(
                success=False,
                error="Invalid or expired reset token"
            )
            
        # Get user
        user = token.user
        if user.deleted_at:
            return MessageResponse(
                success=False,
                error="Account no longer exists"
            )
            
        # Update password
        user.password_hash = hash_password(data.password)
        
        # Invalidate the reset token
        token.is_valid = False
        
        await db.commit()
        
        return MessageResponse(
            success=True,
            message="Password has been successfully reset"
        )
        
    except Exception as e:
        return MessageResponse(
            success=False,
            error=str(e)
        )


