from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import AssetOwnership
from ...schemas.commercial.asset_ownership_schemas import (
    AssetOwnershipCreate,
    AssetOwnershipDetail,
    AssetOwnershipListResponse,
    AssetOwnershipResponse,
    AssetOwnershipUpdate,
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
# Asset Ownerships Router
# ==========================================

router = APIRouter(tags=["AssetOwnerships"])


@router.get("/", response_model=AssetOwnershipListResponse)
async def list_asset_ownerships(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List asset ownerships with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of asset ownerships
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total asset ownerships (with filters applied)
        count_query = select(func.count(AssetOwnership.id))
        count_query = apply_default_filters(count_query, AssetOwnership, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get asset ownerships with pagination (with filters applied)
        data_query = select(AssetOwnership).order_by(AssetOwnership.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, AssetOwnership, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return AssetOwnershipListResponse(
            success=True,
            data=[AssetOwnershipDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{ownership_id}", response_model=AssetOwnershipResponse)
async def get_asset_ownership(
    ownership_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific asset ownership

    This endpoint:
    1. Retrieves an asset ownership by ID (excludes soft-deleted, enforces ownership)
    2. Returns the asset ownership details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=AssetOwnership,
            item_id=ownership_id,
            user_org_id=org_id,
            entity_label="AssetOwnership",
        )
        return AssetOwnershipResponse(
            success=True,
            data=AssetOwnershipDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=AssetOwnershipResponse)
async def create_asset_ownership(
    payload: AssetOwnershipCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new asset ownership

    This endpoint:
    1. Checks for duplicate market_organization_id + asset_id + ownership_type combination
    2. Creates a new asset ownership with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created asset ownership details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Check duplicate market_organization_id + asset_id + ownership_type (composite unique)
        await check_duplicate(
            db=db,
            model=AssetOwnership,
            filters={"market_organization_id": payload.market_organization_id, "asset_id": payload.asset_id, "ownership_type": payload.ownership_type},
            entity_label="AssetOwnership",
        )

        item = await create_with_audit(
            db=db,
            model=AssetOwnership,
            table_name="asset_ownerships",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return AssetOwnershipResponse(
            success=True,
            data=AssetOwnershipDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{ownership_id}", response_model=AssetOwnershipResponse)
async def update_asset_ownership(
    ownership_id: int,
    payload: AssetOwnershipUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update an asset ownership

    This endpoint:
    1. Updates an asset ownership with the provided data
    2. Checks for duplicate market_organization_id + asset_id + ownership_type (excluding self, only if any is changing)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated asset ownership details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=AssetOwnership,
            item_id=ownership_id,
            user_org_id=org_id,
            entity_label="AssetOwnership",
        )

        update_data = payload.model_dump(exclude_unset=True)

        # Check duplicate composite key if any field in the composite is changing
        if "market_organization_id" in update_data or "asset_id" in update_data or "ownership_type" in update_data:
            new_market_organization_id = update_data.get("market_organization_id", item.market_organization_id)
            new_asset_id = update_data.get("asset_id", item.asset_id)
            new_ownership_type = update_data.get("ownership_type", item.ownership_type)
            if new_market_organization_id != item.market_organization_id or new_asset_id != item.asset_id or new_ownership_type != item.ownership_type:
                await check_duplicate(
                    db=db,
                    model=AssetOwnership,
                    filters={"market_organization_id": new_market_organization_id, "asset_id": new_asset_id, "ownership_type": new_ownership_type},
                    entity_label="AssetOwnership",
                    exclude_id=ownership_id,
                )

        await update_with_audit(
            db=db,
            item=item,
            table_name="asset_ownerships",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return AssetOwnershipResponse(
            success=True,
            data=AssetOwnershipDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{ownership_id}", response_model=MessageResponse)
async def delete_asset_ownership(
    ownership_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete an asset ownership

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=AssetOwnership,
            item_id=ownership_id,
            user_org_id=org_id,
            entity_label="AssetOwnership",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="asset_ownerships",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"AssetOwnership {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
