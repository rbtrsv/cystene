from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import MarketOrganization
from ...schemas.commercial.market_organization_schemas import (
    MarketOrganizationCreate,
    MarketOrganizationDetail,
    MarketOrganizationListResponse,
    MarketOrganizationResponse,
    MarketOrganizationUpdate,
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
# Market Organizations Router
# ==========================================

router = APIRouter(tags=["MarketOrganizations"])


@router.get("/", response_model=MarketOrganizationListResponse)
async def list_market_organizations(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List market organizations with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of market organizations
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total market organizations (with filters applied)
        count_query = select(func.count(MarketOrganization.id))
        count_query = apply_default_filters(count_query, MarketOrganization, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get market organizations with pagination (with filters applied)
        data_query = select(MarketOrganization).order_by(MarketOrganization.legal_name).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, MarketOrganization, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return MarketOrganizationListResponse(
            success=True,
            data=[MarketOrganizationDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{organization_id}", response_model=MarketOrganizationResponse)
async def get_market_organization(
    organization_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific market organization

    This endpoint:
    1. Retrieves a market organization by ID (excludes soft-deleted, enforces ownership)
    2. Returns the market organization details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=MarketOrganization,
            item_id=organization_id,
            user_org_id=org_id,
            entity_label="MarketOrganization",
        )
        return MarketOrganizationResponse(
            success=True,
            data=MarketOrganizationDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=MarketOrganizationResponse)
async def create_market_organization(
    payload: MarketOrganizationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new market organization

    This endpoint:
    1. Checks for duplicate isin (only if provided, since isin is nullable)
    2. Creates a new market organization with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created market organization details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Only check duplicate isin when a value is actually provided
        if payload.isin is not None:
            await check_duplicate(
                db=db,
                model=MarketOrganization,
                filters={"isin": payload.isin},
                entity_label="MarketOrganization",
            )

        item = await create_with_audit(
            db=db,
            model=MarketOrganization,
            table_name="market_organizations",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return MarketOrganizationResponse(
            success=True,
            data=MarketOrganizationDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{organization_id}", response_model=MarketOrganizationResponse)
async def update_market_organization(
    organization_id: int,
    payload: MarketOrganizationUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a market organization

    This endpoint:
    1. Updates a market organization with the provided data
    2. Checks for duplicate isin (excluding self, only if isin is changing to a non-null value)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated market organization details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=MarketOrganization,
            item_id=organization_id,
            user_org_id=org_id,
            entity_label="MarketOrganization",
        )

        # Check if isin is changing to a non-null value
        update_data = payload.model_dump(exclude_unset=True)
        if "isin" in update_data and update_data["isin"] is not None:
            new_isin = update_data["isin"]
            if new_isin != item.isin:
                await check_duplicate(
                    db=db,
                    model=MarketOrganization,
                    filters={"isin": new_isin},
                    entity_label="MarketOrganization",
                    exclude_id=organization_id,
                )

        await update_with_audit(
            db=db,
            item=item,
            table_name="market_organizations",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return MarketOrganizationResponse(
            success=True,
            data=MarketOrganizationDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{organization_id}", response_model=MessageResponse)
async def delete_market_organization(
    organization_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a market organization

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=MarketOrganization,
            item_id=organization_id,
            user_org_id=org_id,
            entity_label="MarketOrganization",
        )

        label = item.legal_name
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="market_organizations",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"MarketOrganization {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
