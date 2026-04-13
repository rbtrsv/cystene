"""
Scan Target Subrouter

CRUD endpoints for ScanTarget model + target ownership verification stub.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models.infrastructure_models import ScanTarget
from ...schemas.infrastructure_schemas.scan_target_schemas import (
    ScanTargetCreate, ScanTargetUpdate, ScanTargetDetail,
    ScanTargetResponse, ScanTargetsResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.audit_utils import log_audit, model_to_dict
from ...utils.verification_utils import (
    generate_verification_token,
    verify_dns_txt,
    verify_file_upload,
    verify_meta_tag,
)
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user
from core.db import get_session

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Scan Targets"])


# ==========================================
# LIST
# ==========================================

@router.get("/", response_model=ScanTargetsResponse)
async def list_scan_targets(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """List all scan targets for the user's organization."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            return ScanTargetsResponse(success=True, data=[])

        result = await db.execute(
            select(ScanTarget)
            .filter(ScanTarget.organization_id == org_id, ScanTarget.deleted_at.is_(None))
            .order_by(ScanTarget.created_at.desc())
        )
        items = result.scalars().all()
        return ScanTargetsResponse(success=True, data=[ScanTargetDetail.model_validate(i) for i in items])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing scan targets: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# DETAIL
# ==========================================

