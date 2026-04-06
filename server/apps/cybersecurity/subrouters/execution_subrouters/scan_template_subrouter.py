"""
Scan Template Subrouter

CRUD endpoints for ScanTemplate model.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models.execution_models import ScanTemplate
from ...models.infrastructure_models import ScanTarget
from ...schemas.execution_schemas.scan_template_schemas import (
    ScanTemplateCreate, ScanTemplateUpdate, ScanTemplateDetail,
    ScanTemplateResponse, ScanTemplatesResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.audit_utils import log_audit, model_to_dict
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user
from core.db import get_session

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Scan Templates"])


@router.get("/", response_model=ScanTemplatesResponse)
async def list_scan_templates(
    target_id: int | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """List scan templates. Optionally filter by target_id."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            return ScanTemplatesResponse(success=True, data=[])

        query = (
            select(ScanTemplate)
            .join(ScanTarget, ScanTemplate.target_id == ScanTarget.id)
            .filter(ScanTarget.organization_id == org_id, ScanTemplate.deleted_at.is_(None))
        )
        if target_id:
            query = query.filter(ScanTemplate.target_id == target_id)
        query = query.order_by(ScanTemplate.created_at.desc())

        result = await db.execute(query)
        items = result.scalars().all()
        return ScanTemplatesResponse(success=True, data=[ScanTemplateDetail.model_validate(i) for i in items])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing scan templates: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{template_id}", response_model=ScanTemplateResponse)
async def get_scan_template(
    template_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanTemplate)
            .join(ScanTarget, ScanTemplate.target_id == ScanTarget.id)
            .filter(ScanTemplate.id == template_id, ScanTarget.organization_id == org_id, ScanTemplate.deleted_at.is_(None))
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan template not found")
        return ScanTemplateResponse(success=True, data=ScanTemplateDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting scan template {template_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/", response_model=ScanTemplateResponse)
async def create_scan_template(
    payload: ScanTemplateCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            raise HTTPException(status_code=403, detail="Organization membership required")

        item = ScanTemplate(created_by=user.id, **payload.model_dump())
        db.add(item)
        await db.commit()
        await db.refresh(item)

        await log_audit(db, "scan_templates", item.id, "INSERT", new_data=model_to_dict(item), user_id=user.id, organization_id=org_id)
        await db.commit()

        return ScanTemplateResponse(success=True, data=ScanTemplateDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating scan template: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{template_id}", response_model=ScanTemplateResponse)
async def update_scan_template(
    template_id: int,
    payload: ScanTemplateUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanTemplate)
            .join(ScanTarget, ScanTemplate.target_id == ScanTarget.id)
            .filter(ScanTemplate.id == template_id, ScanTarget.organization_id == org_id, ScanTemplate.deleted_at.is_(None))
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan template not found")

        old_data = model_to_dict(item)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        item.updated_by = user.id

        await db.commit()
        await db.refresh(item)

        await log_audit(db, "scan_templates", item.id, "UPDATE", old_data=old_data, new_data=model_to_dict(item), user_id=user.id, organization_id=org_id)
        await db.commit()

        return ScanTemplateResponse(success=True, data=ScanTemplateDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating scan template {template_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{template_id}", response_model=dict)
async def delete_scan_template(
    template_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanTemplate)
            .join(ScanTarget, ScanTemplate.target_id == ScanTarget.id)
            .filter(ScanTemplate.id == template_id, ScanTarget.organization_id == org_id, ScanTemplate.deleted_at.is_(None))
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan template not found")

        old_data = model_to_dict(item)
        from datetime import datetime, timezone
        item.deleted_at = datetime.now(timezone.utc)
        item.deleted_by = user.id
        await db.commit()

        await log_audit(db, "scan_templates", item.id, "DELETE", old_data=old_data, user_id=user.id, organization_id=org_id)
        await db.commit()

        return {"success": True, "message": "Scan template deleted"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting scan template {template_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
