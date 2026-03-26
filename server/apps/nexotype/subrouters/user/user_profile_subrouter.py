from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import UserProfile
from ...schemas.user.user_profile_schemas import (
    UserProfileCreate,
    UserProfileDetail,
    UserProfileListResponse,
    UserProfileResponse,
    UserProfileUpdate,
    MessageResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.filtering_utils import apply_default_filters
from ...utils.crud_utils import (
    check_duplicate,
    create_with_audit,
    get_owned_record_or_404,
    soft_delete_with_audit,
    update_with_audit,
)

# ==========================================
# User Profiles Router
# ==========================================

router = APIRouter(tags=["UserProfiles"])


@router.get("/", response_model=UserProfileListResponse)
async def list_user_profiles(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List user profiles with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of user profiles
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total user profiles (with filters applied)
        count_query = select(func.count(UserProfile.id))
        count_query = apply_default_filters(count_query, UserProfile, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get user profiles with pagination (with filters applied)
        data_query = select(UserProfile).order_by(UserProfile.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, UserProfile, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return UserProfileListResponse(
            success=True,
            data=[UserProfileDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{user_profile_id}", response_model=UserProfileResponse)
async def get_user_profile(
    user_profile_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific user profile

    This endpoint:
    1. Retrieves a user profile by ID (excludes soft-deleted, enforces ownership)
    2. Returns the user profile details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=UserProfile,
            item_id=user_profile_id,
            user_org_id=org_id,
            entity_label="UserProfile",
        )
        return UserProfileResponse(
            success=True,
            data=UserProfileDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=UserProfileResponse)
async def create_user_profile(
    payload: UserProfileCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new user profile

    This endpoint:
    1. Checks for duplicate user_id (unique per profile)
    2. Checks for duplicate subject_id (unique per profile)
    3. Creates a new user profile with the provided data
    4. Sets created_by and organization_id from user context
    5. Logs the creation to the audit log
    6. Returns the created user profile details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Check duplicate user_id (each user can only have one profile)
        await check_duplicate(
            db=db,
            model=UserProfile,
            filters={"user_id": payload.user_id},
            entity_label="UserProfile",
        )

        # Check duplicate subject_id (each subject can only have one profile)
        await check_duplicate(
            db=db,
            model=UserProfile,
            filters={"subject_id": payload.subject_id},
            entity_label="UserProfile",
        )

        item = await create_with_audit(
            db=db,
            model=UserProfile,
            table_name="user_profiles",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return UserProfileResponse(
            success=True,
            data=UserProfileDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{user_profile_id}", response_model=UserProfileResponse)
async def update_user_profile(
    user_profile_id: int,
    payload: UserProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a user profile

    This endpoint:
    1. Updates a user profile with the provided data
    2. Checks for duplicate user_id (excluding self, only if changing)
    3. Checks for duplicate subject_id (excluding self, only if changing)
    4. Sets updated_by from user context
    5. Logs the update to the audit log with old/new data
    6. Returns the updated user profile details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=UserProfile,
            item_id=user_profile_id,
            user_org_id=org_id,
            entity_label="UserProfile",
        )

        update_data = payload.model_dump(exclude_unset=True)

        # Check duplicate user_id if changing
        if "user_id" in update_data and update_data["user_id"] != item.user_id:
            await check_duplicate(
                db=db,
                model=UserProfile,
                filters={"user_id": update_data["user_id"]},
                entity_label="UserProfile",
                exclude_id=user_profile_id,
            )

        # Check duplicate subject_id if changing
        if "subject_id" in update_data and update_data["subject_id"] != item.subject_id:
            await check_duplicate(
                db=db,
                model=UserProfile,
                filters={"subject_id": update_data["subject_id"]},
                entity_label="UserProfile",
                exclude_id=user_profile_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="user_profiles",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return UserProfileResponse(
            success=True,
            data=UserProfileDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{user_profile_id}", response_model=MessageResponse)
async def delete_user_profile(
    user_profile_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a user profile

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=UserProfile,
            item_id=user_profile_id,
            user_org_id=org_id,
            entity_label="UserProfile",
        )

        label = item.user_id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="user_profiles",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"UserProfile for user_id {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
