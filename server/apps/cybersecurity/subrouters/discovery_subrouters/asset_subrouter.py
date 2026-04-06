"""
Asset Subrouter

Read-only endpoints for discovered assets.
No create/update/delete — scanner writes assets, user views them.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models.discovery_models import Asset
from ...models.execution_models import ScanJob
from ...models.infrastructure_models import ScanTarget
from ...schemas.discovery_schemas.asset_schemas import (
    AssetDetail, AssetResponse, AssetsResponse,
)
from ...utils.dependency_utils import get_user_organization_id
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
