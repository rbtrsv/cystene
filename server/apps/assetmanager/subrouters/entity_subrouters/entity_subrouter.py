"""
Entity Subrouter

FastAPI router for Entity model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.entity_models import Entity, EntityOrganizationMember
from ...schemas.entity_schemas.entity_schemas import (
    Entity as EntitySchema,
    CreateEntity, UpdateEntity,
    EntityResponse, EntitiesResponse,
    EntityType, EntityRole
)
from ...utils.dependency_utils import require_entity_role, get_user_organization_id
from ...utils.filtering_utils import get_user_entity_ids, apply_soft_delete_filter
from ...utils.audit_utils import log_audit
from ...utils.crud_utils import (
    update_with_audit,
    soft_delete_with_audit,
)
from ...utils.subscription_utils import (
    FREE_ENTITY_LIMIT,
    get_org_entity_count,
    get_org_subscription,
    sync_stripe_quantity,
)
from apps.accounts.utils.auth_utils import get_current_user
from apps.accounts.models import User, Organization, OrganizationMember

router = APIRouter(tags=["Entities"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=EntitiesResponse)
async def list_entities(
    entity_type: Optional[EntityType] = Query(None, description="Filter by entity type"),
    organization_id: Optional[int] = Query(None, description="Filter by organization"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access (user's org → EntityOrganizationMember)
    3. Returns a paginated list of entities
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return EntitiesResponse(success=True, data=[])

        # Build query — filter by accessible entities, exclude soft-deleted
        query = select(Entity).filter(Entity.id.in_(accessible_entity_ids))
        query = apply_soft_delete_filter(query, Entity)

        # Apply filters
        if entity_type:
            query = query.filter(Entity.entity_type == entity_type)

        if organization_id:
            query = query.filter(Entity.organization_id == organization_id)

        # Apply pagination
        query = query.order_by(Entity.name).offset(offset).limit(limit)
        result = await session.execute(query)
        entities = result.scalars().all()

        return EntitiesResponse(
            success=True,
            data=[EntitySchema.model_validate(entity) for entity in entities]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list entities: {str(e)}")

# ==========================================
# Individual Entity Operations
# ==========================================

@router.get("/{entity_id}", response_model=EntityResponse)
async def get_entity(
    entity_id: int,
    user: User = Depends(get_current_user),
    entity: Entity = Depends(require_entity_role(["VIEWER", "EDITOR", "ADMIN", "OWNER"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Get entity details - requires VIEW permission

    This endpoint:
    1. Retrieves an entity by ID (excludes soft-deleted via require_entity_role)
    2. Returns the entity details
    """
    return EntityResponse(
        success=True,
        data=EntitySchema.model_validate(entity)
    )

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=EntityResponse)
async def create_entity(
    data: CreateEntity,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new entity.
    User must be a member of the specified organization.

    This endpoint:
    1. Checks org membership and role
    2. Checks subscription-based entity limit (FREE_ENTITY_LIMIT)
    3. Creates a new entity with the provided data
    4. Sets created_by from user context
    5. Creates EntityOrganizationMember with OWNER role
    6. Logs the creation to the audit log
    7. Auto-syncs Stripe quantity after successful create
    8. Returns the created entity details

    NOTE: Not using create_with_audit here because entity create has
    special logic — it also creates an EntityOrganizationMember row
    with OWNER role, and entity has organization_id on the record.
    """
    try:
        # Check if user is member of the organization
        org_member = await session.scalar(
            select(OrganizationMember).filter(
                OrganizationMember.user_id == user.id,
                OrganizationMember.organization_id == data.organization_id
            )
        )

        if not org_member:
            raise HTTPException(status_code=403, detail="You are not a member of this organization")

        # Check if user has permission to create entities (EDITOR, ADMIN, or OWNER)
        if org_member.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to create entities")

        # Check if organization exists
        organization = await session.get(Organization, data.organization_id)
        if not organization:
            raise HTTPException(status_code=404, detail="Organization not found")

        # ── Subscription-based entity limit ──
        # Count current entities for this org (non-deleted)
        entity_count = await get_org_entity_count(data.organization_id, session)
        subscription = None

        # If org is at or over the free tier limit, require active subscription
        if entity_count >= FREE_ENTITY_LIMIT:
            subscription = await get_org_subscription(data.organization_id, session)
            if not subscription or subscription.subscription_status not in ('ACTIVE', 'TRIALING'):
                raise HTTPException(
                    status_code=403,
                    detail="Subscribe to add more entities"
                )

        # Create entity — set created_by for audit trail
        # Entity has organization_id on the record (unlike other assetmanager models)
        entity = Entity(
            name=data.name,
            entity_type=data.entity_type.value,  # Convert enum to string
            parent_id=data.parent_id,
            current_valuation=data.current_valuation,
            organization_id=data.organization_id,
            cash_balance=data.cash_balance,
            created_by=user.id
        )

        session.add(entity)
        await session.flush()  # Get the entity ID

        # Create EntityOrganizationMember with OWNER role for the organization
        entity_member = EntityOrganizationMember(
            entity_id=entity.id,
            organization_id=data.organization_id,
            role=EntityRole.OWNER.value,
            created_by=user.id
        )

        session.add(entity_member)

        # Log audit
        await log_audit(
            session=session,
            table_name="entities",
            record_id=entity.id,
            action="INSERT",
            new_data=data.model_dump(),
            user_id=user.id,
            organization_id=data.organization_id
        )

        await session.commit()
        await session.refresh(entity)

        # ── Auto-sync Stripe quantity after successful commit ──
        # Only sync if org is past the free tier (has a subscription)
        # entity_count was pre-create, so new count = entity_count + 1
        if entity_count >= FREE_ENTITY_LIMIT and subscription and subscription.stripe_subscription_id:
            await sync_stripe_quantity(subscription, entity_count + 1)

        return EntityResponse(
            success=True,
            data=EntitySchema.model_validate(entity)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create entity: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{entity_id}", response_model=EntityResponse)
async def update_entity(
    entity_id: int,
    data: UpdateEntity,
    user: User = Depends(get_current_user),
    entity: Entity = Depends(require_entity_role(["EDITOR", "ADMIN", "OWNER"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Update entity - requires EDITOR, ADMIN, or OWNER role

    This endpoint:
    1. Updates an entity with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated entity details
    """
    try:
        org_id = await get_user_organization_id(user.id, session)

        # update_with_audit handles: old snapshot + setattr loop + updated_by + UPDATE audit
        # Enum→value conversion handled inside the helper
        await update_with_audit(
            db=session,
            item=entity,
            table_name="entities",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(entity)

        return EntityResponse(
            success=True,
            data=EntitySchema.model_validate(entity)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update entity: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{entity_id}")
async def delete_entity(
    entity_id: int,
    user: User = Depends(get_current_user),
    entity: Entity = Depends(require_entity_role(["OWNER"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete an entity - requires OWNER role

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Auto-decrements Stripe quantity after successful delete
    4. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, session)
        name = entity.name

        # soft_delete_with_audit handles: old snapshot + deleted_at/deleted_by + DELETE audit
        await soft_delete_with_audit(
            db=session,
            item=entity,
            table_name="entities",
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()

        # ── Auto-decrement Stripe quantity after successful delete ──
        # entity_count is already decremented (soft-deleted entity excluded by filter)
        if org_id:
            entity_count = await get_org_entity_count(org_id, session)
            # Only sync if org is past the free tier (has billable entities)
            if entity_count >= FREE_ENTITY_LIMIT:
                subscription = await get_org_subscription(org_id, session)
                if subscription and subscription.stripe_subscription_id:
                    await sync_stripe_quantity(subscription, entity_count)

        return {
            "success": True,
            "message": f"Entity '{name}' has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete entity: {str(e)}")
