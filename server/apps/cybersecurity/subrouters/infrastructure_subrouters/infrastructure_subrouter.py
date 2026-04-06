"""
Infrastructure Subrouter

CRUD endpoints for Infrastructure model.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ...models.infrastructure_models import Infrastructure
from ...schemas.infrastructure_schemas.infrastructure_schemas import (
    InfrastructureCreate, InfrastructureUpdate, InfrastructureDetail,
    InfrastructureResponse, InfrastructuresResponse, MessageResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.audit_utils import log_audit, model_to_dict
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user
from core.db import get_session

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Infrastructure"])


# ==========================================
# LIST
# ==========================================

@router.get("/", response_model=InfrastructuresResponse)
async def list_infrastructure(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """List all infrastructure items for the user's organization."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            return InfrastructuresResponse(success=True, data=[], error=None)

        result = await db.execute(
            select(Infrastructure)
            .filter(Infrastructure.organization_id == org_id, Infrastructure.deleted_at.is_(None))
            .order_by(Infrastructure.created_at.desc())
        )
        items = result.scalars().all()
        return InfrastructuresResponse(success=True, data=[InfrastructureDetail.model_validate(i) for i in items])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing infrastructure: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# DETAIL
# ==========================================

@router.get("/{infrastructure_id}", response_model=InfrastructureResponse)
async def get_infrastructure(
    infrastructure_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Get a single infrastructure item by ID."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(Infrastructure).filter(
                Infrastructure.id == infrastructure_id,
                Infrastructure.organization_id == org_id,
                Infrastructure.deleted_at.is_(None),
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Infrastructure not found")
        return InfrastructureResponse(success=True, data=InfrastructureDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting infrastructure {infrastructure_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# CREATE
# ==========================================

@router.post("/", response_model=InfrastructureResponse)
async def create_infrastructure(
    payload: InfrastructureCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Create a new infrastructure item."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            raise HTTPException(status_code=403, detail="Organization membership required")

        item = Infrastructure(
            organization_id=org_id,
            created_by=user.id,
            **payload.model_dump(),
        )
        db.add(item)
        await db.commit()
        await db.refresh(item)

        await log_audit(db, "infrastructure", item.id, "INSERT", new_data=model_to_dict(item), user_id=user.id, organization_id=org_id)
        await db.commit()

        return InfrastructureResponse(success=True, data=InfrastructureDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating infrastructure: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# UPDATE
# ==========================================

@router.put("/{infrastructure_id}", response_model=InfrastructureResponse)
async def update_infrastructure(
    infrastructure_id: int,
    payload: InfrastructureUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Update an infrastructure item."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(Infrastructure).filter(
                Infrastructure.id == infrastructure_id,
                Infrastructure.organization_id == org_id,
                Infrastructure.deleted_at.is_(None),
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Infrastructure not found")

        old_data = model_to_dict(item)
        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(item, field, value)
        item.updated_by = user.id

        await db.commit()
        await db.refresh(item)

        await log_audit(db, "infrastructure", item.id, "UPDATE", old_data=old_data, new_data=model_to_dict(item), user_id=user.id, organization_id=org_id)
        await db.commit()

        return InfrastructureResponse(success=True, data=InfrastructureDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating infrastructure {infrastructure_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# DELETE (soft)
# ==========================================

@router.delete("/{infrastructure_id}", response_model=MessageResponse)
async def delete_infrastructure(
    infrastructure_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Soft-delete an infrastructure item."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(Infrastructure).filter(
                Infrastructure.id == infrastructure_id,
                Infrastructure.organization_id == org_id,
                Infrastructure.deleted_at.is_(None),
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Infrastructure not found")

        old_data = model_to_dict(item)
        from datetime import datetime, timezone
        item.deleted_at = datetime.now(timezone.utc)
        item.deleted_by = user.id

        await db.commit()

        await log_audit(db, "infrastructure", item.id, "DELETE", old_data=old_data, user_id=user.id, organization_id=org_id)
        await db.commit()

        return MessageResponse(success=True, message="Infrastructure deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting infrastructure {infrastructure_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
