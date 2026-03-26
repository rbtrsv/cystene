from functools import wraps
from typing import Callable, List, Optional, Union
from ninja.errors import HttpError
from django.http import HttpRequest

from ..models import Entity, EntityOrganizationMember
from apps.accounts.utils.decorators_utils import organization_subscription_required
from apps.accounts.models import OrganizationMember

# ==========================================
# Constants
# ==========================================

# Entity roles from lowest to highest permission
ENTITY_ROLES = ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']

# ==========================================
# Permission Decorators
# ==========================================

def entity_role_required(
    roles: Union[str, List[str]], 
    entity_id_param: str = 'entity_id'
):
    """
    Decorator that checks if the user has one of the required roles for the entity.
    
    The role is determined by the user's organization's role for the entity.
    
    Args:
        roles: Role or list of roles allowed to access this endpoint
        entity_id_param: The name of the parameter that contains the entity ID
    
    Usage:
        @router.put('/entities/{entity_id}')
        @entity_role_required(['EDITOR', 'ADMIN', 'OWNER'])
        def update_entity(request, entity_id: int):
            # This will only execute if the user has EDITOR, ADMIN or OWNER role
    """
    if isinstance(roles, str):
        roles = [roles]
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(request: HttpRequest, *args, **kwargs):
            # Get entity ID from kwargs
            entity_id = kwargs.get(entity_id_param)
            if not entity_id:
                raise HttpError(400, f"Missing required parameter: {entity_id_param}")
            
            # Check if user is authenticated
            if not hasattr(request, 'user') or not request.user:
                raise HttpError(401, "Authentication required")
            
            try:
                # Get the entity
                entity = Entity.objects.get(id=entity_id)
                
                # Store entity in request for reuse
                request.entity = entity
                
                # Get user's organizations
                user_orgs = OrganizationMember.objects.filter(
                    user=request.user
                ).values_list('organization_id', flat=True)
                
                # Check if any of user's organizations have the required role for this entity
                entity_org_members = EntityOrganizationMember.objects.filter(
                    entity=entity,
                    organization_id__in=user_orgs
                )
                
                for entity_org_member in entity_org_members:
                    if entity_org_member.role in roles:
                        return func(request, *args, **kwargs)
                
                # Special case: If user is the owner of the entity's organization
                if entity.organization_id in user_orgs:
                    org_member = OrganizationMember.objects.get(
                        user=request.user,
                        organization_id=entity.organization_id
                    )
                    if org_member.role == 'OWNER':
                        return func(request, *args, **kwargs)
                
                # Default deny if no rules match
                role_list = ", ".join(roles)
                raise HttpError(403, f"You need one of these roles: {role_list}")
                
            except Entity.DoesNotExist:
                raise HttpError(404, "Entity not found")
            
        return wrapper
    
    return decorator

def entity_subscription_required(
    subscription_tier: str = 'FREE',
    entity_roles: Union[str, List[str]] = ['OWNER', 'ADMIN', 'EDITOR'],
    entity_id_param: str = 'entity_id',
    organization_id_param: Optional[str] = None
):
    """
    Combined decorator that checks organization subscription and entity role.
    
    If organization_id_param is provided, it will use that to check the subscription.
    If not provided, it will get the organization from the entity.
    
    Args:
        subscription_tier: Minimum subscription tier required
        entity_roles: Entity role or list of roles allowed
        entity_id_param: The name of the parameter that contains the entity ID
        organization_id_param: Optional. The parameter containing the organization ID.
                              If not provided, will get organization from entity.
    
    Usage:
        # When organization ID is in the URL:
        @router.post('/organizations/{organization_id}/entities/{entity_id}/action')
        @entity_subscription_required('PRO', ['ADMIN'], organization_id_param='organization_id')
        def complex_operation(request, organization_id: int, entity_id: int):
            # Uses organization ID from URL parameter
            
        # When only entity ID is in the URL:
        @router.post('/entities/{entity_id}/action')
        @entity_subscription_required('PRO', ['ADMIN'])
        def entity_only_operation(request, entity_id: int):
            # Will get organization ID from the entity
    """
    if isinstance(entity_roles, str):
        entity_roles = [entity_roles]
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(request: HttpRequest, *args, **kwargs):
            # First, use entity_role_required to get and verify entity role
            # This will populate request.entity
            entity_role_checker = entity_role_required(entity_roles, entity_id_param)
            
            # Check entity role first
            entity_role_result = entity_role_checker(lambda req, *a, **kw: None)(request, *args, **kwargs)
            if entity_role_result is not None:
                # Role check failed, return the error
                return entity_role_result
            
            # If we get here, entity access is granted and request.entity is set
            
            # Now check subscription
            entity = getattr(request, 'entity', None)
            if not entity:
                raise HttpError(500, "Entity access check did not set request.entity")
                
            # Get the organization ID
            org_id = None
            
            # If organization_id_param is provided, get org ID from kwargs
            if organization_id_param:
                org_id = kwargs.get(organization_id_param)
                if not org_id:
                    raise HttpError(400, f"Missing required parameter: {organization_id_param}")
            # Otherwise, get the organization from the entity
            elif hasattr(entity, 'organization') and entity.organization:
                org_id = entity.organization.id
            else:
                raise HttpError(400, "Could not determine organization for subscription check")
            
            # Add organization ID to kwargs temporarily for the subscription check
            kwargs['_temp_organization_id'] = org_id
            
            # Check organization subscription
            subscription_checker = organization_subscription_required(
                subscription_tier, 
                organization_id_param='_temp_organization_id'
            )
            
            # Apply subscription check
            subscription_result = subscription_checker(lambda req, *a, **kw: None)(request, *args, **kwargs)
            if subscription_result is not None:
                # Subscription check failed, return the error
                return subscription_result
            
            # Clean up temporary kwargs
            if '_temp_organization_id' in kwargs:
                del kwargs['_temp_organization_id']
            
            # If we get here, both checks have passed
            return func(request, *args, **kwargs)
        
        return wrapper
    
    return decorator
