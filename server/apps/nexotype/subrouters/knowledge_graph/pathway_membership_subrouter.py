from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import PathwayMembership
from ...schemas.knowledge_graph.pathway_membership_schemas import (
    MessageResponse,
    PathwayMembershipCreate,
    PathwayMembershipDetail,
    PathwayMembershipListResponse,
    PathwayMembershipResponse,
    PathwayMembershipUpdate,
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
# Pathway Memberships Router
# ==========================================

router = APIRouter(tags=["PathwayMemberships"])


@router.get("/", response_model=PathwayMembershipListResponse)
async def list_pathway_memberships(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List pathway memberships with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of pathway memberships
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total pathway memberships (with filters applied)
        count_query = select(func.count(PathwayMembership.id))
        count_query = apply_default_filters(count_query, PathwayMembership, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get pathway memberships with pagination (with filters applied)
        data_query = select(PathwayMembership).order_by(PathwayMembership.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, PathwayMembership, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return PathwayMembershipListResponse(
            success=True,
            data=[PathwayMembershipDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{membership_id}", response_model=PathwayMembershipResponse)
async def get_pathway_membership(
    membership_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific pathway membership

    This endpoint:
    1. Retrieves a pathway membership by ID (excludes soft-deleted, enforces ownership)
    2. Returns the pathway membership details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=PathwayMembership,
            item_id=membership_id,
            user_org_id=org_id,
            entity_label="PathwayMembership",
        )
        return PathwayMembershipResponse(
            success=True,
            data=PathwayMembershipDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=PathwayMembershipResponse)
async def create_pathway_membership(
    payload: PathwayMembershipCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new pathway membership

    This endpoint:
    1. Checks for duplicate protein_id + pathway_id combination
    2. Creates a new pathway membership with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created pathway membership details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=PathwayMembership,
            filters={"protein_id": payload.protein_id, "pathway_id": payload.pathway_id},
            entity_label="PathwayMembership",
        )

        item = await create_with_audit(
            db=db,
            model=PathwayMembership,
            table_name="pathway_memberships",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return PathwayMembershipResponse(
            success=True,
            data=PathwayMembershipDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{membership_id}", response_model=PathwayMembershipResponse)
async def update_pathway_membership(
    membership_id: int,
    payload: PathwayMembershipUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a pathway membership

    This endpoint:
    1. Updates a pathway membership with the provided data
    2. Checks for duplicate protein_id + pathway_id combination (excluding self)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated pathway membership details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=PathwayMembership,
            item_id=membership_id,
            user_org_id=org_id,
            entity_label="PathwayMembership",
        )

        # Check if composite key fields are changing
        update_data = payload.model_dump(exclude_unset=True)
        new_protein_id = update_data.get("protein_id", item.protein_id)
        new_pathway_id = update_data.get("pathway_id", item.pathway_id)
        if new_protein_id != item.protein_id or new_pathway_id != item.pathway_id:
            await check_duplicate(
                db=db,
                model=PathwayMembership,
                filters={"protein_id": new_protein_id, "pathway_id": new_pathway_id},
                entity_label="PathwayMembership",
                exclude_id=membership_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="pathway_memberships",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return PathwayMembershipResponse(
            success=True,
            data=PathwayMembershipDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{membership_id}", response_model=MessageResponse)
async def delete_pathway_membership(
    membership_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a pathway membership

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=PathwayMembership,
            item_id=membership_id,
            user_org_id=org_id,
            entity_label="PathwayMembership",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="pathway_memberships",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"PathwayMembership {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
