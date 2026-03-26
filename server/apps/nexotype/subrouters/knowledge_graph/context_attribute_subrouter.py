from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import ContextAttribute
from ...schemas.knowledge_graph.context_attribute_schemas import (
    ContextAttributeCreate,
    ContextAttributeDetail,
    ContextAttributeListResponse,
    ContextAttributeResponse,
    ContextAttributeUpdate,
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
# Context Attributes Router
# ==========================================

router = APIRouter(tags=["ContextAttributes"])


@router.get("/", response_model=ContextAttributeListResponse)
async def list_context_attributes(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List context attributes with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of context attributes
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total context attributes (with filters applied)
        count_query = select(func.count(ContextAttribute.id))
        count_query = apply_default_filters(count_query, ContextAttribute, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get context attributes with pagination (with filters applied)
        data_query = select(ContextAttribute).order_by(ContextAttribute.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, ContextAttribute, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return ContextAttributeListResponse(
            success=True,
            data=[ContextAttributeDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{attribute_id}", response_model=ContextAttributeResponse)
async def get_context_attribute(
    attribute_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific context attribute

    This endpoint:
    1. Retrieves a context attribute by ID (excludes soft-deleted, enforces ownership)
    2. Returns the context attribute details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=ContextAttribute,
            item_id=attribute_id,
            user_org_id=org_id,
            entity_label="ContextAttribute",
        )
        return ContextAttributeResponse(
            success=True,
            data=ContextAttributeDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=ContextAttributeResponse)
async def create_context_attribute(
    payload: ContextAttributeCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new context attribute

    This endpoint:
    1. Creates a new context attribute with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created context attribute details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=ContextAttribute,
            table_name="context_attributes",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return ContextAttributeResponse(
            success=True,
            data=ContextAttributeDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{attribute_id}", response_model=ContextAttributeResponse)
async def update_context_attribute(
    attribute_id: int,
    payload: ContextAttributeUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a context attribute

    This endpoint:
    1. Updates a context attribute with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated context attribute details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=ContextAttribute,
            item_id=attribute_id,
            user_org_id=org_id,
            entity_label="ContextAttribute",
        )

        await update_with_audit(
            db=db,
            item=item,
            table_name="context_attributes",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return ContextAttributeResponse(
            success=True,
            data=ContextAttributeDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{attribute_id}", response_model=MessageResponse)
async def delete_context_attribute(
    attribute_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a context attribute

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=ContextAttribute,
            item_id=attribute_id,
            user_org_id=org_id,
            entity_label="ContextAttribute",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="context_attributes",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"ContextAttribute {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
