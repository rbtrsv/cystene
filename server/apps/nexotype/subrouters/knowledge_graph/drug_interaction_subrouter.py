from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import DrugInteraction
from ...schemas.knowledge_graph.drug_interaction_schemas import (
    DrugInteractionCreate,
    DrugInteractionDetail,
    DrugInteractionListResponse,
    DrugInteractionResponse,
    DrugInteractionUpdate,
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
# Drug Interactions Router
# ==========================================

router = APIRouter(tags=["DrugInteractions"])


@router.get("/", response_model=DrugInteractionListResponse)
async def list_drug_interactions(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List drug interactions with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of drug interactions
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total drug interactions (with filters applied)
        count_query = select(func.count(DrugInteraction.id))
        count_query = apply_default_filters(count_query, DrugInteraction, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get drug interactions with pagination (with filters applied)
        data_query = select(DrugInteraction).order_by(DrugInteraction.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, DrugInteraction, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return DrugInteractionListResponse(
            success=True,
            data=[DrugInteractionDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{interaction_id}", response_model=DrugInteractionResponse)
async def get_drug_interaction(
    interaction_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific drug interaction

    This endpoint:
    1. Retrieves a drug interaction by ID (excludes soft-deleted, enforces ownership)
    2. Returns the drug interaction details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=DrugInteraction,
            item_id=interaction_id,
            user_org_id=org_id,
            entity_label="DrugInteraction",
        )
        return DrugInteractionResponse(
            success=True,
            data=DrugInteractionDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=DrugInteractionResponse)
async def create_drug_interaction(
    payload: DrugInteractionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new drug interaction

    This endpoint:
    1. Checks for duplicate asset_a_id + asset_b_id combination
    2. Creates a new drug interaction with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created drug interaction details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=DrugInteraction,
            filters={"asset_a_id": payload.asset_a_id, "asset_b_id": payload.asset_b_id},
            entity_label="DrugInteraction",
        )

        item = await create_with_audit(
            db=db,
            model=DrugInteraction,
            table_name="drug_interactions",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return DrugInteractionResponse(
            success=True,
            data=DrugInteractionDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{interaction_id}", response_model=DrugInteractionResponse)
async def update_drug_interaction(
    interaction_id: int,
    payload: DrugInteractionUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a drug interaction

    This endpoint:
    1. Updates a drug interaction with the provided data
    2. Checks for duplicate asset_a_id + asset_b_id combination (excluding self)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated drug interaction details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=DrugInteraction,
            item_id=interaction_id,
            user_org_id=org_id,
            entity_label="DrugInteraction",
        )

        # Check if composite key fields are changing
        update_data = payload.model_dump(exclude_unset=True)
        new_asset_a_id = update_data.get("asset_a_id", item.asset_a_id)
        new_asset_b_id = update_data.get("asset_b_id", item.asset_b_id)
        if new_asset_a_id != item.asset_a_id or new_asset_b_id != item.asset_b_id:
            await check_duplicate(
                db=db,
                model=DrugInteraction,
                filters={"asset_a_id": new_asset_a_id, "asset_b_id": new_asset_b_id},
                entity_label="DrugInteraction",
                exclude_id=interaction_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="drug_interactions",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return DrugInteractionResponse(
            success=True,
            data=DrugInteractionDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{interaction_id}", response_model=MessageResponse)
async def delete_drug_interaction(
    interaction_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a drug interaction

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=DrugInteraction,
            item_id=interaction_id,
            user_org_id=org_id,
            entity_label="DrugInteraction",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="drug_interactions",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"DrugInteraction {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
