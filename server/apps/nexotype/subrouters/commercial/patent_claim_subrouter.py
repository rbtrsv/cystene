from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import PatentClaim
from ...schemas.commercial.patent_claim_schemas import (
    PatentClaimCreate,
    PatentClaimDetail,
    PatentClaimListResponse,
    PatentClaimResponse,
    PatentClaimUpdate,
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
# Patent Claims Router
# ==========================================

router = APIRouter(tags=["PatentClaims"])


@router.get("/", response_model=PatentClaimListResponse)
async def list_patent_claims(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List patent claims with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of patent claims
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total patent claims (with filters applied)
        count_query = select(func.count(PatentClaim.id))
        count_query = apply_default_filters(count_query, PatentClaim, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get patent claims with pagination (with filters applied)
        data_query = select(PatentClaim).order_by(PatentClaim.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, PatentClaim, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return PatentClaimListResponse(
            success=True,
            data=[PatentClaimDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{claim_id}", response_model=PatentClaimResponse)
async def get_patent_claim(
    claim_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific patent claim

    This endpoint:
    1. Retrieves a patent claim by ID (excludes soft-deleted, enforces ownership)
    2. Returns the patent claim details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=PatentClaim,
            item_id=claim_id,
            user_org_id=org_id,
            entity_label="PatentClaim",
        )
        return PatentClaimResponse(
            success=True,
            data=PatentClaimDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=PatentClaimResponse)
async def create_patent_claim(
    payload: PatentClaimCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new patent claim

    This endpoint:
    1. Checks for duplicate patent_id + asset_id + claim_type combination
    2. Creates a new patent claim with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created patent claim details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Check duplicate patent_id + asset_id + claim_type (composite unique)
        await check_duplicate(
            db=db,
            model=PatentClaim,
            filters={"patent_id": payload.patent_id, "asset_id": payload.asset_id, "claim_type": payload.claim_type},
            entity_label="PatentClaim",
        )

        item = await create_with_audit(
            db=db,
            model=PatentClaim,
            table_name="patent_claims",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return PatentClaimResponse(
            success=True,
            data=PatentClaimDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{claim_id}", response_model=PatentClaimResponse)
async def update_patent_claim(
    claim_id: int,
    payload: PatentClaimUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a patent claim

    This endpoint:
    1. Updates a patent claim with the provided data
    2. Checks for duplicate patent_id + asset_id + claim_type (excluding self, only if any is changing)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated patent claim details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=PatentClaim,
            item_id=claim_id,
            user_org_id=org_id,
            entity_label="PatentClaim",
        )

        update_data = payload.model_dump(exclude_unset=True)

        # Check duplicate composite key if any field in the composite is changing
        if "patent_id" in update_data or "asset_id" in update_data or "claim_type" in update_data:
            new_patent_id = update_data.get("patent_id", item.patent_id)
            new_asset_id = update_data.get("asset_id", item.asset_id)
            new_claim_type = update_data.get("claim_type", item.claim_type)
            if new_patent_id != item.patent_id or new_asset_id != item.asset_id or new_claim_type != item.claim_type:
                await check_duplicate(
                    db=db,
                    model=PatentClaim,
                    filters={"patent_id": new_patent_id, "asset_id": new_asset_id, "claim_type": new_claim_type},
                    entity_label="PatentClaim",
                    exclude_id=claim_id,
                )

        await update_with_audit(
            db=db,
            item=item,
            table_name="patent_claims",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return PatentClaimResponse(
            success=True,
            data=PatentClaimDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{claim_id}", response_model=MessageResponse)
async def delete_patent_claim(
    claim_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a patent claim

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=PatentClaim,
            item_id=claim_id,
            user_org_id=org_id,
            entity_label="PatentClaim",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="patent_claims",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"PatentClaim {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
