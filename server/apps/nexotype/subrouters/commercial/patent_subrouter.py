from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Patent
from ...schemas.commercial.patent_schemas import (
    PatentCreate,
    PatentDetail,
    PatentListResponse,
    PatentResponse,
    PatentUpdate,
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
# Patents Router
# ==========================================

router = APIRouter(tags=["Patents"])


@router.get("/", response_model=PatentListResponse)
async def list_patents(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List patents with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of patents
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total patents (with filters applied)
        count_query = select(func.count(Patent.id))
        count_query = apply_default_filters(count_query, Patent, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get patents with pagination (with filters applied)
        data_query = select(Patent).order_by(Patent.patent_number).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Patent, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return PatentListResponse(
            success=True,
            data=[PatentDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{patent_id}", response_model=PatentResponse)
async def get_patent(
    patent_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific patent

    This endpoint:
    1. Retrieves a patent by ID (excludes soft-deleted, enforces ownership)
    2. Returns the patent details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Patent,
            item_id=patent_id,
            user_org_id=org_id,
            entity_label="Patent",
        )
        return PatentResponse(
            success=True,
            data=PatentDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=PatentResponse)
async def create_patent(
    payload: PatentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new patent

    This endpoint:
    1. Checks for duplicate jurisdiction + patent_number combination
    2. Creates a new patent with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created patent details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Check duplicate jurisdiction + patent_number (composite unique)
        await check_duplicate(
            db=db,
            model=Patent,
            filters={"jurisdiction": payload.jurisdiction, "patent_number": payload.patent_number},
            entity_label="Patent",
        )

        item = await create_with_audit(
            db=db,
            model=Patent,
            table_name="patents",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return PatentResponse(
            success=True,
            data=PatentDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{patent_id}", response_model=PatentResponse)
async def update_patent(
    patent_id: int,
    payload: PatentUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a patent

    This endpoint:
    1. Updates a patent with the provided data
    2. Checks for duplicate jurisdiction + patent_number (excluding self, only if either is changing)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated patent details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Patent,
            item_id=patent_id,
            user_org_id=org_id,
            entity_label="Patent",
        )

        update_data = payload.model_dump(exclude_unset=True)

        # Check duplicate composite key if either field is changing
        if "jurisdiction" in update_data or "patent_number" in update_data:
            new_jurisdiction = update_data.get("jurisdiction", item.jurisdiction)
            new_patent_number = update_data.get("patent_number", item.patent_number)
            if new_jurisdiction != item.jurisdiction or new_patent_number != item.patent_number:
                await check_duplicate(
                    db=db,
                    model=Patent,
                    filters={"jurisdiction": new_jurisdiction, "patent_number": new_patent_number},
                    entity_label="Patent",
                    exclude_id=patent_id,
                )

        await update_with_audit(
            db=db,
            item=item,
            table_name="patents",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return PatentResponse(
            success=True,
            data=PatentDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{patent_id}", response_model=MessageResponse)
async def delete_patent(
    patent_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a patent

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Patent,
            item_id=patent_id,
            user_org_id=org_id,
            entity_label="Patent",
        )

        label = item.patent_number
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="patents",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Patent {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
