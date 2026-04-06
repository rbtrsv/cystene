"""
Finding Subrouter

List, detail, and triage status update for findings.
No create/delete — scanner writes findings, user triages them.
"""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models.discovery_models import Finding
from ...models.execution_models import ScanJob
from ...models.infrastructure_models import ScanTarget
from ...schemas.discovery_schemas.finding_schemas import (
    FindingDetail, FindingStatusUpdate, FindingResponse, FindingsResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user
from core.db import get_session

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Findings"])


# ==========================================
# LIST (with filters)
# ==========================================

@router.get("/", response_model=FindingsResponse)
async def list_findings(
    scan_job_id: int | None = None,
    severity: str | None = None,
    category: str | None = None,
    status: str | None = None,
    is_new: bool | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """List findings. Filter by scan_job_id, severity, category, status, is_new."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            return FindingsResponse(success=True, data=[])

        query = (
            select(Finding)
            .join(ScanJob, Finding.scan_job_id == ScanJob.id)
            .join(ScanTarget, ScanJob.target_id == ScanTarget.id)
            .filter(ScanTarget.organization_id == org_id)
        )
        if scan_job_id:
            query = query.filter(Finding.scan_job_id == scan_job_id)
        if severity:
            query = query.filter(Finding.severity == severity)
        if category:
            query = query.filter(Finding.category == category)
        if status:
            query = query.filter(Finding.status == status)
        if is_new is not None:
            query = query.filter(Finding.is_new == is_new)

        query = query.order_by(Finding.discovered_at.desc())

        result = await db.execute(query)
        items = result.scalars().all()
        return FindingsResponse(success=True, data=[FindingDetail.model_validate(i) for i in items])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing findings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# DETAIL
# ==========================================

@router.get("/{finding_id}", response_model=FindingResponse)
async def get_finding(
    finding_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(Finding)
            .join(ScanJob, Finding.scan_job_id == ScanJob.id)
            .join(ScanTarget, ScanJob.target_id == ScanTarget.id)
            .filter(Finding.id == finding_id, ScanTarget.organization_id == org_id)
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Finding not found")
        return FindingResponse(success=True, data=FindingDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting finding {finding_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# UPDATE TRIAGE STATUS
# ==========================================

@router.patch("/{finding_id}/status", response_model=FindingResponse)
async def update_finding_status(
    finding_id: int,
    payload: FindingStatusUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Update finding triage status (open, acknowledged, resolved, false_positive)."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(Finding)
            .join(ScanJob, Finding.scan_job_id == ScanJob.id)
            .join(ScanTarget, ScanJob.target_id == ScanTarget.id)
            .filter(Finding.id == finding_id, ScanTarget.organization_id == org_id)
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Finding not found")

        item.status = payload.status.value
        item.status_changed_at = datetime.now(timezone.utc)

        # Track who resolved it (for compliance audits)
        if payload.status.value == "resolved":
            item.resolved_by = user.id

        await db.commit()
        await db.refresh(item)

        return FindingResponse(success=True, data=FindingDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating finding status {finding_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
