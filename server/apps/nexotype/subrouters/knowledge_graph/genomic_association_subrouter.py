from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import GenomicAssociation
from ...schemas.knowledge_graph.genomic_association_schemas import (
    GenomicAssociationCreate,
    GenomicAssociationDetail,
    GenomicAssociationListResponse,
    GenomicAssociationResponse,
    GenomicAssociationUpdate,
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
# Genomic Associations Router
# ==========================================

router = APIRouter(tags=["GenomicAssociations"])


@router.get("/", response_model=GenomicAssociationListResponse)
async def list_genomic_associations(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List genomic associations with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of genomic associations
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total genomic associations (with filters applied)
        count_query = select(func.count(GenomicAssociation.id))
        count_query = apply_default_filters(count_query, GenomicAssociation, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get genomic associations with pagination (with filters applied)
        data_query = select(GenomicAssociation).order_by(GenomicAssociation.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, GenomicAssociation, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return GenomicAssociationListResponse(
            success=True,
            data=[GenomicAssociationDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{association_id}", response_model=GenomicAssociationResponse)
async def get_genomic_association(
    association_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific genomic association

    This endpoint:
    1. Retrieves a genomic association by ID (excludes soft-deleted, enforces ownership)
    2. Returns the genomic association details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=GenomicAssociation,
            item_id=association_id,
            user_org_id=org_id,
            entity_label="GenomicAssociation",
        )
        return GenomicAssociationResponse(
            success=True,
            data=GenomicAssociationDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=GenomicAssociationResponse)
async def create_genomic_association(
    payload: GenomicAssociationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new genomic association

    This endpoint:
    1. Checks for duplicate variant_id + indication_id combination
    2. Creates a new genomic association with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created genomic association details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=GenomicAssociation,
            filters={"variant_id": payload.variant_id, "indication_id": payload.indication_id},
            entity_label="GenomicAssociation",
        )

        item = await create_with_audit(
            db=db,
            model=GenomicAssociation,
            table_name="genomic_associations",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return GenomicAssociationResponse(
            success=True,
            data=GenomicAssociationDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{association_id}", response_model=GenomicAssociationResponse)
async def update_genomic_association(
    association_id: int,
    payload: GenomicAssociationUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a genomic association

    This endpoint:
    1. Updates a genomic association with the provided data
    2. Checks for duplicate variant_id + indication_id combination (excluding self)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated genomic association details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=GenomicAssociation,
            item_id=association_id,
            user_org_id=org_id,
            entity_label="GenomicAssociation",
        )

        # Check if composite key fields are changing
        update_data = payload.model_dump(exclude_unset=True)
        new_variant_id = update_data.get("variant_id", item.variant_id)
        new_indication_id = update_data.get("indication_id", item.indication_id)
        if new_variant_id != item.variant_id or new_indication_id != item.indication_id:
            await check_duplicate(
                db=db,
                model=GenomicAssociation,
                filters={"variant_id": new_variant_id, "indication_id": new_indication_id},
                entity_label="GenomicAssociation",
                exclude_id=association_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="genomic_associations",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return GenomicAssociationResponse(
            success=True,
            data=GenomicAssociationDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{association_id}", response_model=MessageResponse)
async def delete_genomic_association(
    association_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a genomic association

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=GenomicAssociation,
            item_id=association_id,
            user_org_id=org_id,
            entity_label="GenomicAssociation",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="genomic_associations",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"GenomicAssociation {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
