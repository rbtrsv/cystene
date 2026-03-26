from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import BiomarkerAssociation
from ...schemas.knowledge_graph.biomarker_association_schemas import (
    BiomarkerAssociationCreate,
    BiomarkerAssociationDetail,
    BiomarkerAssociationListResponse,
    BiomarkerAssociationResponse,
    BiomarkerAssociationUpdate,
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
# Biomarker Associations Router
# ==========================================

router = APIRouter(tags=["BiomarkerAssociations"])


@router.get("/", response_model=BiomarkerAssociationListResponse)
async def list_biomarker_associations(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List biomarker associations with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of biomarker associations
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total biomarker associations (with filters applied)
        count_query = select(func.count(BiomarkerAssociation.id))
        count_query = apply_default_filters(count_query, BiomarkerAssociation, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get biomarker associations with pagination (with filters applied)
        data_query = select(BiomarkerAssociation).order_by(BiomarkerAssociation.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, BiomarkerAssociation, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return BiomarkerAssociationListResponse(
            success=True,
            data=[BiomarkerAssociationDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{association_id}", response_model=BiomarkerAssociationResponse)
async def get_biomarker_association(
    association_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific biomarker association

    This endpoint:
    1. Retrieves a biomarker association by ID (excludes soft-deleted, enforces ownership)
    2. Returns the biomarker association details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=BiomarkerAssociation,
            item_id=association_id,
            user_org_id=org_id,
            entity_label="BiomarkerAssociation",
        )
        return BiomarkerAssociationResponse(
            success=True,
            data=BiomarkerAssociationDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=BiomarkerAssociationResponse)
async def create_biomarker_association(
    payload: BiomarkerAssociationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new biomarker association

    This endpoint:
    1. Creates a new biomarker association with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created biomarker association details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=BiomarkerAssociation,
            table_name="biomarker_associations",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return BiomarkerAssociationResponse(
            success=True,
            data=BiomarkerAssociationDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{association_id}", response_model=BiomarkerAssociationResponse)
async def update_biomarker_association(
    association_id: int,
    payload: BiomarkerAssociationUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a biomarker association

    This endpoint:
    1. Updates a biomarker association with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated biomarker association details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=BiomarkerAssociation,
            item_id=association_id,
            user_org_id=org_id,
            entity_label="BiomarkerAssociation",
        )

        await update_with_audit(
            db=db,
            item=item,
            table_name="biomarker_associations",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return BiomarkerAssociationResponse(
            success=True,
            data=BiomarkerAssociationDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{association_id}", response_model=MessageResponse)
async def delete_biomarker_association(
    association_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a biomarker association

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=BiomarkerAssociation,
            item_id=association_id,
            user_org_id=org_id,
            entity_label="BiomarkerAssociation",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="biomarker_associations",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"BiomarkerAssociation {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
