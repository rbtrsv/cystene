from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import DrugTargetMechanism
from ...schemas.knowledge_graph.drug_target_mechanism_schemas import (
    DrugTargetMechanismCreate,
    DrugTargetMechanismDetail,
    DrugTargetMechanismListResponse,
    DrugTargetMechanismResponse,
    DrugTargetMechanismUpdate,
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
# Drug Target Mechanisms Router
# ==========================================

router = APIRouter(tags=["DrugTargetMechanisms"])


@router.get("/", response_model=DrugTargetMechanismListResponse)
async def list_drug_target_mechanisms(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List drug target mechanisms with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of drug target mechanisms
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total drug target mechanisms (with filters applied)
        count_query = select(func.count(DrugTargetMechanism.id))
        count_query = apply_default_filters(count_query, DrugTargetMechanism, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get drug target mechanisms with pagination (with filters applied)
        data_query = select(DrugTargetMechanism).order_by(DrugTargetMechanism.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, DrugTargetMechanism, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return DrugTargetMechanismListResponse(
            success=True,
            data=[DrugTargetMechanismDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{mechanism_id}", response_model=DrugTargetMechanismResponse)
async def get_drug_target_mechanism(
    mechanism_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific drug target mechanism

    This endpoint:
    1. Retrieves a drug target mechanism by ID (excludes soft-deleted, enforces ownership)
    2. Returns the drug target mechanism details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=DrugTargetMechanism,
            item_id=mechanism_id,
            user_org_id=org_id,
            entity_label="DrugTargetMechanism",
        )
        return DrugTargetMechanismResponse(
            success=True,
            data=DrugTargetMechanismDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=DrugTargetMechanismResponse)
async def create_drug_target_mechanism(
    payload: DrugTargetMechanismCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new drug target mechanism

    This endpoint:
    1. Checks for duplicate asset_id + protein_id combination
    2. Creates a new drug target mechanism with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created drug target mechanism details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=DrugTargetMechanism,
            filters={"asset_id": payload.asset_id, "protein_id": payload.protein_id},
            entity_label="DrugTargetMechanism",
        )

        item = await create_with_audit(
            db=db,
            model=DrugTargetMechanism,
            table_name="drug_target_mechanisms",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return DrugTargetMechanismResponse(
            success=True,
            data=DrugTargetMechanismDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{mechanism_id}", response_model=DrugTargetMechanismResponse)
async def update_drug_target_mechanism(
    mechanism_id: int,
    payload: DrugTargetMechanismUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a drug target mechanism

    This endpoint:
    1. Updates a drug target mechanism with the provided data
    2. Checks for duplicate asset_id + protein_id combination (excluding self)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated drug target mechanism details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=DrugTargetMechanism,
            item_id=mechanism_id,
            user_org_id=org_id,
            entity_label="DrugTargetMechanism",
        )

        # Check if composite key fields are changing
        update_data = payload.model_dump(exclude_unset=True)
        new_asset_id = update_data.get("asset_id", item.asset_id)
        new_protein_id = update_data.get("protein_id", item.protein_id)
        if new_asset_id != item.asset_id or new_protein_id != item.protein_id:
            await check_duplicate(
                db=db,
                model=DrugTargetMechanism,
                filters={"asset_id": new_asset_id, "protein_id": new_protein_id},
                entity_label="DrugTargetMechanism",
                exclude_id=mechanism_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="drug_target_mechanisms",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return DrugTargetMechanismResponse(
            success=True,
            data=DrugTargetMechanismDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{mechanism_id}", response_model=MessageResponse)
async def delete_drug_target_mechanism(
    mechanism_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a drug target mechanism

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=DrugTargetMechanism,
            item_id=mechanism_id,
            user_org_id=org_id,
            entity_label="DrugTargetMechanism",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="drug_target_mechanisms",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"DrugTargetMechanism {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
