"""
Asset Subrouter

Read-only endpoints for discovered assets.
No create/update/delete — scanner writes assets, user views them.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models.discovery_models import Asset
from ...models.execution_models import ScanJob
from ...models.infrastructure_models import ScanTarget
from ...schemas.discovery_schemas.asset_schemas import (
    AssetDetail, AssetResponse, AssetsResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.export_utils import ExportColumn, SummaryCard, generate_csv, generate_pdf
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user
from core.db import get_session

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Assets"])


@router.get("/", response_model=AssetsResponse)
async def list_assets(
    scan_job_id: int | None = None,
    asset_type: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """List discovered assets. Filter by scan_job_id and/or asset_type."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            return AssetsResponse(success=True, data=[])

        query = (
            select(Asset)
            .join(ScanJob, Asset.scan_job_id == ScanJob.id)
            .join(ScanTarget, ScanJob.target_id == ScanTarget.id)
            .filter(ScanTarget.organization_id == org_id)
        )
        if scan_job_id:
            query = query.filter(Asset.scan_job_id == scan_job_id)
        if asset_type:
            query = query.filter(Asset.asset_type == asset_type)
        query = query.order_by(Asset.first_seen_at.desc())

        result = await db.execute(query)
        items = result.scalars().all()
        return AssetsResponse(success=True, data=[AssetDetail.model_validate(i) for i in items])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing assets: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(Asset)
            .join(ScanJob, Asset.scan_job_id == ScanJob.id)
            .join(ScanTarget, ScanJob.target_id == ScanTarget.id)
            .filter(Asset.id == asset_id, ScanTarget.organization_id == org_id)
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Asset not found")
        return AssetResponse(success=True, data=AssetDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting asset {asset_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# EXPORT (PDF / CSV)
# ==========================================

@router.get("/export")
async def export_assets(
    format: str = Query("pdf", pattern="^(pdf|csv)$", description="Export format: pdf or csv"),
    scan_job_id: int | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Export assets as PDF or CSV.

    Same filters as list endpoint. PDF includes summary cards + data table.
    CSV includes header row + data rows.
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            raise HTTPException(status_code=403, detail="Organization membership required")

        # Build query — same as list_assets
        query = (
            select(Asset)
            .join(ScanJob, Asset.scan_job_id == ScanJob.id)
            .join(ScanTarget, ScanJob.target_id == ScanTarget.id)
            .filter(ScanTarget.organization_id == org_id)
        )
        if scan_job_id:
            query = query.filter(Asset.scan_job_id == scan_job_id)
        query = query.order_by(Asset.first_seen_at.desc())

        result = await db.execute(query)
        items = result.scalars().all()

        # Define export columns
        columns = [
            ExportColumn(key="asset_type", label="Type", formatter=lambda v: v.replace("_", " ").title() if v else "—"),
            ExportColumn(key="value", label="Value"),
            ExportColumn(key="host", label="Host"),
            ExportColumn(key="port", label="Port", align="RIGHT"),
            ExportColumn(key="service_name", label="Service"),
            ExportColumn(key="service_version", label="Version"),
            ExportColumn(key="confidence", label="Confidence", formatter=lambda v: v.title() if v else "—"),
        ]

        # Flatten Asset objects to dicts
        rows = []
        for item in items:
            rows.append({
                "asset_type": item.asset_type,
                "value": item.value,
                "host": item.host,
                "port": item.port,
                "service_name": item.service_name,
                "service_version": item.service_version,
                "confidence": item.confidence,
            })

        # Count asset types for summary cards
        type_counts = {}
        for item in items:
            t = item.asset_type or "unknown"
            type_counts[t] = type_counts.get(t, 0) + 1

        host_count = type_counts.get("host", 0)
        service_count = type_counts.get("service", 0)

        title = "Assets"
        subtitle = "Discovered Assets"

        if format == "csv":
            return generate_csv(rows=rows, columns=columns, title=title)

        # PDF — include summary cards
        summary_cards = [
            SummaryCard(label="Total Assets", value=str(len(items))),
            SummaryCard(label="Hosts", value=str(host_count)),
            SummaryCard(label="Services", value=str(service_count)),
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
        logger.error(f"Error exporting assets: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
