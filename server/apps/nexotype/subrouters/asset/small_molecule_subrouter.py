from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import SmallMolecule
from ...schemas.asset.small_molecule_schemas import (
    MessageResponse,
    SmallMoleculeCreate,
    SmallMoleculeDetail,
    SmallMoleculeListResponse,
    SmallMoleculeResponse,
    SmallMoleculeUpdate,
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
# Small Molecules Router
# ==========================================

router = APIRouter(tags=["SmallMolecules"])


@router.get("/", response_model=SmallMoleculeListResponse)
async def list_small_molecules(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List small molecules with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of small molecules
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total small molecules (with filters applied)
        count_query = select(func.count(SmallMolecule.id))
        count_query = apply_default_filters(count_query, SmallMolecule, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get small molecules with pagination (with filters applied)
        data_query = select(SmallMolecule).order_by(SmallMolecule.name).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, SmallMolecule, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return SmallMoleculeListResponse(
            success=True,
            data=[SmallMoleculeDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{small_molecule_id}", response_model=SmallMoleculeResponse)
async def get_small_molecule(
    small_molecule_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific small molecule

    This endpoint:
    1. Retrieves a small molecule by ID (excludes soft-deleted, enforces ownership)
    2. Returns the small molecule details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=SmallMolecule,
            item_id=small_molecule_id,
            user_org_id=org_id,
            entity_label="SmallMolecule",
        )
        return SmallMoleculeResponse(
            success=True,
            data=SmallMoleculeDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=SmallMoleculeResponse)
async def create_small_molecule(
    payload: SmallMoleculeCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new small molecule

    This endpoint:
    1. Creates a new small molecule with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created small molecule details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=SmallMolecule,
            filters={"uid": payload.uid},
            entity_label="SmallMolecule",
        )

        item = await create_with_audit(
            db=db,
            model=SmallMolecule,
            table_name="small_molecules",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return SmallMoleculeResponse(
            success=True,
            data=SmallMoleculeDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{small_molecule_id}", response_model=SmallMoleculeResponse)
async def update_small_molecule(
    small_molecule_id: int,
    payload: SmallMoleculeUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a small molecule

    This endpoint:
    1. Updates a small molecule with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated small molecule details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=SmallMolecule,
            item_id=small_molecule_id,
            user_org_id=org_id,
            entity_label="SmallMolecule",
        )

        # Check if new uid conflicts with another small molecule
        if payload.uid and payload.uid != item.uid:
            await check_duplicate(
                db=db,
                model=SmallMolecule,
                filters={"uid": payload.uid},
                entity_label="SmallMolecule",
                exclude_id=small_molecule_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="small_molecules",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return SmallMoleculeResponse(
            success=True,
            data=SmallMoleculeDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{small_molecule_id}", response_model=MessageResponse)
async def delete_small_molecule(
    small_molecule_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a small molecule

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=SmallMolecule,
            item_id=small_molecule_id,
            user_org_id=org_id,
            entity_label="SmallMolecule",
        )

        label = item.name
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="small_molecules",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"SmallMolecule {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
