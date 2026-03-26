from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import UserVariant
from ...schemas.user.user_variant_schemas import (
    UserVariantCreate,
    UserVariantDetail,
    UserVariantListResponse,
    UserVariantResponse,
    UserVariantUpdate,
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
# User Variants Router
# ==========================================

router = APIRouter(tags=["UserVariants"])


@router.get("/", response_model=UserVariantListResponse)
async def list_user_variants(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List user variants with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of user variants
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total user variants (with filters applied)
        count_query = select(func.count(UserVariant.id))
        count_query = apply_default_filters(count_query, UserVariant, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get user variants with pagination (with filters applied)
        data_query = select(UserVariant).order_by(UserVariant.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, UserVariant, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return UserVariantListResponse(
            success=True,
            data=[UserVariantDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{user_variant_id}", response_model=UserVariantResponse)
async def get_user_variant(
    user_variant_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific user variant

    This endpoint:
    1. Retrieves a user variant by ID (excludes soft-deleted, enforces ownership)
    2. Returns the user variant details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=UserVariant,
            item_id=user_variant_id,
            user_org_id=org_id,
            entity_label="UserVariant",
        )
        return UserVariantResponse(
            success=True,
            data=UserVariantDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=UserVariantResponse)
async def create_user_variant(
    payload: UserVariantCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new user variant

    This endpoint:
    1. Checks for duplicate subject_id + variant_id combination
    2. Creates a new user variant with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created user variant details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Check duplicate subject_id + variant_id (composite unique)
        await check_duplicate(
            db=db,
            model=UserVariant,
            filters={"subject_id": payload.subject_id, "variant_id": payload.variant_id},
            entity_label="UserVariant",
        )

        item = await create_with_audit(
            db=db,
            model=UserVariant,
            table_name="user_variants",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return UserVariantResponse(
            success=True,
            data=UserVariantDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{user_variant_id}", response_model=UserVariantResponse)
async def update_user_variant(
    user_variant_id: int,
    payload: UserVariantUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a user variant

    This endpoint:
    1. Updates a user variant with the provided data
    2. Checks for duplicate subject_id + variant_id (excluding self, only if either is changing)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated user variant details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=UserVariant,
            item_id=user_variant_id,
            user_org_id=org_id,
            entity_label="UserVariant",
        )

        update_data = payload.model_dump(exclude_unset=True)

        # Check duplicate composite key if either FK is changing
        if "subject_id" in update_data or "variant_id" in update_data:
            new_subject_id = update_data.get("subject_id", item.subject_id)
            new_variant_id = update_data.get("variant_id", item.variant_id)
            if new_subject_id != item.subject_id or new_variant_id != item.variant_id:
                await check_duplicate(
                    db=db,
                    model=UserVariant,
                    filters={"subject_id": new_subject_id, "variant_id": new_variant_id},
                    entity_label="UserVariant",
                    exclude_id=user_variant_id,
                )

        await update_with_audit(
            db=db,
            item=item,
            table_name="user_variants",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return UserVariantResponse(
            success=True,
            data=UserVariantDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{user_variant_id}", response_model=MessageResponse)
async def delete_user_variant(
    user_variant_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a user variant

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=UserVariant,
            item_id=user_variant_id,
            user_org_id=org_id,
            entity_label="UserVariant",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="user_variants",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"UserVariant {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
