"""
Deal Subrouter

FastAPI router for Deal model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.deal_models import Deal
from ...schemas.deal_schemas.deal_schemas import (
    Deal as DealSchema,
    DealCreate, DealUpdate,
    DealResponse, DealsResponse,
    DealType
)
from ...utils.dependency_utils import get_entity_access, get_user_organization_id
from ...utils.filtering_utils import get_user_entity_ids, apply_soft_delete_filter
from ...utils.crud_utils import (
    get_record_or_404,
    create_with_audit,
    update_with_audit,
    soft_delete_with_audit,
)
from apps.accounts.utils.auth_utils import get_current_user
from apps.accounts.models import User

router = APIRouter(tags=["Deals"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=DealsResponse)
async def list_deals(
    entity_id: Optional[int] = Query(None, description="Filter by entity"),
    deal_type: Optional[DealType] = Query(None, description="Filter by deal type"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List deals for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access (user's org → EntityOrganizationMember)
    3. Returns a paginated list of deals
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return DealsResponse(success=True, data=[])

        # Build query - filter by accessible entities
        query = select(Deal).filter(
            Deal.entity_id.in_(accessible_entity_ids)
        )
        query = apply_soft_delete_filter(query, Deal)

        # Apply filters
        if entity_id:
            if entity_id not in accessible_entity_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this entity")
            query = query.filter(Deal.entity_id == entity_id)

        if deal_type:
            query = query.filter(Deal.deal_type == deal_type.value)

        # Apply pagination
        query = query.order_by(Deal.created_at.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        deals = result.scalars().all()

        return DealsResponse(
            success=True,
            data=[DealSchema.model_validate(deal) for deal in deals]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list deals: {str(e)}")

# ==========================================
# Individual Deal Operations
# ==========================================

@router.get("/{deal_id}", response_model=DealResponse)
async def get_deal(
    deal_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get deal details - requires VIEW permission on entity

    This endpoint:
    1. Retrieves a deal by ID (excludes soft-deleted)
    2. Returns the deal details
    """
    try:
        deal = await get_record_or_404(session, Deal, deal_id, "Deal")

        # Check entity access
        entity_access = await get_entity_access(user.id, deal.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return DealResponse(
            success=True,
            data=DealSchema.model_validate(deal)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get deal: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=DealResponse)
async def create_deal(
    data: DealCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create deal - requires EDITOR, ADMIN, or OWNER role on entity.

    This endpoint:
    1. Creates a new deal with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created deal details
    """
    try:
        # Check entity access
        entity_access = await get_entity_access(user.id, data.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to create deals for this entity")

        org_id = await get_user_organization_id(user.id, session)

        deal = await create_with_audit(
            db=session,
            model=Deal,
            table_name="deals",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(deal)

        return DealResponse(
            success=True,
            data=DealSchema.model_validate(deal)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create deal: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{deal_id}", response_model=DealResponse)
async def update_deal(
    deal_id: int,
    data: DealUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update deal - requires EDITOR, ADMIN, or OWNER role on entity

    This endpoint:
    1. Updates a deal with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated deal details
    """
    try:
        deal = await get_record_or_404(session, Deal, deal_id, "Deal")

        # Check entity access
        entity_access = await get_entity_access(user.id, deal.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role to update deals for this entity")

        # If entity_id is being changed, verify access to new entity
        if data.entity_id is not None and data.entity_id != deal.entity_id:
            new_entity_access = await get_entity_access(user.id, data.entity_id, session)
            if not new_entity_access:
                raise HTTPException(status_code=403, detail="You do not have access to the new entity")

            if new_entity_access.role not in ['EDITOR', 'ADMIN', 'OWNER']:
                raise HTTPException(status_code=403, detail="You need EDITOR, ADMIN, or OWNER role for the new entity")

        org_id = await get_user_organization_id(user.id, session)

        await update_with_audit(
            db=session,
            item=deal,
            table_name="deals",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()
        await session.refresh(deal)

        return DealResponse(
            success=True,
            data=DealSchema.model_validate(deal)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update deal: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{deal_id}")
async def delete_deal(
    deal_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete deal - requires ADMIN or OWNER role on entity

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        deal = await get_record_or_404(session, Deal, deal_id, "Deal")

        # Check entity access
        entity_access = await get_entity_access(user.id, deal.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this entity")

        if entity_access.role not in ['ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You need ADMIN or OWNER role to delete deals for this entity")

        org_id = await get_user_organization_id(user.id, session)

        name = deal.name

        await soft_delete_with_audit(
            db=session,
            item=deal,
            table_name="deals",
            user_id=user.id,
            organization_id=org_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": f"Deal '{name}' has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete deal: {str(e)}")
