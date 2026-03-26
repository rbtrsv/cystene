from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import DesignMutation
from ...schemas.engineering.design_mutation_schemas import (
    DesignMutationCreate,
    DesignMutationDetail,
    DesignMutationListResponse,
    DesignMutationResponse,
    DesignMutationUpdate,
    MessageResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.filtering_utils import apply_default_filters
from ...utils.crud_utils import (
    create_with_audit,
    get_owned_record_or_404,
    soft_delete_with_audit,
    update_with_audit,
)

# ==========================================
# Design Mutations Router
# ==========================================

router = APIRouter(tags=["DesignMutations"])


@router.get("/", response_model=DesignMutationListResponse)
async def list_design_mutations(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List design mutations with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of design mutations
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total design mutations (with filters applied)
        count_query = select(func.count(DesignMutation.id))
        count_query = apply_default_filters(count_query, DesignMutation, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get design mutations with pagination (with filters applied)
        data_query = select(DesignMutation).order_by(DesignMutation.position).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, DesignMutation, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return DesignMutationListResponse(
            success=True,
            data=[DesignMutationDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{design_mutation_id}", response_model=DesignMutationResponse)
async def get_design_mutation(
    design_mutation_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific design mutation

    This endpoint:
    1. Retrieves a design mutation by ID (excludes soft-deleted, enforces ownership)
    2. Returns the design mutation details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=DesignMutation,
            item_id=design_mutation_id,
            user_org_id=org_id,
            entity_label="DesignMutation",
        )
        return DesignMutationResponse(
            success=True,
            data=DesignMutationDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=DesignMutationResponse)
async def create_design_mutation(
    payload: DesignMutationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new design mutation

    This endpoint:
    1. Creates a new design mutation with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created design mutation details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=DesignMutation,
            table_name="design_mutations",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return DesignMutationResponse(
            success=True,
            data=DesignMutationDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{design_mutation_id}", response_model=DesignMutationResponse)
async def update_design_mutation(
    design_mutation_id: int,
    payload: DesignMutationUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a design mutation

    This endpoint:
    1. Updates a design mutation with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated design mutation details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=DesignMutation,
            item_id=design_mutation_id,
            user_org_id=org_id,
            entity_label="DesignMutation",
        )

        await update_with_audit(
            db=db,
            item=item,
            table_name="design_mutations",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return DesignMutationResponse(
            success=True,
            data=DesignMutationDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{design_mutation_id}", response_model=MessageResponse)
async def delete_design_mutation(
    design_mutation_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a design mutation

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=DesignMutation,
            item_id=design_mutation_id,
            user_org_id=org_id,
            entity_label="DesignMutation",
        )

        label = f"{item.wild_type}{item.position}{item.mutant}"
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="design_mutations",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"DesignMutation {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
