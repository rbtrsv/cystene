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
from ...utils.export_utils import ExportColumn, SummaryCard, generate_csv, generate_pdf
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


# ==========================================
# EXPORT (PDF / CSV)
# ==========================================

@router.get("/export")
async def export_findings(
    format: str = Query("pdf", pattern="^(pdf|csv)$", description="Export format: pdf or csv"),
    scan_job_id: int | None = None,
    severity: str | None = None,
    status: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Export findings as PDF or CSV.

    Same filters as list endpoint. PDF includes summary cards + data table.
    CSV includes header row + data rows.
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            raise HTTPException(status_code=403, detail="Organization membership required")

        # Build query — same as list_findings but returns all matching rows
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
        if status:
            query = query.filter(Finding.status == status)

        query = query.order_by(Finding.discovered_at.desc())

        result = await db.execute(query)
        items = result.scalars().all()

        # Define export columns
        columns = [
            ExportColumn(key="severity", label="Severity", formatter=lambda v: v.upper() if v else "—"),
            ExportColumn(key="title", label="Title"),
            ExportColumn(key="host_port", label="Host"),
            ExportColumn(key="status", label="Status", formatter=lambda v: v.replace("_", " ").title() if v else "—"),
            ExportColumn(key="category", label="Category", formatter=lambda v: v.replace("_", " ").title() if v else "—"),
            ExportColumn(key="cve_id", label="CVE"),
            ExportColumn(key="cwe_id", label="CWE"),
            ExportColumn(key="mitre_technique", label="MITRE"),
            ExportColumn(key="discovered_at", label="Discovered", formatter=lambda v: v[:10] if v else "—"),
        ]

        # Flatten Finding objects to dicts
        rows = []
        for item in items:
            rows.append({
                "severity": item.severity,
                "title": item.title,
                "host_port": f"{item.host or '—'}{f':{item.port}' if item.port else ''}",
                "status": item.status,
                "category": item.category,
                "cve_id": item.cve_id,
                "cwe_id": item.cwe_id,
                "mitre_technique": item.mitre_technique,
                "discovered_at": item.discovered_at.isoformat() if item.discovered_at else None,
            })

        # Count severities for summary cards
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
        open_count = 0
        for item in items:
            if item.severity in severity_counts:
                severity_counts[item.severity] += 1
            if item.status == "open":
                open_count += 1

        title = "Findings"
        subtitle_parts = []
        if severity:
            subtitle_parts.append(f"Severity: {severity.upper()}")
        if status:
            subtitle_parts.append(f"Status: {status.replace('_', ' ').title()}")
        subtitle = " — ".join(subtitle_parts) if subtitle_parts else "All Findings"

        if format == "csv":
            return generate_csv(rows=rows, columns=columns, title=title)

        # PDF — include summary cards
        summary_cards = [
            SummaryCard(label="Total Findings", value=str(len(items))),
            SummaryCard(label="Critical", value=str(severity_counts["critical"])),
            SummaryCard(label="High", value=str(severity_counts["high"])),
            SummaryCard(label="Medium", value=str(severity_counts["medium"])),
            SummaryCard(label="Open", value=str(open_count)),
        ]

        return generate_pdf(
            rows=rows,
            columns=columns,
            title=title,
            subtitle=subtitle,
            summary_cards=summary_cards,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting findings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
