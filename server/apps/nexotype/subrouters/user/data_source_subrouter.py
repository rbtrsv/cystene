from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import DataSource
from ...schemas.user.data_source_schemas import (
    DataSourceCreate,
    DataSourceDetail,
    DataSourceListResponse,
    DataSourceResponse,
    DataSourceUpdate,
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
# Data Sources Router
# ==========================================

router = APIRouter(tags=["DataSources"])


@router.get("/", response_model=DataSourceListResponse)
async def list_data_sources(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List data sources with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of data sources
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total data sources (with filters applied)
        count_query = select(func.count(DataSource.id))
        count_query = apply_default_filters(count_query, DataSource, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get data sources with pagination (with filters applied)
        data_query = select(DataSource).order_by(DataSource.name).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, DataSource, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return DataSourceListResponse(
            success=True,
            data=[DataSourceDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{data_source_id}", response_model=DataSourceResponse)
async def get_data_source(
    data_source_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific data source

    This endpoint:
    1. Retrieves a data source by ID (excludes soft-deleted, enforces ownership)
    2. Returns the data source details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=DataSource,
            item_id=data_source_id,
            user_org_id=org_id,
            entity_label="DataSource",
        )
        return DataSourceResponse(
            success=True,
            data=DataSourceDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=DataSourceResponse)
async def create_data_source(
    payload: DataSourceCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new data source

    This endpoint:
    1. Creates a new data source with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created data source details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=DataSource,
            table_name="data_sources",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return DataSourceResponse(
            success=True,
            data=DataSourceDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{data_source_id}", response_model=DataSourceResponse)
async def update_data_source(
    data_source_id: int,
    payload: DataSourceUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a data source

    This endpoint:
    1. Updates a data source with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated data source details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=DataSource,
            item_id=data_source_id,
            user_org_id=org_id,
            entity_label="DataSource",
        )

        update_data = payload.model_dump(exclude_unset=True)

        await update_with_audit(
            db=db,
            item=item,
            table_name="data_sources",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return DataSourceResponse(
            success=True,
            data=DataSourceDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{data_source_id}", response_model=MessageResponse)
async def delete_data_source(
    data_source_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a data source

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=DataSource,
            item_id=data_source_id,
            user_org_id=org_id,
            entity_label="DataSource",
        )

        label = item.name
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="data_sources",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"DataSource {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
