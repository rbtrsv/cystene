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
    """Generate a new report for a target (optionally from a specific scan job)."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            raise HTTPException(status_code=403, detail="Organization membership required")

        # Verify target ownership
        target = await db.execute(
            select(ScanTarget).filter(ScanTarget.id == payload.target_id, ScanTarget.organization_id == org_id, ScanTarget.deleted_at.is_(None))
        )
        target = target.scalar_one_or_none()
        if not target:
            raise HTTPException(status_code=404, detail="Scan target not found")

        # TODO: Actual report generation logic (aggregate findings, build HTML/PDF content)
        item = Report(
            generated_by=user.id,
            created_by=user.id,
            **payload.model_dump(),
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
