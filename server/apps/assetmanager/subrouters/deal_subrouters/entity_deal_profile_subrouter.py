"""
EntityDealProfile Subrouter

FastAPI router for EntityDealProfile model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.deal_models import EntityDealProfile
from ...schemas.deal_schemas.entity_deal_profile_schemas import (
    EntityDealProfile as EntityDealProfileSchema,
    EntityDealProfileCreate, EntityDealProfileUpdate,
    EntityDealProfileResponse, EntityDealProfilesResponse,
    EntityDealType
)
from ...utils.dependency_utils import get_entity_access, require_write_access
from ...utils.filtering_utils import get_user_entity_ids, apply_soft_delete_filter
from ...utils.crud_utils import (
    get_record_or_404,
    check_duplicate,
    create_with_audit,
    update_with_audit,
    soft_delete_with_audit,
)
from apps.accounts.utils.auth_utils import get_current_user
from apps.accounts.models import User

router = APIRouter(tags=["Entity Deal Profiles"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=EntityDealProfilesResponse)
async def list_entity_deal_profiles(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    entity_type: Optional[EntityDealType] = Query(None, description="Filter by entity type"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List entity deal profiles for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access (user's org → EntityOrganizationMember)
    3. Returns a paginated list of entity deal profiles
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return EntityDealProfilesResponse(success=True, data=[])

        # Build query - filter by accessible entities
        query = select(EntityDealProfile).filter(
            EntityDealProfile.entity_id.in_(accessible_entity_ids)
        )
        query = apply_soft_delete_filter(query, EntityDealProfile)

        # Apply filters
        if entity_id:
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(EntityDealProfile.entity_id == entity_id)

        if entity_type:
            query = query.filter(EntityDealProfile.entity_type == entity_type.value)

        # Apply pagination
        query = query.order_by(EntityDealProfile.created_at.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        profiles = result.scalars().all()

        return EntityDealProfilesResponse(
            success=True,
            data=[EntityDealProfileSchema.model_validate(profile) for profile in profiles]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list entity deal profiles: {str(e)}")

# ==========================================
# Individual EntityDealProfile Operations
# ==========================================

@router.get("/{profile_id}", response_model=EntityDealProfileResponse)
async def get_entity_deal_profile(
    profile_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get entity deal profile details - requires VIEW permission on entity

    This endpoint:
    1. Retrieves an entity deal profile by ID (excludes soft-deleted)
    2. Returns the profile details
    """
    try:
        profile = await get_record_or_404(session, EntityDealProfile, profile_id, "Entity deal profile")

        # Check entity access
        entity_access = await get_entity_access(user.id, profile.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return EntityDealProfileResponse(
            success=True,
            data=EntityDealProfileSchema.model_validate(profile)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get entity deal profile: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=EntityDealProfileResponse)
async def create_entity_deal_profile(
    data: EntityDealProfileCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create entity deal profile - requires EDITOR, ADMIN, or OWNER role on entity.

    This endpoint:
    1. Enforces 1:1 uniqueness (one profile per entity)
    2. Creates a new entity deal profile with the provided data
    3. Sets created_by from user context
    4. Logs the creation to the audit log
    5. Returns the created profile details
    """
    try:
        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # Enforce 1:1 uniqueness — one profile per entity
        await check_duplicate(
            db=session,
            model=EntityDealProfile,
            filters={"entity_id": data.entity_id},
            entity_label="Entity deal profile",
        )

        profile = await create_with_audit(
            db=session,
            model=EntityDealProfile,
            table_name="entity_deal_profiles",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(profile)

        return EntityDealProfileResponse(
            success=True,
            data=EntityDealProfileSchema.model_validate(profile)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create entity deal profile: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{profile_id}", response_model=EntityDealProfileResponse)
async def update_entity_deal_profile(
    profile_id: int,
    data: EntityDealProfileUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update entity deal profile - requires EDITOR, ADMIN, or OWNER role on entity

    This endpoint:
    1. Updates an entity deal profile with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated profile details
    """
    try:
        profile = await get_record_or_404(session, EntityDealProfile, profile_id, "Entity deal profile")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, profile.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # If entity_id is being changed, verify access + role + subscription on new entity + re-check duplicate
        if data.entity_id is not None and data.entity_id != profile.entity_id:
            await require_write_access(user.id, data.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

            await check_duplicate(
                db=session,
                model=EntityDealProfile,
                filters={"entity_id": data.entity_id},
                entity_label="Entity deal profile",
                exclude_id=profile_id,
            )

        await update_with_audit(
            db=session,
            item=profile,
            table_name="entity_deal_profiles",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(profile)

        return EntityDealProfileResponse(
            success=True,
            data=EntityDealProfileSchema.model_validate(profile)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update entity deal profile: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{profile_id}")
async def delete_entity_deal_profile(
    profile_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete entity deal profile - requires ADMIN or OWNER role on entity

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        profile = await get_record_or_404(session, EntityDealProfile, profile_id, "Entity deal profile")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, profile.entity_id, session, ['ADMIN', 'OWNER'])

        await soft_delete_with_audit(
            db=session,
            item=profile,
            table_name="entity_deal_profiles",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": "Entity deal profile has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete entity deal profile: {str(e)}")
