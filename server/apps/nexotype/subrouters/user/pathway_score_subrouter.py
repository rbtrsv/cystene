from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import PathwayScore
from ...schemas.user.pathway_score_schemas import (
    PathwayScoreCreate,
    PathwayScoreDetail,
    PathwayScoreListResponse,
    PathwayScoreResponse,
    PathwayScoreUpdate,
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
# Pathway Scores Router
# ==========================================

router = APIRouter(tags=["PathwayScores"])


@router.get("/", response_model=PathwayScoreListResponse)
async def list_pathway_scores(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List pathway scores with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of pathway scores
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total pathway scores (with filters applied)
        count_query = select(func.count(PathwayScore.id))
        count_query = apply_default_filters(count_query, PathwayScore, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get pathway scores with pagination (with filters applied)
        data_query = select(PathwayScore).order_by(PathwayScore.calculated_at).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, PathwayScore, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return PathwayScoreListResponse(
            success=True,
            data=[PathwayScoreDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{pathway_score_id}", response_model=PathwayScoreResponse)
async def get_pathway_score(
    pathway_score_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific pathway score

    This endpoint:
    1. Retrieves a pathway score by ID (excludes soft-deleted, enforces ownership)
    2. Returns the pathway score details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=PathwayScore,
            item_id=pathway_score_id,
            user_org_id=org_id,
            entity_label="PathwayScore",
        )
        return PathwayScoreResponse(
            success=True,
            data=PathwayScoreDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=PathwayScoreResponse)
async def create_pathway_score(
    payload: PathwayScoreCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new pathway score

    This endpoint:
    1. Creates a new pathway score with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created pathway score details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=PathwayScore,
            table_name="pathway_scores",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return PathwayScoreResponse(
            success=True,
            data=PathwayScoreDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{pathway_score_id}", response_model=PathwayScoreResponse)
async def update_pathway_score(
    pathway_score_id: int,
    payload: PathwayScoreUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a pathway score

    This endpoint:
    1. Updates a pathway score with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated pathway score details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=PathwayScore,
            item_id=pathway_score_id,
            user_org_id=org_id,
            entity_label="PathwayScore",
        )

        update_data = payload.model_dump(exclude_unset=True)

        await update_with_audit(
            db=db,
            item=item,
            table_name="pathway_scores",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return PathwayScoreResponse(
            success=True,
            data=PathwayScoreDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{pathway_score_id}", response_model=MessageResponse)
async def delete_pathway_score(
    pathway_score_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a pathway score

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=PathwayScore,
            item_id=pathway_score_id,
            user_org_id=org_id,
            entity_label="PathwayScore",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="pathway_scores",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"PathwayScore {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
