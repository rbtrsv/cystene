from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import LicensingAgreement
from ...schemas.commercial.licensing_agreement_schemas import (
    LicensingAgreementCreate,
    LicensingAgreementDetail,
    LicensingAgreementListResponse,
    LicensingAgreementResponse,
    LicensingAgreementUpdate,
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
# Licensing Agreements Router
# ==========================================

router = APIRouter(tags=["LicensingAgreements"])


@router.get("/", response_model=LicensingAgreementListResponse)
async def list_licensing_agreements(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List licensing agreements with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of licensing agreements
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total licensing agreements (with filters applied)
        count_query = select(func.count(LicensingAgreement.id))
        count_query = apply_default_filters(count_query, LicensingAgreement, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get licensing agreements with pagination (with filters applied)
        data_query = select(LicensingAgreement).order_by(LicensingAgreement.start_date).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, LicensingAgreement, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return LicensingAgreementListResponse(
            success=True,
            data=[LicensingAgreementDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{agreement_id}", response_model=LicensingAgreementResponse)
async def get_licensing_agreement(
    agreement_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific licensing agreement

    This endpoint:
    1. Retrieves a licensing agreement by ID (excludes soft-deleted, enforces ownership)
    2. Returns the licensing agreement details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=LicensingAgreement,
            item_id=agreement_id,
            user_org_id=org_id,
            entity_label="LicensingAgreement",
        )
        return LicensingAgreementResponse(
            success=True,
            data=LicensingAgreementDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=LicensingAgreementResponse)
async def create_licensing_agreement(
    payload: LicensingAgreementCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new licensing agreement

    This endpoint:
    1. Creates a new licensing agreement with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created licensing agreement details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=LicensingAgreement,
            table_name="licensing_agreements",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return LicensingAgreementResponse(
            success=True,
            data=LicensingAgreementDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{agreement_id}", response_model=LicensingAgreementResponse)
async def update_licensing_agreement(
    agreement_id: int,
    payload: LicensingAgreementUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a licensing agreement

    This endpoint:
    1. Updates a licensing agreement with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated licensing agreement details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=LicensingAgreement,
            item_id=agreement_id,
            user_org_id=org_id,
            entity_label="LicensingAgreement",
        )

        update_data = payload.model_dump(exclude_unset=True)

        await update_with_audit(
            db=db,
            item=item,
            table_name="licensing_agreements",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return LicensingAgreementResponse(
            success=True,
            data=LicensingAgreementDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{agreement_id}", response_model=MessageResponse)
async def delete_licensing_agreement(
    agreement_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a licensing agreement

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=LicensingAgreement,
            item_id=agreement_id,
            user_org_id=org_id,
            entity_label="LicensingAgreement",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="licensing_agreements",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"LicensingAgreement {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
