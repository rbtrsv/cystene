"""
Mobile Scan Subrouter — APK upload + ephemeral analysis

Dedicated flow for mobile_scan, which is NOT a network-target scanner: the user
uploads an APK file, we analyze it server-side, return the findings, and delete the
file immediately. No ScanJob, no Finding rows, no persistence — same "upload, scan,
delete immediately" principle as domain-architecture.md (Lesson 8).

Why separate from scan-jobs: a ScanJob requires a network target_id + template_id.
An APK has no network target, so mobile scanning lives on its own endpoint + page.
"""

import logging
import os
import tempfile

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException

from ...scanners.upload import mobile_scan
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Mobile Scan"])

# Reject oversized uploads before touching disk (mobile_scan also re-checks).
MAX_UPLOAD_BYTES = 200 * 1024 * 1024  # 200 MB


# ==========================================
# POST /scan — upload an APK, analyze it, return findings (ephemeral)
# ==========================================

@router.post("/scan")
async def scan_mobile_app(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    """
    Analyze an uploaded APK and return findings immediately.

    Steps:
    1. Read the uploaded APK into a temp file on disk (mobile_scan needs a path).
    2. Run mobile_scan against it (manifest, permissions, hardcoded creds, weak crypto…).
    3. Delete the temp file — we never store user APKs.
    4. Return { success, data: { findings, assets, errors, duration_seconds } }.
    """
    if not file.filename or not file.filename.lower().endswith(".apk"):
        raise HTTPException(status_code=400, detail="Please upload an .apk file")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="APK too large (max 200 MB)")

    # Why named temp file with .apk suffix: mobile_scan reads from a path on disk.
    fd, apk_path = tempfile.mkstemp(suffix=".apk")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(content)

        logger.info(f"Mobile scan (upload) by user {user.id}: {file.filename} ({len(content)} bytes)")
        # target is ignored by mobile_scan — the APK at apk_file_path IS the target.
        result = await mobile_scan.run("", {"apk_file_path": apk_path})

        return {"success": True, "data": result, "error": None}
    finally:
        # Delete immediately — no permanent storage of uploaded APKs.
        try:
            os.remove(apk_path)
        except OSError:
            pass
