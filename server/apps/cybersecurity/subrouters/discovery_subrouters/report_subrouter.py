"""
Report Subrouter

Generate, list, detail, and soft-delete reports.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models.discovery_models import Report
from ...models.infrastructure_models import ScanTarget
from ...schemas.discovery_schemas.report_schemas import (
    ReportCreate, ReportDetail, ReportResponse, ReportsResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.audit_utils import log_audit, model_to_dict
from ...services.report_generation_service import generate_report_content
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user
from core.db import get_session

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Reports"])


@router.get("/", response_model=ReportsResponse)
async def list_reports(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            return ReportsResponse(success=True, data=[])

        result = await db.execute(
            select(Report)
            .join(ScanTarget, Report.target_id == ScanTarget.id)
            .filter(ScanTarget.organization_id == org_id, Report.deleted_at.is_(None))
            .order_by(Report.generated_at.desc())
        )
        items = result.scalars().all()
        return ReportsResponse(success=True, data=[ReportDetail.model_validate(i) for i in items])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing reports: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(Report)
            .join(ScanTarget, Report.target_id == ScanTarget.id)
            .filter(Report.id == report_id, ScanTarget.organization_id == org_id, Report.deleted_at.is_(None))
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Report not found")
        return ReportResponse(success=True, data=ReportDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting report {report_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/generate", response_model=ReportResponse)
async def generate_report(
    payload: ReportCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Generate a new report for a target (optionally from a specific scan job).

    Rate limited per-endpoint — report generation runs heavy DB aggregation queries.
    Pattern: assetmanager rate_limiter.check() per-endpoint, not router-level.
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            raise HTTPException(status_code=403, detail="Organization membership required")

        # Rate limit check — report generation is a resource-heavy operation
        from ...utils.rate_limiting_utils import check_rate_limit
        from ...utils.subscription_utils import get_org_tier, get_org_subscription
        subscription = await get_org_subscription(org_id, db)
        tier = get_org_tier(subscription)
        await check_rate_limit(org_id, tier)

        # Verify target ownership
        target = await db.execute(
            select(ScanTarget).filter(ScanTarget.id == payload.target_id, ScanTarget.organization_id == org_id, ScanTarget.deleted_at.is_(None))
        )
        target = target.scalar_one_or_none()
        if not target:
            raise HTTPException(status_code=404, detail="Scan target not found")

        # Generate report content via service (aggregates findings + assets)
        report_data = await generate_report_content(
            target_id=payload.target_id,
            scan_job_id=payload.scan_job_id,
            report_type=payload.report_type or "full",
            format=payload.format or "html",
            session=db,
        )

        item = Report(
            target_id=payload.target_id,
            scan_job_id=payload.scan_job_id,
            name=payload.name,
            report_type=payload.report_type or "full",
            format=payload.format or "html",
            content=report_data["content"],
            summary=report_data["summary"],
            total_findings=report_data["total_findings"],
            critical_count=report_data["critical_count"],
            high_count=report_data["high_count"],
            medium_count=report_data["medium_count"],
            low_count=report_data["low_count"],
            info_count=report_data["info_count"],
            generated_by=user.id,
            created_by=user.id,
        )
        db.add(item)
        await db.commit()
        await db.refresh(item)

        await log_audit(db, "reports", item.id, "INSERT", new_data=model_to_dict(item), user_id=user.id, organization_id=org_id)
        await db.commit()

        return ReportResponse(success=True, data=ReportDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error generating report: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{report_id}", response_model=dict)
async def delete_report(
    report_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(Report)
            .join(ScanTarget, Report.target_id == ScanTarget.id)
            .filter(Report.id == report_id, ScanTarget.organization_id == org_id, Report.deleted_at.is_(None))
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Report not found")

        old_data = model_to_dict(item)
        from datetime import datetime, timezone
        item.deleted_at = datetime.now(timezone.utc)
        item.deleted_by = user.id
        await db.commit()

        await log_audit(db, "reports", item.id, "DELETE", old_data=old_data, user_id=user.id, organization_id=org_id)
        await db.commit()

        return {"success": True, "message": "Report deleted"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting report {report_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
