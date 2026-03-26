from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import RegulatoryApproval
from ...schemas.commercial.regulatory_approval_schemas import (
    RegulatoryApprovalCreate,
    RegulatoryApprovalDetail,
    RegulatoryApprovalListResponse,
    RegulatoryApprovalResponse,
    RegulatoryApprovalUpdate,
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
# Regulatory Approvals Router
# ==========================================

router = APIRouter(tags=["RegulatoryApprovals"])


@router.get("/", response_model=RegulatoryApprovalListResponse)
async def list_regulatory_approvals(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List regulatory approvals with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of regulatory approvals
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total regulatory approvals (with filters applied)
        count_query = select(func.count(RegulatoryApproval.id))
        count_query = apply_default_filters(count_query, RegulatoryApproval, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get regulatory approvals with pagination (with filters applied)
        data_query = select(RegulatoryApproval).order_by(RegulatoryApproval.approval_date).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, RegulatoryApproval, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return RegulatoryApprovalListResponse(
            success=True,
            data=[RegulatoryApprovalDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{approval_id}", response_model=RegulatoryApprovalResponse)
async def get_regulatory_approval(
    approval_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific regulatory approval

    This endpoint:
    1. Retrieves a regulatory approval by ID (excludes soft-deleted, enforces ownership)
    2. Returns the regulatory approval details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=RegulatoryApproval,
            item_id=approval_id,
            user_org_id=org_id,
            entity_label="RegulatoryApproval",
        )
        return RegulatoryApprovalResponse(
            success=True,
            data=RegulatoryApprovalDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=RegulatoryApprovalResponse)
async def create_regulatory_approval(
    payload: RegulatoryApprovalCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new regulatory approval

    This endpoint:
    1. Checks for duplicate asset_id + indication_id + agency combination
    2. Creates a new regulatory approval with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created regulatory approval details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Check duplicate asset_id + indication_id + agency (composite unique)
        await check_duplicate(
            db=db,
            model=RegulatoryApproval,
            filters={"asset_id": payload.asset_id, "indication_id": payload.indication_id, "agency": payload.agency},
            entity_label="RegulatoryApproval",
        )

        item = await create_with_audit(
            db=db,
            model=RegulatoryApproval,
            table_name="regulatory_approvals",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return RegulatoryApprovalResponse(
            success=True,
            data=RegulatoryApprovalDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{approval_id}", response_model=RegulatoryApprovalResponse)
async def update_regulatory_approval(
    approval_id: int,
    payload: RegulatoryApprovalUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a regulatory approval

    This endpoint:
    1. Updates a regulatory approval with the provided data
    2. Checks for duplicate asset_id + indication_id + agency (excluding self, only if any is changing)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated regulatory approval details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=RegulatoryApproval,
            item_id=approval_id,
            user_org_id=org_id,
            entity_label="RegulatoryApproval",
        )

        update_data = payload.model_dump(exclude_unset=True)

        # Check duplicate composite key if any field in the composite is changing
        if "asset_id" in update_data or "indication_id" in update_data or "agency" in update_data:
            new_asset_id = update_data.get("asset_id", item.asset_id)
            new_indication_id = update_data.get("indication_id", item.indication_id)
            new_agency = update_data.get("agency", item.agency)
            if new_asset_id != item.asset_id or new_indication_id != item.indication_id or new_agency != item.agency:
                await check_duplicate(
                    db=db,
                    model=RegulatoryApproval,
                    filters={"asset_id": new_asset_id, "indication_id": new_indication_id, "agency": new_agency},
                    entity_label="RegulatoryApproval",
                    exclude_id=approval_id,
                )

        await update_with_audit(
            db=db,
            item=item,
            table_name="regulatory_approvals",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return RegulatoryApprovalResponse(
            success=True,
            data=RegulatoryApprovalDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{approval_id}", response_model=MessageResponse)
async def delete_regulatory_approval(
    approval_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a regulatory approval

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=RegulatoryApproval,
            item_id=approval_id,
            user_org_id=org_id,
            entity_label="RegulatoryApproval",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="regulatory_approvals",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"RegulatoryApproval {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
