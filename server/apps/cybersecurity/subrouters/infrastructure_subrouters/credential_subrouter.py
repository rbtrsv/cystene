"""
Credential Subrouter

CRUD endpoints for Credential model.
Security: encrypted_value is encrypted on create/update, never returned in responses.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models.infrastructure_models import Credential
from ...schemas.infrastructure_schemas.credential_schemas import (
    CredentialCreate, CredentialUpdate, CredentialDetail,
    CredentialResponse, CredentialsResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.encryption_utils import encrypt_value
from ...utils.audit_utils import log_audit, model_to_dict
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user
from core.db import get_session

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Credentials"])


# ==========================================
# LIST
# ==========================================

@router.get("/", response_model=CredentialsResponse)
async def list_credentials(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """List all credentials for the user's organization."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            return CredentialsResponse(success=True, data=[])

        result = await db.execute(
            select(Credential)
            .filter(Credential.organization_id == org_id, Credential.deleted_at.is_(None))
            .order_by(Credential.created_at.desc())
        )
        items = result.scalars().all()
        return CredentialsResponse(success=True, data=[CredentialDetail.model_validate(i) for i in items])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing credentials: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# DETAIL
# ==========================================

@router.get("/{credential_id}", response_model=CredentialResponse)
async def get_credential(
    credential_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Get a single credential by ID. encrypted_value is NOT returned."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(Credential).filter(
                Credential.id == credential_id,
                Credential.organization_id == org_id,
                Credential.deleted_at.is_(None),
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Credential not found")
        return CredentialResponse(success=True, data=CredentialDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting credential {credential_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# CREATE
# ==========================================

@router.post("/", response_model=CredentialResponse)
async def create_credential(
    payload: CredentialCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Create a new credential. encrypted_value is encrypted before storage."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            raise HTTPException(status_code=403, detail="Organization membership required")

        data = payload.model_dump()
        # Encrypt the secret value before storage
        data["encrypted_value"] = encrypt_value(data["encrypted_value"])

        item = Credential(
            organization_id=org_id,
            created_by=user.id,
            **data,
        )
        db.add(item)
        await db.commit()
        await db.refresh(item)

        await log_audit(db, "credentials", item.id, "INSERT", new_data=model_to_dict(item), user_id=user.id, organization_id=org_id)
        await db.commit()

        return CredentialResponse(success=True, data=CredentialDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating credential: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# UPDATE
# ==========================================

@router.put("/{credential_id}", response_model=CredentialResponse)
async def update_credential(
    credential_id: int,
    payload: CredentialUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Update a credential. If encrypted_value provided, it is re-encrypted."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(Credential).filter(
                Credential.id == credential_id,
                Credential.organization_id == org_id,
                Credential.deleted_at.is_(None),
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Credential not found")

        old_data = model_to_dict(item)
        update_data = payload.model_dump(exclude_unset=True)

        # Re-encrypt if new secret provided
        if "encrypted_value" in update_data and update_data["encrypted_value"]:
            update_data["encrypted_value"] = encrypt_value(update_data["encrypted_value"])

        for field, value in update_data.items():
            setattr(item, field, value)
        item.updated_by = user.id

        await db.commit()
        await db.refresh(item)

        await log_audit(db, "credentials", item.id, "UPDATE", old_data=old_data, new_data=model_to_dict(item), user_id=user.id, organization_id=org_id)
        await db.commit()

        return CredentialResponse(success=True, data=CredentialDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating credential {credential_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# DELETE (soft)
# ==========================================

@router.delete("/{credential_id}", response_model=dict)
async def delete_credential(
    credential_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Soft-delete a credential."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(Credential).filter(
                Credential.id == credential_id,
                Credential.organization_id == org_id,
                Credential.deleted_at.is_(None),
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Credential not found")

        old_data = model_to_dict(item)
        from datetime import datetime, timezone
        item.deleted_at = datetime.now(timezone.utc)
        item.deleted_by = user.id

        await db.commit()

        await log_audit(db, "credentials", item.id, "DELETE", old_data=old_data, user_id=user.id, organization_id=org_id)
        await db.commit()

        return {"success": True, "message": "Credential deleted"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting credential {credential_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
