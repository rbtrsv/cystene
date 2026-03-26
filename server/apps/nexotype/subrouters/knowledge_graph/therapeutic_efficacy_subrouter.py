from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import TherapeuticEfficacy
from ...schemas.knowledge_graph.therapeutic_efficacy_schemas import (
    MessageResponse,
    TherapeuticEfficacyCreate,
    TherapeuticEfficacyDetail,
    TherapeuticEfficacyListResponse,
    TherapeuticEfficacyResponse,
    TherapeuticEfficacyUpdate,
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
# Therapeutic Efficacies Router
# ==========================================

router = APIRouter(tags=["TherapeuticEfficacies"])


@router.get("/", response_model=TherapeuticEfficacyListResponse)
async def list_therapeutic_efficacies(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List therapeutic efficacies with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of therapeutic efficacies
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total therapeutic efficacies (with filters applied)
        count_query = select(func.count(TherapeuticEfficacy.id))
        count_query = apply_default_filters(count_query, TherapeuticEfficacy, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get therapeutic efficacies with pagination (with filters applied)
        data_query = select(TherapeuticEfficacy).order_by(TherapeuticEfficacy.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, TherapeuticEfficacy, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return TherapeuticEfficacyListResponse(
            success=True,
            data=[TherapeuticEfficacyDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{efficacy_id}", response_model=TherapeuticEfficacyResponse)
async def get_therapeutic_efficacy(
    efficacy_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific therapeutic efficacy

    This endpoint:
    1. Retrieves a therapeutic efficacy by ID (excludes soft-deleted, enforces ownership)
    2. Returns the therapeutic efficacy details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=TherapeuticEfficacy,
            item_id=efficacy_id,
            user_org_id=org_id,
            entity_label="TherapeuticEfficacy",
        )
        return TherapeuticEfficacyResponse(
            success=True,
            data=TherapeuticEfficacyDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=TherapeuticEfficacyResponse)
async def create_therapeutic_efficacy(
    payload: TherapeuticEfficacyCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new therapeutic efficacy

    This endpoint:
    1. Creates a new therapeutic efficacy with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created therapeutic efficacy details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=TherapeuticEfficacy,
            table_name="therapeutic_efficacies",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return TherapeuticEfficacyResponse(
            success=True,
            data=TherapeuticEfficacyDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{efficacy_id}", response_model=TherapeuticEfficacyResponse)
async def update_therapeutic_efficacy(
    efficacy_id: int,
    payload: TherapeuticEfficacyUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a therapeutic efficacy

    This endpoint:
    1. Updates a therapeutic efficacy with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated therapeutic efficacy details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=TherapeuticEfficacy,
            item_id=efficacy_id,
            user_org_id=org_id,
            entity_label="TherapeuticEfficacy",
        )

        await update_with_audit(
            db=db,
            item=item,
            table_name="therapeutic_efficacies",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return TherapeuticEfficacyResponse(
            success=True,
            data=TherapeuticEfficacyDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{efficacy_id}", response_model=MessageResponse)
async def delete_therapeutic_efficacy(
    efficacy_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a therapeutic efficacy

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=TherapeuticEfficacy,
            item_id=efficacy_id,
            user_org_id=org_id,
            entity_label="TherapeuticEfficacy",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="therapeutic_efficacies",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"TherapeuticEfficacy {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