@router.get("/{target_id}", response_model=ScanTargetResponse)
async def get_scan_target(
    target_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Get a single scan target by ID."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanTarget).filter(
                ScanTarget.id == target_id,
                ScanTarget.organization_id == org_id,
                ScanTarget.deleted_at.is_(None),
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan target not found")
        return ScanTargetResponse(success=True, data=ScanTargetDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting scan target {target_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# CREATE
# ==========================================

@router.post("/", response_model=ScanTargetResponse)
async def create_scan_target(
    payload: ScanTargetCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Create a new scan target."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            raise HTTPException(status_code=403, detail="Organization membership required")

        item = ScanTarget(
            user_id=user.id,
            organization_id=org_id,
            created_by=user.id,
            # Why auto-generate token: user needs it immediately to set up verification
            verification_token=generate_verification_token(),
            **payload.model_dump(),
        )
        db.add(item)
        await db.commit()
        await db.refresh(item)

        await log_audit(db, "scan_targets", item.id, "INSERT", new_data=model_to_dict(item), user_id=user.id, organization_id=org_id)
        await db.commit()

        return ScanTargetResponse(success=True, data=ScanTargetDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating scan target: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# UPDATE
# ==========================================

@router.put("/{target_id}", response_model=ScanTargetResponse)
async def update_scan_target(
    target_id: int,
    payload: ScanTargetUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Update a scan target."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanTarget).filter(
                ScanTarget.id == target_id,
                ScanTarget.organization_id == org_id,
                ScanTarget.deleted_at.is_(None),
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan target not found")

        old_data = model_to_dict(item)
        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(item, field, value)
        item.updated_by = user.id

        await db.commit()
        await db.refresh(item)

        await log_audit(db, "scan_targets", item.id, "UPDATE", old_data=old_data, new_data=model_to_dict(item), user_id=user.id, organization_id=org_id)
        await db.commit()

        return ScanTargetResponse(success=True, data=ScanTargetDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating scan target {target_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# DELETE (soft)
# ==========================================

@router.delete("/{target_id}", response_model=dict)
async def delete_scan_target(
    target_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Soft-delete a scan target."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanTarget).filter(
                ScanTarget.id == target_id,
                ScanTarget.organization_id == org_id,
                ScanTarget.deleted_at.is_(None),
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan target not found")

        old_data = model_to_dict(item)
        from datetime import datetime, timezone
        item.deleted_at = datetime.now(timezone.utc)
        item.deleted_by = user.id

        await db.commit()

        await log_audit(db, "scan_targets", item.id, "DELETE", old_data=old_data, user_id=user.id, organization_id=org_id)
        await db.commit()

        return {"success": True, "message": "Scan target deleted"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting scan target {target_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# VERIFY OWNERSHIP
# ==========================================

@router.post("/{target_id}/verify", response_model=dict)
async def verify_scan_target(
    target_id: int,
    verification_method: str = "dns_txt",
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Verify target ownership using one of 3 methods: dns_txt, file_upload, meta_tag.

    Prerequisites:
    - Target must have a verification_token (auto-generated at create time)
    - User must have set up the verification proof (DNS record, file, or meta tag)

    IP/IP_range targets are auto-verified (no DNS/HTTP verification possible).
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanTarget).filter(
                ScanTarget.id == target_id,
                ScanTarget.organization_id == org_id,
                ScanTarget.deleted_at.is_(None),
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan target not found")

        # Already verified — no need to re-verify
        if item.is_verified:
            return {"success": True, "message": "Target is already verified", "is_verified": True}

        # IP targets — auto-verify (no DNS/HTTP check possible)
        # Why: IP addresses have no DNS TXT records or web pages to verify against.
        # User attests ownership when creating the target.
        if item.target_type in ("ip", "ip_range"):
            item.is_verified = True
            item.verification_method = "auto_ip"
            await db.commit()
            await db.refresh(item)

            await log_audit(db, "scan_targets", item.id, "UPDATE",
                old_data={"is_verified": False},
                new_data={"is_verified": True, "verification_method": "auto_ip"},
                user_id=user.id, organization_id=org_id)
            await db.commit()

            return {"success": True, "message": "IP target auto-verified", "is_verified": True}

        # Ensure token exists
        if not item.verification_token:
            item.verification_token = generate_verification_token()
            await db.commit()
            await db.refresh(item)

        # Validate verification method
        if verification_method not in ("dns_txt", "file_upload", "meta_tag"):
            raise HTTPException(status_code=400, detail="Invalid verification method. Use: dns_txt, file_upload, or meta_tag")

        # Extract domain from target_value
        # Why: target_value might be "https://example.com/path" — we need just "example.com"
        domain = item.target_value
        if domain.startswith("http://"):
            domain = domain[7:]
        elif domain.startswith("https://"):
            domain = domain[8:]
        domain = domain.split("/")[0].split(":")[0]  # Remove path and port

        # Run the verification check
        verified = False
        if verification_method == "dns_txt":
            verified = await verify_dns_txt(domain, item.verification_token)
        elif verification_method == "file_upload":
            verified = await verify_file_upload(item.target_value, item.verification_token)
        elif verification_method == "meta_tag":
            verified = await verify_meta_tag(item.target_value, item.verification_token)

        if verified:
            item.is_verified = True
            item.verification_method = verification_method
            await db.commit()
            await db.refresh(item)

            await log_audit(db, "scan_targets", item.id, "UPDATE",
                old_data={"is_verified": False},
                new_data={"is_verified": True, "verification_method": verification_method},
                user_id=user.id, organization_id=org_id)
            await db.commit()

            return {"success": True, "message": f"Target verified via {verification_method}", "is_verified": True}

        # Verification failed — return instructions
        instructions = {
            "dns_txt": f"Add a TXT record to {domain} with value: {item.verification_token}",
            "file_upload": f"Create a file at https://{domain}/.well-known/cystene-verify.txt containing: {item.verification_token}",
            "meta_tag": f'Add to your homepage <head>: <meta name="cystene-verify" content="{item.verification_token}">',
        }

        return {
            "success": False,
            "message": f"Verification failed via {verification_method}",
            "is_verified": False,
            "instructions": instructions.get(verification_method, ""),
            "token": item.verification_token,
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error verifying scan target {target_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# GENERATE NEW TOKEN
# ==========================================

@router.post("/{target_id}/generate-token", response_model=dict)
async def generate_new_token(
    target_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Regenerate the verification token for a scan target.

    Why: user might want a fresh token if the old one was exposed or if they
    need to re-verify after target_value changes.
    Resets is_verified to False since the old proof is invalid.
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanTarget).filter(
                ScanTarget.id == target_id,
                ScanTarget.organization_id == org_id,
                ScanTarget.deleted_at.is_(None),
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan target not found")

        old_data = model_to_dict(item)

        # Why reset is_verified: old token proof is no longer valid
        item.verification_token = generate_verification_token()
        item.is_verified = False
        item.verification_method = None

        await db.commit()
        await db.refresh(item)

        await log_audit(db, "scan_targets", item.id, "UPDATE",
            old_data=old_data, new_data=model_to_dict(item),
            user_id=user.id, organization_id=org_id)
        await db.commit()

        return {
            "success": True,
            "message": "New verification token generated",
            "token": item.verification_token,
            "is_verified": False,
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error generating token for scan target {target_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
