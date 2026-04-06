"""
Scan Schedule Subrouter

CRUD endpoints for ScanSchedule model + activate/deactivate.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models.execution_models import ScanSchedule
from ...models.infrastructure_models import ScanTarget
from ...schemas.execution_schemas.scan_schedule_schemas import (
    ScanScheduleCreate, ScanScheduleUpdate, ScanScheduleDetail,
    ScanScheduleResponse, ScanSchedulesResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.audit_utils import log_audit, model_to_dict
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user
from core.db import get_session

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Scan Schedules"])


@router.get("/", response_model=ScanSchedulesResponse)
async def list_scan_schedules(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            return ScanSchedulesResponse(success=True, data=[])

        result = await db.execute(
            select(ScanSchedule)
            .join(ScanTarget, ScanSchedule.target_id == ScanTarget.id)
            .filter(ScanTarget.organization_id == org_id, ScanSchedule.deleted_at.is_(None))
            .order_by(ScanSchedule.created_at.desc())
        )
        items = result.scalars().all()
        return ScanSchedulesResponse(success=True, data=[ScanScheduleDetail.model_validate(i) for i in items])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing scan schedules: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{schedule_id}", response_model=ScanScheduleResponse)
async def get_scan_schedule(
    schedule_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanSchedule)
            .join(ScanTarget, ScanSchedule.target_id == ScanTarget.id)
            .filter(ScanSchedule.id == schedule_id, ScanTarget.organization_id == org_id, ScanSchedule.deleted_at.is_(None))
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan schedule not found")
        return ScanScheduleResponse(success=True, data=ScanScheduleDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting scan schedule {schedule_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/", response_model=ScanScheduleResponse)
async def create_scan_schedule(
    payload: ScanScheduleCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            raise HTTPException(status_code=403, detail="Organization membership required")

        item = ScanSchedule(created_by=user.id, **payload.model_dump())
        db.add(item)
        await db.commit()
        await db.refresh(item)

        await log_audit(db, "scan_schedules", item.id, "INSERT", new_data=model_to_dict(item), user_id=user.id, organization_id=org_id)
        await db.commit()

        return ScanScheduleResponse(success=True, data=ScanScheduleDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating scan schedule: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{schedule_id}", response_model=ScanScheduleResponse)
async def update_scan_schedule(
    schedule_id: int,
    payload: ScanScheduleUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanSchedule)
            .join(ScanTarget, ScanSchedule.target_id == ScanTarget.id)
            .filter(ScanSchedule.id == schedule_id, ScanTarget.organization_id == org_id, ScanSchedule.deleted_at.is_(None))
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan schedule not found")

        old_data = model_to_dict(item)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        item.updated_by = user.id

        await db.commit()
        await db.refresh(item)

        await log_audit(db, "scan_schedules", item.id, "UPDATE", old_data=old_data, new_data=model_to_dict(item), user_id=user.id, organization_id=org_id)
        await db.commit()

        return ScanScheduleResponse(success=True, data=ScanScheduleDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating scan schedule {schedule_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{schedule_id}", response_model=dict)
async def delete_scan_schedule(
    schedule_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanSchedule)
            .join(ScanTarget, ScanSchedule.target_id == ScanTarget.id)
            .filter(ScanSchedule.id == schedule_id, ScanTarget.organization_id == org_id, ScanSchedule.deleted_at.is_(None))
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan schedule not found")

        old_data = model_to_dict(item)
        from datetime import datetime, timezone
        item.deleted_at = datetime.now(timezone.utc)
        item.deleted_by = user.id
        await db.commit()

        await log_audit(db, "scan_schedules", item.id, "DELETE", old_data=old_data, user_id=user.id, organization_id=org_id)
        await db.commit()

        return {"success": True, "message": "Scan schedule deleted"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting scan schedule {schedule_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# ACTIVATE / DEACTIVATE
# ==========================================

@router.post("/{schedule_id}/activate", response_model=ScanScheduleResponse)
async def activate_schedule(schedule_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanSchedule).join(ScanTarget).filter(ScanSchedule.id == schedule_id, ScanTarget.organization_id == org_id, ScanSchedule.deleted_at.is_(None))
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan schedule not found")
        item.is_active = True
        item.updated_by = user.id
        await db.commit()
        await db.refresh(item)
        return ScanScheduleResponse(success=True, data=ScanScheduleDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{schedule_id}/deactivate", response_model=ScanScheduleResponse)
async def deactivate_schedule(schedule_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanSchedule).join(ScanTarget).filter(ScanSchedule.id == schedule_id, ScanTarget.organization_id == org_id, ScanSchedule.deleted_at.is_(None))
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan schedule not found")
        item.is_active = False
        item.updated_by = user.id
        await db.commit()
        await db.refresh(item)
        return ScanScheduleResponse(success=True, data=ScanScheduleDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")
