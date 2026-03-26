from typing import List, Union, Optional
from fastapi import HTTPException, status, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..models.entity_models import Entity, EntityOrganizationMember
from ..schemas.entity_schemas.entity_schemas import EntityType
from .subscription_utils import is_org_write_locked
from apps.accounts.models import User, OrganizationMember
from apps.accounts.utils.auth_utils import get_current_user
from core.db import get_session

# ==========================================
# Constants
# ==========================================

# Entity roles from lowest to highest permission level
ENTITY_ROLES = ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']

# Entity types supported by the system
ENTITY_TYPES = [EntityType.FUND.value, EntityType.COMPANY.value, EntityType.INDIVIDUAL.value]

# ==========================================
# Helper Functions
# ==========================================

async def get_user_organization_id(user_id: int, session: AsyncSession) -> Optional[int]:
    """Get the user's organization ID"""
    result = await session.execute(
        select(OrganizationMember.organization_id)
        .filter(OrganizationMember.user_id == user_id)
        .limit(1)
    )
    org_membership = result.scalar_one_or_none()
    return org_membership


async def get_entity_access(user_id: int, entity_id: int, session: AsyncSession) -> Optional[EntityOrganizationMember]:
    """Get user's access to an entity through their organization"""
    # First get user's organization
    user_org_id = await get_user_organization_id(user_id, session)
    if not user_org_id:
        return None

    # Then check if organization has access to entity (exclude soft-deleted memberships and entities)
    result = await session.execute(
        select(EntityOrganizationMember)
        .options(selectinload(EntityOrganizationMember.entity))
        .join(Entity, EntityOrganizationMember.entity_id == Entity.id)
        .filter(
            EntityOrganizationMember.organization_id == user_org_id,
            EntityOrganizationMember.entity_id == entity_id,
            EntityOrganizationMember.deleted_at.is_(None),
            Entity.deleted_at.is_(None)
        )
    )
    return result.scalar_one_or_none()


def validate_role(role: str) -> bool:
    """Validate if role is valid"""
    return role in ENTITY_ROLES


# ==========================================
# Permission Dependencies
# ==========================================

def require_entity_role(roles: Union[str, List[str]]):
    """
    FastAPI dependency factory to check if user has required role for entity

    Args:
        roles: Role or list of roles allowed to access this endpoint

    Returns:
        FastAPI dependency function

    Usage:
        @router.get('/entities/{entity_id}')
        async def get_entity(
            entity_id: int,
            user: User = Depends(get_current_user),
            entity: Entity = Depends(require_entity_role(['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']))
        ):
    """
    if isinstance(roles, str):
        roles = [roles]

    async def dependency(
        entity_id: int,
        user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
    ) -> Entity:
        # Get user's access to entity through their organization
        entity_access = await get_entity_access(user.id, entity_id, session)

        if not entity_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this entity"
            )

        if entity_access.role not in roles:
            role_list = ", ".join(roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You need one of these roles: {role_list}"
            )

        return entity_access.entity

    return dependency


# ==========================================
# Other Dependencies
# ==========================================

async def get_accessible_entities(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    entity_type: Optional[str] = None,
    min_role: Optional[str] = None
) -> List[Entity]:
    """
    FastAPI dependency to get all entities the user has access to

    Args:
        user: Current authenticated user
        session: Database session
        entity_type: Optional filter by entity type (fund, company, individual)
        min_role: Optional minimum role required (VIEWER, EDITOR, ADMIN, OWNER)

    Returns:
        List of entities the user can access

    Usage:
        @router.get('/entities')
        async def list_entities(
            entities: List[Entity] = Depends(get_accessible_entities)
        ):
    """
    # Get user's organization
    user_org_id = await get_user_organization_id(user.id, session)
    if not user_org_id:
        return []

    # Build query (exclude soft-deleted memberships and entities)
    query = (
        select(Entity)
        .join(EntityOrganizationMember)
        .filter(
            EntityOrganizationMember.organization_id == user_org_id,
            EntityOrganizationMember.deleted_at.is_(None),
            Entity.deleted_at.is_(None)
        )
    )

    # Apply entity type filter
    if entity_type:
        if entity_type not in ENTITY_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid entity type: {entity_type}. Must be one of {ENTITY_TYPES}"
            )
        query = query.filter(Entity.entity_type == entity_type)

    # Apply role filter
    if min_role:
        if not validate_role(min_role):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role: {min_role}. Must be one of {ENTITY_ROLES}"
            )

        # Get roles that meet minimum requirement
        min_role_index = ENTITY_ROLES.index(min_role)
        allowed_roles = ENTITY_ROLES[min_role_index:]
        query = query.filter(EntityOrganizationMember.role.in_(allowed_roles))

    result = await session.execute(query)
    return result.scalars().all()


# ==========================================
# Subscription Dependencies
# ==========================================

async def require_active_subscription(
    request: Request,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Router-level dependency that enforces subscription-based write lock.

    Applied at the assetmanager router level — covers all subrouters
    without modifying each one individually.

    Behavior:
    - GET/HEAD/OPTIONS → pass through (reads always allowed)
    - POST/PUT/DELETE → check if org is write-locked

    An org is write-locked when subscription is inactive (CANCELED, PAST_DUE, etc.)
    AND entity count exceeds FREE_ENTITY_LIMIT. Within the free tier, no
    subscription is needed — writes always allowed.

    Args:
        request: FastAPI Request (to check HTTP method)
        user: Current authenticated user (resolved by get_current_user)
        session: Database session
    """
    # Reads always allowed — no subscription check needed
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return

    # Get user's organization
    org_id = await get_user_organization_id(user.id, session)
    if not org_id:
        # No org membership — entity access checks in each subrouter will catch this
        return

    # Check if organization is in read-only mode (soft lock)
    if await is_org_write_locked(org_id, session):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your subscription is inactive. Subscribe to continue editing."
        )
