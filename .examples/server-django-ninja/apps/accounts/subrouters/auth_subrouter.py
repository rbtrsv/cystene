from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from django.db import transaction
from datetime import timedelta
from django.utils import timezone
from typing import List, Optional, Dict, Any
import secrets

from ..models import User, Organization, OrganizationMember, Token
from ..utils.auth_utils import AuthBearer
from ..utils.token_utils import generate_access_token, verify_token, generate_password_reset_token
from ..utils.password_utils import hash_password, compare_passwords, is_strong_password

# ==========================================
# Auth Schemas
# ==========================================

class LoginInput(Schema):
    """Schema for login credentials"""
    email: str
    password: str


class RegisterInput(Schema):
    """Schema for user registration"""
    name: str
    email: str
    password: str
    organization_name: str


class ResetPasswordInput(Schema):
    """Schema for password reset request"""
    email: str


class CompleteResetPasswordInput(Schema):
    """Schema for completing password reset"""
    token: str
    password: str


class RefreshTokenInput(Schema):
    """Schema for refresh token request"""
    refresh_token: str


class TokenData(Schema):
    """Schema for JWT token data"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserSchema(Schema):
    """User schema for responses"""
    id: int
    name: Optional[str] = None
    email: str
    role: str
    created_at: timezone.datetime
    updated_at: timezone.datetime
    deleted_at: Optional[timezone.datetime] = None
    email_verified: bool = False


class OrganizationSchema(Schema):
    """Organization schema for responses"""
    id: int
    name: str
    created_at: timezone.datetime
    updated_at: timezone.datetime
    user_role: str


class SessionSchema(Schema):
    """Schema for user session data"""
    user: UserSchema
    organizations: List[OrganizationSchema]


class AuthResponse(Schema):
    """Response schema for authentication operations"""
    success: bool
    data: Optional[SessionSchema] = None
    token: Optional[TokenData] = None
    error: Optional[str] = None


class MessageResponse(Schema):
    """Simple message response"""
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None


# ==========================================
# Auth Routers
# ==========================================

# Router for all auth endpoints
router = Router(tags=["Authentication"])


@router.post("/register", response=AuthResponse)
def register(request: HttpRequest, data: RegisterInput) -> Dict[str, Any]:
    """
    Register a new user and create their organization
    
    This endpoint:
    1. Validates the registration data
    2. Creates a new user with hashed password
    3. Creates a new organization
    4. Adds the user as the owner of the organization
    5. Returns tokens for authentication
    """
    try:
        # Validate password strength
        if not is_strong_password(data.password):
            return {
                "success": False, 
                "error": "Password must include uppercase, lowercase, and numeric characters"
            }
            
        # Check if email already exists
        if User.objects.filter(email=data.email).exists():
            return {"success": False, "error": "Email already in use"}
            
        # Start transaction
        with transaction.atomic():
            # Hash password
            password_hash = hash_password(data.password)
            
            # Create user
            user = User.objects.create(
                email=data.email,
                password_hash=password_hash,
                name=data.name,
                role=User.RoleTypes.MEMBER  # Default role
            )
            
            # Create organization
            organization = Organization.objects.create(
                name=data.organization_name
            )
            
            # Add user as organization owner
            OrganizationMember.objects.create(
                user=user,
                organization=organization,
                role=OrganizationMember.RoleTypes.OWNER  # Owner role
            )
            
            # Generate tokens
            access_token = generate_access_token(user.id)
            refresh_token = secrets.token_hex(32)
            
            # Store token in database
            Token.objects.create(
                user=user,
                access_token=access_token,
                refresh_token=refresh_token,
                access_token_expires_at=timezone.now() + timedelta(days=1),
                refresh_token_expires_at=timezone.now() + timedelta(days=30),
                is_valid=True,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
            
            # Create session data
            user_data = UserSchema(
                id=user.id,
                name=user.name,
                email=user.email,
                role=user.role,
                created_at=user.created_at,
                updated_at=user.updated_at,
                deleted_at=user.deleted_at,
                email_verified=user.email_verified
            )
            org_data = OrganizationSchema(
                id=organization.id,
                name=organization.name,
                created_at=organization.created_at,
                updated_at=organization.updated_at,
                user_role="OWNER"
            )
            
            session = SessionSchema(
                user=user_data,
                organizations=[org_data]
            )
            
            # Return success with data
            return {
                "success": True,
                "data": session,
                "token": {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer"
                }
            }
            
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/login", response=AuthResponse)
def login(request: HttpRequest, data: LoginInput) -> Dict[str, Any]:
    """
    Authenticate a user and return session with tokens
    
    This endpoint:
    1. Authenticates the user with email and password
    2. Creates new tokens
    3. Returns the user session data with tokens
    """
    try:
        # Find user by email
        user = User.objects.filter(
            email=data.email,
            deleted_at__isnull=True  # Ensure user is not soft-deleted
        ).first()
        
        if not user:
            return {"success": False, "error": "Invalid email or password"}
        
        # Verify password
        if not compare_passwords(data.password, user.password_hash):
            return {"success": False, "error": "Invalid email or password"}
            
        # Get user's organizations and roles
        memberships = OrganizationMember.objects.filter(
            user_id=user.id
        ).select_related('organization')
        
        org_list = []
        for member in memberships:
            org_data = OrganizationSchema(
                id=member.organization.id,
                name=member.organization.name,
                created_at=member.organization.created_at,
                updated_at=member.organization.updated_at,
                user_role=member.role
            )
            org_list.append(org_data)
            
        # Generate tokens
        access_token = generate_access_token(user.id)
        refresh_token = secrets.token_hex(32)
        
        # Store token in database
        Token.objects.create(
            user=user,
            access_token=access_token,
            refresh_token=refresh_token,
            access_token_expires_at=timezone.now() + timedelta(days=1),
            refresh_token_expires_at=timezone.now() + timedelta(days=30),
            is_valid=True,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )
        
        # Create session data
        session = SessionSchema(
            user=UserSchema(
                id=user.id,
                name=user.name,
                email=user.email,
                role=user.role,
                created_at=user.created_at,
                updated_at=user.updated_at,
                deleted_at=user.deleted_at,
                email_verified=user.email_verified
            ),
            organizations=org_list
        )
        
        # Return success with data
        return {
            "success": True,
            "data": session,
            "token": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer"
            }
        }
            
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/logout", response=MessageResponse, auth=AuthBearer())
def logout(request: HttpRequest) -> Dict[str, Any]:
    """
    Log out the user by invalidating their tokens
    
    This endpoint:
    1. Invalidates all tokens for the user
    2. Returns a success message
    """
    try:
        # Invalidate all tokens for user
        user_id = request.user.id
        Token.objects.filter(
            user_id=user_id,
            is_valid=True
        ).update(is_valid=False)
        
        return {"success": True, "message": "Logout successful"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/me", response=AuthResponse, auth=AuthBearer())
def get_current_user(request: HttpRequest) -> Dict[str, Any]:
    """
    Get the current authenticated user's profile and organizations
    
    This endpoint:
    1. Returns the user's profile and organizations
    """
    try:
        user = request.user
        
        # Get user's organizations and roles
        memberships = OrganizationMember.objects.filter(
            user_id=user.id
        ).select_related('organization')
        
        org_list = []
        for member in memberships:
            org_data = OrganizationSchema(
                id=member.organization.id,
                name=member.organization.name,
                created_at=member.organization.created_at,
                updated_at=member.organization.updated_at,
                user_role=member.role
            )
            org_list.append(org_data)
            
        # Create session data
        session = SessionSchema(
            user=UserSchema(
                id=user.id,
                name=user.name,
                email=user.email,
                role=user.role,
                created_at=user.created_at,
                updated_at=user.updated_at,
                deleted_at=user.deleted_at,
                email_verified=user.email_verified
            ),
            organizations=org_list
        )
        
        # Return success with data
        return {
            "success": True,
            "data": session
        }
            
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/refresh-token", response=AuthResponse)
def refresh_token(request: HttpRequest, data: RefreshTokenInput) -> Dict[str, Any]:
    """
    Refresh an access token using a refresh token
    
    This endpoint:
    1. Validates the refresh token
    2. Creates a new access token
    3. Returns the new token
    """
    try:
        # Get token from database
        token = Token.objects.filter(
            refresh_token=data.refresh_token,
            is_valid=True,
            refresh_token_expires_at__gt=timezone.now()
        ).select_related('user').first()
        
        if not token:
            return {"success": False, "error": "Invalid or expired refresh token"}
            
        if token.user.deleted_at:
            return {"success": False, "error": "User account has been deleted"}
            
        # Generate new tokens
        new_access_token = generate_access_token(token.user.id)
        new_refresh_token = secrets.token_hex(32)
        
        # Create new token record
        Token.objects.create(
            user=token.user,
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            access_token_expires_at=timezone.now() + timedelta(days=1),
            refresh_token_expires_at=timezone.now() + timedelta(days=30),
            is_valid=True,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )
        
        # Invalidate old token
        token.is_valid = False
        token.save()
        
        # Return new token
        return {
            "success": True,
            "token": {
                "access_token": new_access_token,
                "refresh_token": new_refresh_token,
                "token_type": "bearer"
            }
        }
            
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/forgot-password", response=MessageResponse)
def forgot_password(request: HttpRequest, data: ResetPasswordInput) -> Dict[str, Any]:
    """
    Request a password reset link
    
    This endpoint:
    1. Generates a password reset token
    2. Returns a success message (even if email not found for security)
    """
    try:
        # Find user by email
        user = User.objects.filter(
            email=data.email,
            deleted_at__isnull=True
        ).first()
        
        # Generate reset token if user exists
        if user:
            reset_token = generate_password_reset_token(user.id)
            
            # In a real application, send an email with the reset link
            # For now, just log it
            reset_url = f"/reset-password?token={reset_token}"
            print(f"Password reset URL for {user.email}: {reset_url}")
            
            # Store the token
            Token.objects.create(
                user=user,
                access_token='password_reset',
                refresh_token=reset_token,
                access_token_expires_at=timezone.now() + timedelta(hours=24),
                refresh_token_expires_at=timezone.now() + timedelta(hours=24),
                is_valid=True,
                ip_address=request.META.get('REMOTE_ADDR')
            )
        
        # Always return success, even if user not found (security best practice)
        return {"success": True, "message": "If your email is registered, you will receive a reset link"}
            
    except Exception as e:
        # Still return success to avoid email enumeration
        return {"success": True, "message": "If your email is registered, you will receive a reset link"}


@router.post("/reset-password", response=MessageResponse)
def reset_password(request: HttpRequest, data: CompleteResetPasswordInput) -> Dict[str, Any]:
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
            return {
                "success": False, 
                "error": "Password must include uppercase, lowercase, and numeric characters"
            }
            
        # Get token from database
        token = Token.objects.filter(
            refresh_token=data.token,
            access_token='password_reset',
            is_valid=True,
            access_token_expires_at__gt=timezone.now()
        ).select_related('user').first()
        
        if not token:
            return {"success": False, "error": "Invalid or expired reset token"}
            
        # Get user
        user = token.user
        if user.deleted_at:
            return {"success": False, "error": "User account has been deleted"}
            
        # Update password
        user.password_hash = hash_password(data.password)
        user.save()
        
        # Invalidate all tokens for user
        Token.objects.filter(user=user).update(is_valid=False)
        
        return {"success": True, "message": "Password has been reset successfully"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/test", response=MessageResponse, auth=AuthBearer())
def test_auth(request: HttpRequest) -> Dict[str, Any]:
    """
    Test authentication - proves token is valid if this endpoint returns success
    """
    return {"success": True, "message": "Authentication successful"}
