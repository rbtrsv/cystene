"""
Scan Job Subrouter

Endpoints for scan job management: start scan, cancel, list, detail.
No create/update — jobs are created via POST /start and are immutable once started.
Scanner dispatcher will be added when scanners are implemented.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models.execution_models import ScanJob, ScanTemplate
from ...models.infrastructure_models import ScanTarget
from ...schemas.execution_schemas.scan_job_schemas import (
    ScanJobDetail, ScanJobResponse, ScanJobsResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user
from core.db import get_session

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Scan Jobs"])


# ==========================================
# LIST
# ==========================================

@router.get("/", response_model=ScanJobsResponse)
async def list_scan_jobs(
    target_id: int | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """List scan jobs. Optionally filter by target_id."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            return ScanJobsResponse(success=True, data=[])

        query = (
            select(ScanJob)
            .join(ScanTarget, ScanJob.target_id == ScanTarget.id)
            .filter(ScanTarget.organization_id == org_id, ScanJob.deleted_at.is_(None))
        )
        if target_id:
            query = query.filter(ScanJob.target_id == target_id)
        query = query.order_by(ScanJob.created_at.desc())

        result = await db.execute(query)
        items = result.scalars().all()
        return ScanJobsResponse(success=True, data=[ScanJobDetail.model_validate(i) for i in items])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing scan jobs: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# DETAIL
# ==========================================

@router.get("/{job_id}", response_model=ScanJobResponse)
async def get_scan_job(
    job_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanJob)
            .join(ScanTarget, ScanJob.target_id == ScanTarget.id)
            .filter(ScanJob.id == job_id, ScanTarget.organization_id == org_id, ScanJob.deleted_at.is_(None))
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan job not found")
        return ScanJobResponse(success=True, data=ScanJobDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting scan job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# START SCAN (stub — scanner dispatcher added later)
# ==========================================

@router.post("/start", response_model=ScanJobResponse)
async def start_scan(
    target_id: int,
    template_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Start a new scan. Creates ScanJob with status=pending. Scanner execution added later."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            raise HTTPException(status_code=403, detail="Organization membership required")

        # Verify target ownership
        target = await db.execute(
            select(ScanTarget).filter(ScanTarget.id == target_id, ScanTarget.organization_id == org_id, ScanTarget.deleted_at.is_(None))
        )
        target = target.scalar_one_or_none()
        if not target:
            raise HTTPException(status_code=404, detail="Scan target not found")

        # Verify template belongs to target
        template = await db.execute(
            select(ScanTemplate).filter(ScanTemplate.id == template_id, ScanTemplate.target_id == target_id, ScanTemplate.deleted_at.is_(None))
        )
        template = template.scalar_one_or_none()
        if not template:
            raise HTTPException(status_code=404, detail="Scan template not found")

        # Create job with pending status
        job = ScanJob(
            target_id=target_id,
            template_id=template_id,
            status="pending",
            scan_types_run=template.scan_types,
            created_by=user.id,
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)

        # TODO: Launch scanner dispatcher as background task
        # asyncio.create_task(run_scanners(job.id))

        return ScanJobResponse(success=True, data=ScanJobDetail.model_validate(job))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error starting scan: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# CANCEL
# ==========================================

@router.post("/{job_id}/cancel", response_model=ScanJobResponse)
async def cancel_scan(
    job_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Cancel a running or pending scan job."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanJob)
            .join(ScanTarget, ScanJob.target_id == ScanTarget.id)
            .filter(ScanJob.id == job_id, ScanTarget.organization_id == org_id)
        )
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Scan job not found")

        if job.status not in ("pending", "running"):
            raise HTTPException(status_code=400, detail=f"Cannot cancel job with status '{job.status}'")

        job.status = "cancelled"
        job.updated_by = user.id
        await db.commit()
        await db.refresh(job)

        return ScanJobResponse(success=True, data=ScanJobDetail.model_validate(job))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error cancelling scan job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
