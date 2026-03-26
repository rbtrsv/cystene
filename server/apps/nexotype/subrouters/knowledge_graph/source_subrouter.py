from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import Source
from ...schemas.knowledge_graph.source_schemas import (
    MessageResponse,
    SourceCreate,
    SourceDetail,
    SourceListResponse,
    SourceResponse,
    SourceUpdate,
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
# Sources Router
# ==========================================

router = APIRouter(tags=["Sources"])


@router.get("/", response_model=SourceListResponse)
async def list_sources(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List sources with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of sources
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total sources (with filters applied)
        count_query = select(func.count(Source.id))
        count_query = apply_default_filters(count_query, Source, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get sources with pagination (with filters applied)
        data_query = select(Source).order_by(Source.external_id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, Source, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return SourceListResponse(
            success=True,
            data=[SourceDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{source_id}", response_model=SourceResponse)
async def get_source(
    source_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific source

    This endpoint:
    1. Retrieves a source by ID (excludes soft-deleted, enforces ownership)
    2. Returns the source details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Source,
            item_id=source_id,
            user_org_id=org_id,
            entity_label="Source",
        )
        return SourceResponse(
            success=True,
            data=SourceDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=SourceResponse)
async def create_source(
    payload: SourceCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new source

    This endpoint:
    1. Checks for duplicate external_id
    2. Creates a new source with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created source details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=Source,
            filters={"external_id": payload.external_id},
            entity_label="Source",
        )

        item = await create_with_audit(
            db=db,
            model=Source,
            table_name="sources",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return SourceResponse(
            success=True,
            data=SourceDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{source_id}", response_model=SourceResponse)
async def update_source(
    source_id: int,
    payload: SourceUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a source

    This endpoint:
    1. Updates a source with the provided data
    2. Checks for duplicate external_id (excluding self)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated source details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Source,
            item_id=source_id,
            user_org_id=org_id,
            entity_label="Source",
        )

        # Check if unique key field is changing
        update_data = payload.model_dump(exclude_unset=True)
        new_external_id = update_data.get("external_id", item.external_id)
        if new_external_id != item.external_id:
            await check_duplicate(
                db=db,
                model=Source,
                filters={"external_id": new_external_id},
                entity_label="Source",
                exclude_id=source_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="sources",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return SourceResponse(
            success=True,
            data=SourceDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{source_id}", response_model=MessageResponse)
async def delete_source(
    source_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a source

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=Source,
            item_id=source_id,
            user_org_id=org_id,
            entity_label="Source",
        )

        label = item.external_id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="sources",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"Source {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
