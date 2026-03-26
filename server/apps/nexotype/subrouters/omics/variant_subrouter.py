from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Variant
from ...schemas.omics.variant_schemas import (
    MessageResponse,
    VariantCreate,
    VariantDetail,
    VariantListResponse,
    VariantResponse,
    VariantUpdate,
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
# Variants Router
# ==========================================

router = APIRouter(tags=["Variants"])


@router.get("/", response_model=VariantListResponse)
async def list_variants(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List variants with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of variants
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total variants (with filters applied)
        count_query = select(func.count(Variant.id))
        count_query = apply_default_filters(count_query, Variant, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get variants with pagination (with filters applied)
        data_query = select(Variant).order_by(Variant.db_snp_id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Variant, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return VariantListResponse(
            success=True,
            data=[VariantDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{variant_id}", response_model=VariantResponse)
async def get_variant(
    variant_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific variant

    This endpoint:
    1. Retrieves a variant by ID (excludes soft-deleted, enforces ownership)
    2. Returns the variant details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Variant,
            item_id=variant_id,
            user_org_id=org_id,
            entity_label="Variant",
        )
        return VariantResponse(
            success=True,
            data=VariantDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=VariantResponse)
async def create_variant(
    payload: VariantCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new variant

    This endpoint:
    1. Creates a new variant with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created variant details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=Variant,
            filters={"db_snp_id": payload.db_snp_id},
            entity_label="Variant",
        )

        item = await create_with_audit(
            db=db,
            model=Variant,
            table_name="variants",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return VariantResponse(
            success=True,
            data=VariantDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{variant_id}", response_model=VariantResponse)
async def update_variant(
    variant_id: int,
    payload: VariantUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a variant

    This endpoint:
    1. Updates a variant with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated variant details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Variant,
            item_id=variant_id,
            user_org_id=org_id,
            entity_label="Variant",
        )

        # Check if new db_snp_id conflicts with another variant
        if payload.db_snp_id and payload.db_snp_id != item.db_snp_id:
            await check_duplicate(
                db=db,
                model=Variant,
                filters={"db_snp_id": payload.db_snp_id},
                entity_label="Variant",
                exclude_id=variant_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="variants",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return VariantResponse(
            success=True,
            data=VariantDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{variant_id}", response_model=MessageResponse)
async def delete_variant(
    variant_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a variant

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Variant,
            item_id=variant_id,
            user_org_id=org_id,
            entity_label="Variant",
        )

        label = item.db_snp_id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="variants",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Variant {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
