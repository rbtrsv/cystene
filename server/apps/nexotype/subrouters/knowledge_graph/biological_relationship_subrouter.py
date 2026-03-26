from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import BiologicalRelationship
from ...schemas.knowledge_graph.biological_relationship_schemas import (
    BiologicalRelationshipCreate,
    BiologicalRelationshipDetail,
    BiologicalRelationshipListResponse,
    BiologicalRelationshipResponse,
    BiologicalRelationshipUpdate,
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
# Biological Relationships Router
# ==========================================

router = APIRouter(tags=["BiologicalRelationships"])


@router.get("/", response_model=BiologicalRelationshipListResponse)
async def list_biological_relationships(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List biological relationships with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of biological relationships
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total biological relationships (with filters applied)
        count_query = select(func.count(BiologicalRelationship.id))
        count_query = apply_default_filters(count_query, BiologicalRelationship, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get biological relationships with pagination (with filters applied)
        data_query = select(BiologicalRelationship).order_by(BiologicalRelationship.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, BiologicalRelationship, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return BiologicalRelationshipListResponse(
            success=True,
            data=[BiologicalRelationshipDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{relationship_id}", response_model=BiologicalRelationshipResponse)
async def get_biological_relationship(
    relationship_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific biological relationship

    This endpoint:
    1. Retrieves a biological relationship by ID (excludes soft-deleted, enforces ownership)
    2. Returns the biological relationship details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=BiologicalRelationship,
            item_id=relationship_id,
            user_org_id=org_id,
            entity_label="BiologicalRelationship",
        )
        return BiologicalRelationshipResponse(
            success=True,
            data=BiologicalRelationshipDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=BiologicalRelationshipResponse)
async def create_biological_relationship(
    payload: BiologicalRelationshipCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new biological relationship

    This endpoint:
    1. Checks for duplicate protein_a_id + protein_b_id combination
    2. Creates a new biological relationship with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created biological relationship details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=BiologicalRelationship,
            filters={"protein_a_id": payload.protein_a_id, "protein_b_id": payload.protein_b_id},
            entity_label="BiologicalRelationship",
        )

        item = await create_with_audit(
            db=db,
            model=BiologicalRelationship,
            table_name="biological_relationships",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return BiologicalRelationshipResponse(
            success=True,
            data=BiologicalRelationshipDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{relationship_id}", response_model=BiologicalRelationshipResponse)
async def update_biological_relationship(
    relationship_id: int,
    payload: BiologicalRelationshipUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a biological relationship

    This endpoint:
    1. Updates a biological relationship with the provided data
    2. Checks for duplicate protein_a_id + protein_b_id combination (excluding self)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated biological relationship details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=BiologicalRelationship,
            item_id=relationship_id,
            user_org_id=org_id,
            entity_label="BiologicalRelationship",
        )

        # Check if composite key fields are changing
        update_data = payload.model_dump(exclude_unset=True)
        new_protein_a_id = update_data.get("protein_a_id", item.protein_a_id)
        new_protein_b_id = update_data.get("protein_b_id", item.protein_b_id)
        if new_protein_a_id != item.protein_a_id or new_protein_b_id != item.protein_b_id:
            await check_duplicate(
                db=db,
                model=BiologicalRelationship,
                filters={"protein_a_id": new_protein_a_id, "protein_b_id": new_protein_b_id},
                entity_label="BiologicalRelationship",
                exclude_id=relationship_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="biological_relationships",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return BiologicalRelationshipResponse(
            success=True,
            data=BiologicalRelationshipDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{relationship_id}", response_model=MessageResponse)
async def delete_biological_relationship(
    relationship_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a biological relationship

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=BiologicalRelationship,
            item_id=relationship_id,
            user_org_id=org_id,
            entity_label="BiologicalRelationship",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="biological_relationships",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"BiologicalRelationship {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
