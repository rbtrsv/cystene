from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from django.db import transaction
from typing import List, Optional, Dict, Any

from ..models import Entity, EntityOrganizationMember
from apps.accounts.utils.auth_utils import AuthBearer
from ..utils.entity_decorators_utils import entity_role_required

# ==========================================
# Entity Schemas
# ==========================================

class EntityCreate(Schema):
    """Schema for creating a new entity"""
    name: str
    entity_type: str
    organization_id: int
    initial_valuation: Optional[float] = None
    cash_balance: Optional[float] = 0


class EntityUpdate(Schema):
    """Schema for updating an entity"""
    name: Optional[str] = None
    entity_type: Optional[str] = None
    current_valuation: Optional[float] = None
    cash_balance: Optional[float] = None


class EntityDetail(Schema):
    """Schema for entity details"""
    id: int
    name: str
    entity_type: str
    organization_id: Optional[int] = None
    current_valuation: Optional[float] = None
    cash_balance: Optional[float] = 0
    updated_at: Optional[str] = None
    
    class Config:
        from_attributes = True


class MessageResponse(Schema):
    """Simple message response"""
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None


# ==========================================
# Entities Router
# ==========================================

router = Router(tags=["Entities"])

@router.get("/", auth=AuthBearer(), response=List[EntityDetail])
def list_entities(request: HttpRequest):
    """
    List entities the user has access to.
    This includes:
    1. Entities the user has created
    2. Entities shared directly with the user
    3. Entities belonging to organizations the user is a member of
    """
    # Get entities the user has access to via organization membership
    from apps.accounts.models import OrganizationMember
    
    # Get organizations the user is a member of
    org_memberships = OrganizationMember.objects.filter(user=request.user)
    org_ids = [m.organization_id for m in org_memberships]
    
    # Get entities belonging to these organizations
    entities = Entity.objects.filter(organization_id__in=org_ids)
    
    # TODO: Add logic to get entities shared with the user directly
    
    return [
        {
            "id": entity.id,
            "name": entity.name,
            "entity_type": entity.entity_type,
            "organization_id": entity.organization.id if entity.organization else None,
            "current_valuation": entity.current_valuation,
            "cash_balance": entity.cash_balance,
            "updated_at": entity.updated_at.isoformat() if entity.updated_at else None
        }
        for entity in entities
    ]

@router.get("/{entity_id}", auth=AuthBearer(), response=EntityDetail)
@entity_role_required(["VIEWER", "EDITOR", "ADMIN", "OWNER"])
def get_entity(request: HttpRequest, entity_id: int):
    """
    Get details for a specific entity.
    Requires at least VIEWER role.
    """
    entity = request.entity
    
    return {
        "id": entity.id,
        "name": entity.name,
        "entity_type": entity.entity_type,
        "organization_id": entity.organization.id if entity.organization else None,
        "current_valuation": entity.current_valuation,
        "cash_balance": entity.cash_balance,
        "updated_at": entity.updated_at.isoformat() if entity.updated_at else None
    }

@router.post("/", auth=AuthBearer(), response=EntityDetail)
def create_entity(request: HttpRequest, data: EntityCreate):
    """
    Create a new entity.
    If an organization_id is provided, the user must be a member.
    """
    # Check if organization exists and user has access (if org ID provided)
    org = None
    if data.organization_id:
        from apps.accounts.models import Organization, OrganizationMember
        try:
            org = Organization.objects.get(id=data.organization_id)
            # Check if user is a member of this organization
            if not OrganizationMember.objects.filter(user=request.user, organization=org).exists():
                raise HttpError(403, "You are not a member of this organization")
        except Organization.DoesNotExist:
            raise HttpError(404, "Organization not found")
    
    # Create entity
    entity = Entity.objects.create(
        name=data.name,
        entity_type=data.entity_type,
        organization=org,
        current_valuation=data.initial_valuation,
        cash_balance=data.cash_balance
    )
    
    # Create EntityOrganizationMember with OWNER role for the organization
    if org:
        EntityOrganizationMember.objects.create(
            entity=entity,
            organization=org,
            role="OWNER"
        )
    
    return {
        "id": entity.id,
        "name": entity.name,
        "entity_type": entity.entity_type,
        "organization_id": entity.organization.id if entity.organization else None,
        "current_valuation": entity.current_valuation,
        "cash_balance": entity.cash_balance,
        "updated_at": entity.updated_at.isoformat() if entity.updated_at else None
    }

@router.put("/{entity_id}", auth=AuthBearer(), response=EntityDetail)
@entity_role_required(["EDITOR", "ADMIN", "OWNER"])
def update_entity(request: HttpRequest, entity_id: int, data: EntityUpdate):
    """
    Update an entity's details.
    Requires EDITOR role or higher.
    """
    entity = request.entity
    
    # Update only the fields that were provided
    if data.name is not None:
        entity.name = data.name
    if data.entity_type is not None:
        entity.entity_type = data.entity_type
    if data.current_valuation is not None:
        entity.current_valuation = data.current_valuation
    if data.cash_balance is not None:
        entity.cash_balance = data.cash_balance
    
    entity.save()
    
    return {
        "id": entity.id,
        "name": entity.name,
        "entity_type": entity.entity_type,
        "organization_id": entity.organization.id if entity.organization else None,
        "current_valuation": entity.current_valuation,
        "cash_balance": entity.cash_balance,
        "updated_at": entity.updated_at.isoformat() if entity.updated_at else None
    }

@router.delete("/{entity_id}", auth=AuthBearer(), response=MessageResponse)
@entity_role_required(["ADMIN", "OWNER"])
def delete_entity(request: HttpRequest, entity_id: int):
    """
    Delete an entity.
    Requires ADMIN or OWNER role.
    """
    entity = request.entity
    name = entity.name
    entity.delete()
    
    return {
        "success": True,
        "message": f"Entity '{name}' has been deleted"
    }
