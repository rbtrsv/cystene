from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import PatentAssignee
from ...schemas.commercial.patent_assignee_schemas import (
    PatentAssigneeCreate,
    PatentAssigneeDetail,
    PatentAssigneeListResponse,
    PatentAssigneeResponse,
    PatentAssigneeUpdate,
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
# Patent Assignees Router
# ==========================================

router = APIRouter(tags=["PatentAssignees"])


@router.get("/", response_model=PatentAssigneeListResponse)
async def list_patent_assignees(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List patent assignees with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of patent assignees
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total patent assignees (with filters applied)
        count_query = select(func.count(PatentAssignee.id))
        count_query = apply_default_filters(count_query, PatentAssignee, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get patent assignees with pagination (with filters applied)
        data_query = select(PatentAssignee).order_by(PatentAssignee.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, PatentAssignee, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return PatentAssigneeListResponse(
            success=True,
            data=[PatentAssigneeDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{assignee_id}", response_model=PatentAssigneeResponse)
async def get_patent_assignee(
    assignee_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific patent assignee

    This endpoint:
    1. Retrieves a patent assignee by ID (excludes soft-deleted, enforces ownership)
    2. Returns the patent assignee details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=PatentAssignee,
            item_id=assignee_id,
            user_org_id=org_id,
            entity_label="PatentAssignee",
        )
        return PatentAssigneeResponse(
            success=True,
            data=PatentAssigneeDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=PatentAssigneeResponse)
async def create_patent_assignee(
    payload: PatentAssigneeCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new patent assignee

    This endpoint:
    1. Checks for duplicate patent_id + market_organization_id + assignment_date combination
    2. Creates a new patent assignee with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created patent assignee details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Check duplicate patent_id + market_organization_id + assignment_date (composite unique)
        await check_duplicate(
            db=db,
            model=PatentAssignee,
            filters={"patent_id": payload.patent_id, "market_organization_id": payload.market_organization_id, "assignment_date": payload.assignment_date},
            entity_label="PatentAssignee",
        )

        item = await create_with_audit(
            db=db,
            model=PatentAssignee,
            table_name="patent_assignees",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return PatentAssigneeResponse(
            success=True,
            data=PatentAssigneeDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{assignee_id}", response_model=PatentAssigneeResponse)
async def update_patent_assignee(
    assignee_id: int,
    payload: PatentAssigneeUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a patent assignee

    This endpoint:
    1. Updates a patent assignee with the provided data
    2. Checks for duplicate patent_id + market_organization_id + assignment_date (excluding self, only if any is changing)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated patent assignee details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=PatentAssignee,
            item_id=assignee_id,
            user_org_id=org_id,
            entity_label="PatentAssignee",
        )

        update_data = payload.model_dump(exclude_unset=True)

        # Check duplicate composite key if any field in the composite is changing
        if "patent_id" in update_data or "market_organization_id" in update_data or "assignment_date" in update_data:
            new_patent_id = update_data.get("patent_id", item.patent_id)
            new_market_organization_id = update_data.get("market_organization_id", item.market_organization_id)
            new_assignment_date = update_data.get("assignment_date", item.assignment_date)
            if new_patent_id != item.patent_id or new_market_organization_id != item.market_organization_id or new_assignment_date != item.assignment_date:
                await check_duplicate(
                    db=db,
                    model=PatentAssignee,
                    filters={"patent_id": new_patent_id, "market_organization_id": new_market_organization_id, "assignment_date": new_assignment_date},
                    entity_label="PatentAssignee",
                    exclude_id=assignee_id,
                )

        await update_with_audit(
            db=db,
            item=item,
            table_name="patent_assignees",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return PatentAssigneeResponse(
            success=True,
            data=PatentAssigneeDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{assignee_id}", response_model=MessageResponse)
async def delete_patent_assignee(
    assignee_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a patent assignee

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=PatentAssignee,
            item_id=assignee_id,
            user_org_id=org_id,
            entity_label="PatentAssignee",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="patent_assignees",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"PatentAssignee {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
