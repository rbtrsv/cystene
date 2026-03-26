from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import VariantPhenotype
from ...schemas.knowledge_graph.variant_phenotype_schemas import (
    MessageResponse,
    VariantPhenotypeCreate,
    VariantPhenotypeDetail,
    VariantPhenotypeListResponse,
    VariantPhenotypeResponse,
    VariantPhenotypeUpdate,
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
# Variant Phenotypes Router
# ==========================================

router = APIRouter(tags=["VariantPhenotypes"])


@router.get("/", response_model=VariantPhenotypeListResponse)
async def list_variant_phenotypes(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List variant phenotypes with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of variant phenotypes
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total variant phenotypes (with filters applied)
        count_query = select(func.count(VariantPhenotype.id))
        count_query = apply_default_filters(count_query, VariantPhenotype, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get variant phenotypes with pagination (with filters applied)
        data_query = select(VariantPhenotype).order_by(VariantPhenotype.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, VariantPhenotype, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return VariantPhenotypeListResponse(
            success=True,
            data=[VariantPhenotypeDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{variant_phenotype_id}", response_model=VariantPhenotypeResponse)
async def get_variant_phenotype(
    variant_phenotype_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific variant phenotype

    This endpoint:
    1. Retrieves a variant phenotype by ID (excludes soft-deleted, enforces ownership)
    2. Returns the variant phenotype details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=VariantPhenotype,
            item_id=variant_phenotype_id,
            user_org_id=org_id,
            entity_label="VariantPhenotype",
        )
        return VariantPhenotypeResponse(
            success=True,
            data=VariantPhenotypeDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=VariantPhenotypeResponse)
async def create_variant_phenotype(
    payload: VariantPhenotypeCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new variant phenotype

    This endpoint:
    1. Checks for duplicate variant_id + phenotype_id combination
    2. Creates a new variant phenotype with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created variant phenotype details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=VariantPhenotype,
            filters={"variant_id": payload.variant_id, "phenotype_id": payload.phenotype_id},
            entity_label="VariantPhenotype",
        )

        item = await create_with_audit(
            db=db,
            model=VariantPhenotype,
            table_name="variant_phenotypes",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return VariantPhenotypeResponse(
            success=True,
            data=VariantPhenotypeDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{variant_phenotype_id}", response_model=VariantPhenotypeResponse)
async def update_variant_phenotype(
    variant_phenotype_id: int,
    payload: VariantPhenotypeUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a variant phenotype

    This endpoint:
    1. Updates a variant phenotype with the provided data
    2. Checks for duplicate variant_id + phenotype_id combination (excluding self)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated variant phenotype details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=VariantPhenotype,
            item_id=variant_phenotype_id,
            user_org_id=org_id,
            entity_label="VariantPhenotype",
        )

        # Check if composite key fields are changing
        update_data = payload.model_dump(exclude_unset=True)
        new_variant_id = update_data.get("variant_id", item.variant_id)
        new_phenotype_id = update_data.get("phenotype_id", item.phenotype_id)
        if new_variant_id != item.variant_id or new_phenotype_id != item.phenotype_id:
            await check_duplicate(
                db=db,
                model=VariantPhenotype,
                filters={"variant_id": new_variant_id, "phenotype_id": new_phenotype_id},
                entity_label="VariantPhenotype",
                exclude_id=variant_phenotype_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="variant_phenotypes",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return VariantPhenotypeResponse(
            success=True,
            data=VariantPhenotypeDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{variant_phenotype_id}", response_model=MessageResponse)
async def delete_variant_phenotype(
    variant_phenotype_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a variant phenotype

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=VariantPhenotype,
            item_id=variant_phenotype_id,
            user_org_id=org_id,
            entity_label="VariantPhenotype",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="variant_phenotypes",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"VariantPhenotype {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
