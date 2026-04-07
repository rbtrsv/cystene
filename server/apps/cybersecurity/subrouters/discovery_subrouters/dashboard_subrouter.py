"""
Dashboard Subrouter

Aggregated security stats endpoint for the dashboard.
Single GET /summary endpoint returning severity breakdown, status breakdown,
security score, and recent scan jobs.
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc

from ...models.discovery_models import Finding
from ...models.execution_models import ScanJob
from ...models.infrastructure_models import ScanTarget
from ...utils.dependency_utils import get_user_organization_id
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user
from core.db import get_session

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Dashboard"])


# ==========================================
# Response Schema
# ==========================================

class RecentJob(BaseModel):
    """Recent scan job summary for dashboard."""
    id: int
    status: str
    security_score: int | None
    total_findings: int
    created_at: datetime


class DashboardSummary(BaseModel):
    """Dashboard aggregated stats."""
    total_targets: int
    total_scans: int
    total_findings: int
    severity_breakdown: dict[str, int]
    status_breakdown: dict[str, int]
    new_findings: int
    latest_security_score: int | None
    recent_jobs: list[RecentJob]


class DashboardResponse(BaseModel):
    """Response containing dashboard summary."""
    success: bool
    data: DashboardSummary | None = None
    error: str | None = None


# ==========================================
# Dashboard Summary Endpoint
# ==========================================

@router.get("/summary", response_model=DashboardResponse)
async def get_dashboard_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get aggregated security stats for the dashboard.

    Returns severity breakdown, status breakdown, security score,
    recent scan jobs — all scoped to the user's organization.
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            return DashboardResponse(success=True, data=DashboardSummary(
                total_targets=0, total_scans=0, total_findings=0,
                severity_breakdown={"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0},
                status_breakdown={"open": 0, "acknowledged": 0, "resolved": 0, "false_positive": 0},
                new_findings=0, latest_security_score=None, recent_jobs=[],
            ))

        # Total targets for this organization
        result = await db.execute(
            select(func.count(ScanTarget.id))
            .where(and_(ScanTarget.organization_id == org_id, ScanTarget.deleted_at == None))
        )
        total_targets = result.scalar() or 0

        # Total scan jobs for this organization's targets
        result = await db.execute(
            select(func.count(ScanJob.id))
            .join(ScanTarget, ScanJob.target_id == ScanTarget.id)
            .where(and_(ScanTarget.organization_id == org_id, ScanJob.deleted_at == None))
        )
        total_scans = result.scalar() or 0

        # All findings for this organization's targets
        findings_base = (
            select(Finding)
            .join(ScanJob, Finding.scan_job_id == ScanJob.id)
            .join(ScanTarget, ScanJob.target_id == ScanTarget.id)
            .where(ScanTarget.organization_id == org_id)
        )

        result = await db.execute(findings_base)
        findings = result.scalars().all()

        total_findings = len(findings)

        # Severity breakdown
        severity_breakdown = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
        status_breakdown = {"open": 0, "acknowledged": 0, "resolved": 0, "false_positive": 0}
        new_findings = 0

        for f in findings:
            if f.severity in severity_breakdown:
                severity_breakdown[f.severity] += 1
            if f.status in status_breakdown:
                status_breakdown[f.status] += 1
            if f.is_new:
                new_findings += 1

        # Latest security score from most recent completed job
        result = await db.execute(
            select(ScanJob)
            .join(ScanTarget, ScanJob.target_id == ScanTarget.id)
            .where(and_(
                ScanTarget.organization_id == org_id,
                ScanJob.status == "completed",
                ScanJob.security_score != None,
            ))
            .order_by(desc(ScanJob.completed_at))
            .limit(1)
        )
        latest_job = result.scalar_one_or_none()
        latest_security_score = latest_job.security_score if latest_job else None

        # Recent 10 scan jobs
        result = await db.execute(
            select(ScanJob)
            .join(ScanTarget, ScanJob.target_id == ScanTarget.id)
            .where(and_(ScanTarget.organization_id == org_id, ScanJob.deleted_at == None))
            .order_by(desc(ScanJob.created_at))
            .limit(10)
        )
        recent_jobs_raw = result.scalars().all()
        recent_jobs = [
            RecentJob(
                id=j.id,
                status=j.status,
                security_score=j.security_score,
                total_findings=j.total_findings,
                created_at=j.created_at,
            )
            for j in recent_jobs_raw
        ]

        return DashboardResponse(success=True, data=DashboardSummary(
            total_targets=total_targets,
            total_scans=total_scans,
            total_findings=total_findings,
            severity_breakdown=severity_breakdown,
            status_breakdown=status_breakdown,
            new_findings=new_findings,
            latest_security_score=latest_security_score,
            recent_jobs=recent_jobs,
        ))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting dashboard summary: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
