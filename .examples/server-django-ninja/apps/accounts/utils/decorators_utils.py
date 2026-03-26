from functools import wraps
from typing import Callable, List, Optional, Union
from ninja.errors import HttpError
from django.http import HttpRequest

from ..models import User, Organization, OrganizationMember, Subscription

# ==========================================
# Constants
# ==========================================

# Subscription tiers from lowest to highest
SUBSCRIPTION_TIERS = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE']

# Organization roles from lowest to highest permission level
ORGANIZATION_ROLES = ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']

# ==========================================
# Permission Decorators
# ==========================================

def organization_role_required(roles: Union[str, List[str]], organization_id_param: str = 'organization_id'):
    """
    Decorator that checks if the user has one of the required roles in the organization.
    
    Args:
        roles: Role or list of roles allowed to access this endpoint
        organization_id_param: The name of the parameter that contains the organization ID
    
    Usage:
        @router.delete('/organizations/{organization_id}')
        @organization_role_required('OWNER')
        def delete_organization(request, organization_id: int):
            # This will only execute if the user has the 'OWNER' role
    """
    if isinstance(roles, str):
        roles = [roles]
        
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(request: HttpRequest, *args, **kwargs):
            # Get organization ID from kwargs
            org_id = kwargs.get(organization_id_param)
            if not org_id:
                raise HttpError(400, f"Missing required parameter: {organization_id_param}")
            
            # Check if user is authenticated
            if not hasattr(request, 'user') or not request.user:
                raise HttpError(401, "Authentication required")
                
            # Get user's membership and check role
            try:
                user_id = request.user.id
                membership = OrganizationMember.objects.select_related('organization').get(
                    organization_id=org_id,
                    user_id=user_id
                )
                
                if membership.role not in roles:
                    role_list = ", ".join(roles)
                    raise HttpError(403, f"You need one of these roles: {role_list}")
                    
                # Store organization in request for reuse
                request.organization = membership.organization
                
            except OrganizationMember.DoesNotExist:
                raise HttpError(403, "You are not a member of this organization")
            
            # If check passes, call the original function
            return func(request, *args, **kwargs)
        
        return wrapper
    
    return decorator


def organization_subscription_required(tier: str, organization_id_param: str = 'organization_id'):
    """
    Decorator that checks if the organization has an active subscription of at least the specified tier.
    
    Args:
        tier: Minimum subscription tier required (e.g. 'BASIC', 'PRO')
        organization_id_param: The name of the parameter that contains the organization ID
    
    Usage:
        @router.post('/organizations/{organization_id}/advanced-feature')
        @organization_subscription_required('PRO')
        def use_advanced_feature(request, organization_id: int):
            # This will only execute if the organization has a PRO subscription or higher
    """
    if tier not in SUBSCRIPTION_TIERS:
        raise ValueError(f"Invalid tier: {tier}. Must be one of {SUBSCRIPTION_TIERS}")
    
    required_tier_index = SUBSCRIPTION_TIERS.index(tier)
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(request: HttpRequest, *args, **kwargs):
            # Get organization ID from kwargs
            org_id = kwargs.get(organization_id_param)
            if not org_id:
                raise HttpError(400, f"Missing required parameter: {organization_id_param}")
            
            # Check if user is authenticated
            if not hasattr(request, 'user') or not request.user:
                raise HttpError(401, "Authentication required")
                
            # First check if user is a member
            try:
                user_id = request.user.id
                membership = OrganizationMember.objects.select_related('organization').get(
                    organization_id=org_id,
                    user_id=user_id
                )
                organization = membership.organization
                
                # Store organization in request for reuse
                request.organization = organization
                
            except OrganizationMember.DoesNotExist:
                raise HttpError(403, "You are not a member of this organization")
            
            # Then check subscription
            try:
                subscription = Subscription.objects.get(organization=organization)
                
                # Check if subscription is active
                if subscription.subscription_status != 'ACTIVE':
                    raise HttpError(403, "This feature requires an active subscription")
                
                # Check tier
                if not subscription.plan_name or subscription.plan_name not in SUBSCRIPTION_TIERS:
                    current_tier_index = 0  # Default to FREE
                else:
                    current_tier_index = SUBSCRIPTION_TIERS.index(subscription.plan_name)
                
                if current_tier_index < required_tier_index:
                    raise HttpError(403, f"This feature requires at least a {tier} subscription")
                
            except Subscription.DoesNotExist:
                if required_tier_index > 0:  # If anything above FREE is required
                    raise HttpError(403, "This feature requires a subscription")
            
            # If all checks pass, call the original function
            return func(request, *args, **kwargs)
        
        return wrapper
    
    return decorator


def organization_subscription_and_role_required(
    tier: str, 
    roles: Union[str, List[str]], 
    organization_id_param: str = 'organization_id'
):
    """
    Combined decorator that checks both subscription tier and user role.
    
    Args:
        tier: Minimum subscription tier required
        roles: Role or list of roles allowed to access this endpoint
        organization_id_param: The name of the parameter that contains the organization ID
    
    Usage:
        @router.post('/organizations/{organization_id}/admin-feature')
        @organization_subscription_and_role_required('PRO', ['ADMIN', 'OWNER'])
        def use_admin_feature(request, organization_id: int):
            # This will only execute if:
            # 1. The organization has a PRO subscription or higher
            # 2. The user has ADMIN or OWNER role
    """
    if isinstance(roles, str):
        roles = [roles]
        
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(request: HttpRequest, *args, **kwargs):
            # Get organization ID from kwargs
            org_id = kwargs.get(organization_id_param)
            if not org_id:
                raise HttpError(400, f"Missing required parameter: {organization_id_param}")
            
            # Check if user is authenticated
            if not hasattr(request, 'user') or not request.user:
                raise HttpError(401, "Authentication required")
                
            # Check role first
            try:
                user_id = request.user.id
                membership = OrganizationMember.objects.select_related('organization').get(
                    organization_id=org_id,
                    user_id=user_id
                )
                
                if membership.role not in roles:
                    role_list = ", ".join(roles)
                    raise HttpError(403, f"You need one of these roles: {role_list}")
                
                organization = membership.organization
                
                # Store organization in request for reuse
                request.organization = organization
                
            except OrganizationMember.DoesNotExist:
                raise HttpError(403, "You are not a member of this organization")
            
            # Then check subscription
            if tier in SUBSCRIPTION_TIERS and SUBSCRIPTION_TIERS.index(tier) > 0:  # If anything above FREE
                try:
                    subscription = Subscription.objects.get(organization=organization)
                    
                    # Check if subscription is active
                    if subscription.subscription_status != 'ACTIVE':
                        raise HttpError(403, "This feature requires an active subscription")
                    
                    # Check tier
                    if not subscription.plan_name or subscription.plan_name not in SUBSCRIPTION_TIERS:
                        current_tier_index = 0  # Default to FREE
                    else:
                        current_tier_index = SUBSCRIPTION_TIERS.index(subscription.plan_name)
                    
                    required_tier_index = SUBSCRIPTION_TIERS.index(tier)
                    if current_tier_index < required_tier_index:
                        raise HttpError(403, f"This feature requires at least a {tier} subscription")
                    
                except Subscription.DoesNotExist:
                    raise HttpError(403, "This feature requires a subscription")
            
            # If all checks pass, call the original function
            return func(request, *args, **kwargs)
        
        return wrapper
    
    return decorator
