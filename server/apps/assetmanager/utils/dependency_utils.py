"""
AssetManager Dependency Utilities — Core Access Control
========================================================

This module is the core access control layer. Every endpoint that touches a
specific entity uses functions from here to verify the user has access and
the required role.

Key Functions:

    get_entity_access(user_id, entity_id, session)
        The fundamental building block. Given a user and entity, traverses
        User → OrganizationMember → EntityOrganizationMember and returns the
        EntityOrganizationMember row through which the user has access (or None).
        The returned row carries .organization_id (the access org) and .role.

    get_entity_access_or_403(user_id, entity_id, session)
        Same as get_entity_access() but raises HTTP 403 instead of returning None.

    require_write_access(user_id, entity_id, session, roles)
        The standard write guard used by most subrouters. Composes three checks:
        1. get_entity_access_or_403 — does user have access to this entity?
        2. ensure_role — does user have one of the required roles?
        3. ensure_entity_subscription — does the entity's billing org have an
           active subscription (or is within free tier)?
        Returns EntityOrganizationMember. Every write endpoint should capture
        its return value and use .organization_id for audit context.

    require_entity_role(roles)
        FastAPI dependency factory — returns a Depends-compatible function.
        Used ONLY by entity_subrouter.py because entity CRUD endpoints have
        entity_id as a path parameter and need the Entity object directly
        (returns Entity, not EntityOrganizationMember). Automatically checks
        subscription for non-GET methods.

    get_accessible_entities(user, session, entity_type, min_role)
        FastAPI dependency for the entity list endpoint. Returns all Entity
        objects the user can access across all their organizations.

Guard Functions (composable building blocks):

    ensure_role(entity_access, roles)
        Pure check — raises 403 if entity_access.role not in roles. No DB call.

    ensure_entity_subscription(entity_access, session)
        Raises 403 if the entity's billing org (entity_access.entity.organization_id)
        is write-locked. Uses selectinload'd entity from get_entity_access().

    check_entity_subscription(entity_id, session)
        Standalone subscription check — loads entity itself to get owner org.
        Used by endpoints with custom auth (e.g., invitation accept/reject)
        where get_entity_access_or_403 is not called.

Historical Note:
    get_user_organization_id() was removed because it used LIMIT 1 to pick
    "the user's org", which is wrong for multi-org users. The correct approach
    is to always derive organization_id from the specific EntityOrganizationMember
    row returned by get_entity_access().
"""

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

async def get_entity_access(user_id: int, entity_id: int, session: AsyncSession) -> Optional[EntityOrganizationMember]:
    """Get user's access to an entity through ANY of their organizations"""
    # Get ALL user's organizations (user can be member of multiple orgs)
    result = await session.execute(
        select(OrganizationMember.organization_id)
        .filter(OrganizationMember.user_id == user_id)
    )
    user_org_ids = result.scalars().all()

    if not user_org_ids:
        return None

    # Check if any of user's organizations has access to entity (exclude soft-deleted)
    result = await session.execute(
        select(EntityOrganizationMember)
        .options(selectinload(EntityOrganizationMember.entity))
        .join(Entity, EntityOrganizationMember.entity_id == Entity.id)
        .filter(
            EntityOrganizationMember.organization_id.in_(user_org_ids),
            EntityOrganizationMember.entity_id == entity_id,
            EntityOrganizationMember.deleted_at.is_(None),
            Entity.deleted_at.is_(None)
        )
    )
    return result.scalar_one_or_none()


async def get_entity_access_or_403(
    user_id: int, entity_id: int, session: AsyncSession
) -> EntityOrganizationMember:
    """
    Get user's entity access or raise 403.

    Like get_entity_access() but raises instead of returning None.
    Use when you need entity_access and absence means forbidden.
    """
    entity_access = await get_entity_access(user_id, entity_id, session)
    if not entity_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this entity"
        )
    return entity_access


def ensure_role(entity_access: EntityOrganizationMember, roles: List[str]):
    """
    Guard: raise 403 if entity_access.role is not in allowed roles.

    Pure check — no DB call. Use after get_entity_access_or_403().
    """
    if entity_access.role not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You need {', '.join(roles)} role"
        )


async def ensure_entity_subscription(
    entity_access: EntityOrganizationMember, session: AsyncSession
):
    """
    Guard: raise 403 if entity owner org is write-locked.

    Uses entity_access.entity.organization_id (loaded via selectinload
    in get_entity_access). Use after get_entity_access_or_403().
    """
    if await is_org_write_locked(entity_access.entity.organization_id, session):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Entity owner subscription is inactive. Subscribe to continue editing."
        )


async def check_entity_subscription(entity_id: int, session: AsyncSession):
    """
    Standalone subscription check — loads entity to get owner org.

    Use for endpoints with custom auth (invitation accept/reject)
    where get_entity_access_or_403 is not called.
    """
    entity = await session.get(Entity, entity_id)
    if not entity:
        return  # Will be caught by get_record_or_404 elsewhere
    if await is_org_write_locked(entity.organization_id, session):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Entity owner subscription is inactive. Subscribe to continue editing."
        )


async def require_write_access(
    user_id: int,
    entity_id: int,
    session: AsyncSession,
    roles: List[str],
) -> EntityOrganizationMember:
    """
    Combined entity access + role + subscription check for write endpoints.

    Composes:
    1. get_entity_access_or_403 — user has access to entity?
    2. ensure_role — user has required role?
    3. ensure_entity_subscription — entity owner org has active subscription?

    Returns EntityOrganizationMember (has .entity via selectinload).
    """
    entity_access = await get_entity_access_or_403(user_id, entity_id, session)
    ensure_role(entity_access, roles)
    await ensure_entity_subscription(entity_access, session)
    return entity_access


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
        request: Request,
        user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
    ) -> Entity:
        # Get user's access to entity through their organization
        entity_access = await get_entity_access_or_403(user.id, entity_id, session)
        ensure_role(entity_access, roles)

        # Subscription check for write operations only
        # Why: reads always allowed, writes require entity owner active subscription
        if request.method not in ("GET", "HEAD", "OPTIONS"):
            await ensure_entity_subscription(entity_access, session)

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
    # Get ALL user's organizations (user can be member of multiple orgs)
    result = await session.execute(
        select(OrganizationMember.organization_id)
        .filter(OrganizationMember.user_id == user.id)
    )
    user_org_ids = result.scalars().all()

    if not user_org_ids:
        return []

    # Build query (exclude soft-deleted memberships and entities)
    query = (
        select(Entity)
        .join(EntityOrganizationMember)
        .filter(
            EntityOrganizationMember.organization_id.in_(user_org_ids),
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


