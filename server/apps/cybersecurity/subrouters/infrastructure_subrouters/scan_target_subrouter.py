"""
Scan Target Subrouter

CRUD endpoints for ScanTarget model + target ownership verification stub.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models.infrastructure_models import ScanTarget
from ...schemas.infrastructure_schemas.scan_target_schemas import (
    ScanTargetCreate, ScanTargetUpdate, ScanTargetDetail,
    ScanTargetResponse, ScanTargetsResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.audit_utils import log_audit, model_to_dict
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user
from core.db import get_session

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Scan Targets"])


# ==========================================
# LIST
# ==========================================

@router.get("/", response_model=ScanTargetsResponse)
async def list_scan_targets(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """List all scan targets for the user's organization."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            return ScanTargetsResponse(success=True, data=[])

        result = await db.execute(
            select(ScanTarget)
            .filter(ScanTarget.organization_id == org_id, ScanTarget.deleted_at.is_(None))
            .order_by(ScanTarget.created_at.desc())
        )
        items = result.scalars().all()
        return ScanTargetsResponse(success=True, data=[ScanTargetDetail.model_validate(i) for i in items])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing scan targets: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# DETAIL
# ==========================================

@router.get("/{target_id}", response_model=ScanTargetResponse)
async def get_scan_target(
    target_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Get a single scan target by ID."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanTarget).filter(
                ScanTarget.id == target_id,
                ScanTarget.organization_id == org_id,
                ScanTarget.deleted_at.is_(None),
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan target not found")
        return ScanTargetResponse(success=True, data=ScanTargetDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting scan target {target_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# CREATE
# ==========================================

@router.post("/", response_model=ScanTargetResponse)
async def create_scan_target(
    payload: ScanTargetCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Create a new scan target."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            raise HTTPException(status_code=403, detail="Organization membership required")

        item = ScanTarget(
            user_id=user.id,
            organization_id=org_id,
            created_by=user.id,
            **payload.model_dump(),
        )
        db.add(item)
        await db.commit()
        await db.refresh(item)

        await log_audit(db, "scan_targets", item.id, "INSERT", new_data=model_to_dict(item), user_id=user.id, organization_id=org_id)
        await db.commit()

        return ScanTargetResponse(success=True, data=ScanTargetDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating scan target: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# UPDATE
# ==========================================

@router.put("/{target_id}", response_model=ScanTargetResponse)
async def update_scan_target(
    target_id: int,
    payload: ScanTargetUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Update a scan target."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanTarget).filter(
                ScanTarget.id == target_id,
                ScanTarget.organization_id == org_id,
                ScanTarget.deleted_at.is_(None),
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan target not found")

        old_data = model_to_dict(item)
        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(item, field, value)
        item.updated_by = user.id

        await db.commit()
        await db.refresh(item)

        await log_audit(db, "scan_targets", item.id, "UPDATE", old_data=old_data, new_data=model_to_dict(item), user_id=user.id, organization_id=org_id)
        await db.commit()

        return ScanTargetResponse(success=True, data=ScanTargetDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating scan target {target_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# DELETE (soft)
# ==========================================

@router.delete("/{target_id}", response_model=dict)
async def delete_scan_target(
    target_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Soft-delete a scan target."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanTarget).filter(
                ScanTarget.id == target_id,
                ScanTarget.organization_id == org_id,
                ScanTarget.deleted_at.is_(None),
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan target not found")

        old_data = model_to_dict(item)
        from datetime import datetime, timezone
        item.deleted_at = datetime.now(timezone.utc)
        item.deleted_by = user.id

        await db.commit()

        await log_audit(db, "scan_targets", item.id, "DELETE", old_data=old_data, user_id=user.id, organization_id=org_id)
        await db.commit()

        return {"success": True, "message": "Scan target deleted"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting scan target {target_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# VERIFY OWNERSHIP (stub)
# ==========================================

@router.post("/{target_id}/verify", response_model=dict)
async def verify_scan_target(
    target_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Verify target ownership (DNS TXT, file upload, or meta tag). Stub — returns pending."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanTarget).filter(
                ScanTarget.id == target_id,
                ScanTarget.organization_id == org_id,
                ScanTarget.deleted_at.is_(None),
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan target not found")

        # TODO: Implement actual verification (DNS TXT lookup, HTTP file check, meta tag check)
        return {"success": True, "message": "Verification pending — implementation coming soon", "is_verified": item.is_verified}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying scan target {target_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
