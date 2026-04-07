"""
Scan Job Subrouter

Endpoints for scan job management: start scan, cancel, list, detail.
No create/update — jobs are created via POST /start and are immutable once started.

The dispatcher (run_scan_job) is a background task that:
1. Reads template + target + credential from DB
2. Builds params dict per scanner type
3. Runs scanners via asyncio.gather (parallel, partial results on failure)
4. Writes findings + assets to DB
5. Updates job status + summary counts + security_score

References:
- domain-architecture.md §4.4 (scanner dispatch pattern)
- 0_order.md §3M (dispatcher requirements)
"""

import asyncio
import json
import logging
import os
import tempfile
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from ...models.execution_models import ScanJob, ScanTemplate
from ...models.infrastructure_models import ScanTarget, Credential
from ...models.discovery_models import Finding, Asset
from ...schemas.execution_schemas.scan_job_schemas import (
    ScanJobDetail, ScanJobResponse, ScanJobsResponse,
)
from ...scanners import SCANNERS
from ...utils.dependency_utils import get_user_organization_id
from ...utils.encryption_utils import decrypt_value
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user
from core.db import get_session, async_session

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Scan Jobs"])


# ==========================================
# SCANNER TYPES THAT REQUIRE CREDENTIALS
# ==========================================

# Why explicit set: The dispatcher must know which scanners need a Credential entity
# so it can block execution early (before wasting time on other scanners) if no
# credential is configured on the template.
CREDENTIAL_SCANNERS = {"host_audit", "cloud_audit", "ad_audit"}

# Why explicit set: active_web_scan sends payloads to the target (SQLi probes, XSS
# markers). Legal requirement to get explicit consent before running.
CONSENT_SCANNERS = {"active_web_scan"}


# ==========================================
# CREDENTIAL → PARAMS MAPPING
# ==========================================

def build_credential_params(credential: Credential, cred_type: str, decrypted_value: str) -> dict:
    """
    Build scanner-specific params from a Credential entity.

    Each scanner type expects different param keys. This function maps
    Credential fields to the params dict each scanner's run() expects.

    Why centralized: Keeps the mapping in one place instead of scattered
    across each scanner. If a scanner's expected params change, fix it here.

    Args:
        credential: The Credential model instance
        cred_type: credential.cred_type string
        decrypted_value: The decrypted secret (password, API key, SSH key)

    Returns:
        dict of scanner-specific params
    """
    # Parse extra_metadata JSON if present
    # Why: extra_metadata stores connection details like port, region, domain, dc_host
    extra = {}
    if credential.extra_metadata:
        try:
            extra = json.loads(credential.extra_metadata)
        except (json.JSONDecodeError, TypeError):
            pass

    # SSH-based scanners (host_audit)
    # host_audit_scan.py expects: ssh_host, ssh_port, ssh_username, ssh_password
    if cred_type in ("ssh_password", "ssh_key"):
        return {
            "ssh_username": credential.username,
            "ssh_password": decrypted_value,
            "ssh_port": extra.get("port", 22),
        }

    # Cloud API key scanners (cloud_audit)
    # cloud_audit_scan.py expects: aws_access_key_id, aws_secret_access_key, aws_region
    if cred_type == "api_key":
        return {
            "aws_access_key_id": credential.username,  # AWS Access Key ID stored in username
            "aws_secret_access_key": decrypted_value,
            "aws_region": extra.get("region", "us-east-1"),
        }

    # Domain credential scanners (ad_audit)
    # ad_audit_scan.py expects: domain, dc_host, username, password, use_ssl
    if cred_type == "domain_credentials":
        return {
            "domain": extra.get("domain"),
            "dc_host": extra.get("dc_host"),
            "username": credential.username,  # "CORP\\auditor" or "auditor@corp.example.com"
            "password": decrypted_value,
            "use_ssl": extra.get("use_ssl", True),
        }

    # Service account (GCP JSON key, etc.) — future expansion
    if cred_type == "service_account":
        return {
            "service_account_json": decrypted_value,
        }

    return {}


# ==========================================
# SECURITY SCORE CALCULATION
# ==========================================

def compute_security_score(findings: list[dict]) -> int:
    """
    Compute a 0-100 security score based on finding severities.

    Why this formula: Executives need one number for board reporting.
    Start at 100, subtract penalties per finding severity.
    Critical findings have the most impact because they represent
    immediate exploitability.

    Penalties per finding:
    - critical: -15 (immediate exploitability, e.g. public S3, Kerberoastable admin)
    - high: -10 (significant risk, e.g. open SSH, missing MFA)
    - medium: -5 (moderate risk, e.g. weak password policy)
    - low: -2 (minor risk, e.g. info disclosure)
    - info: 0 (informational, no penalty)

    Floor at 0 — score cannot go negative.
    """
    score = 100
    for finding in findings:
        severity = finding.get("severity", "info")
        if severity == "critical":
            score -= 15
        elif severity == "high":
            score -= 10
        elif severity == "medium":
            score -= 5
        elif severity == "low":
            score -= 2
        # info: no penalty
    return max(score, 0)


# ==========================================
# APK DOWNLOAD (for mobile_scan via URL)
# ==========================================

async def download_apk(url: str) -> str | None:
    """
    Download an APK from a URL to a temporary file.

    Why: mobile_scan supports both direct upload (apk_file_path already on disk)
    and URL download (user provides a link, we fetch it first).

    Args:
        url: URL to download the APK from

    Returns:
        Path to the downloaded temp file, or None on failure
    """
    import httpx

    try:
        async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()

            # Write to temp file with .apk extension
            # Why named temp file: mobile_scan needs a file path on disk.
            # Why delete=False: we pass the path to the scanner, it reads later.
            # Cleanup happens in the dispatcher's finally block.
            fd, path = tempfile.mkstemp(suffix=".apk")
            with os.fdopen(fd, "wb") as f:
                f.write(response.content)

            logger.info(f"APK downloaded: {url} → {path} ({len(response.content)} bytes)")
            return path

    except Exception as e:
        logger.error(f"APK download failed: {url} — {e}")
        return None


# ==========================================
# SCANNER DISPATCHER (background task)
# ==========================================

async def run_scan_job(job_id: int):
    """
    Background task that executes all scanners for a ScanJob.

    This function runs OUTSIDE the request lifecycle — the HTTP response is already
    sent by the time this runs. It uses its own DB session (not the request session).

    Flow:
    1. Read job + template + target + credential from DB
    2. Set status = "running"
    3. Build params dict from template fields + credential
    4. Run scanners via asyncio.gather (parallel, return_exceptions=True)
    5. Deduplicate findings via fingerprint (is_new, first_found_job_id)
    6. Bulk insert Finding + Asset rows
    7. Update job summary counts + security_score
    8. Set status = "completed" (or "failed" if all scanners errored)

    Why own session: The request session closes after the HTTP response is sent.
    Background tasks need their own session. Pattern from ecommerce sync scheduler.

    Why return_exceptions=True: If one scanner crashes, the others still return
    results. Partial scan results are better than no results.

    Args:
        job_id: ID of the ScanJob to execute
    """
    # Why temp_apk_path tracked here: if we download an APK from URL, we need
    # to clean it up after the scan regardless of success/failure.
    temp_apk_path = None

    async with async_session() as db:
        try:
            # ==========================================
            # 1. Load job + template + target + credential
            # ==========================================

            job = await db.get(ScanJob, job_id)
            if not job:
                logger.error(f"Scan job {job_id} not found")
                return

            # Why check status: Job may have been cancelled between creation and task execution
            if job.status != "pending":
                logger.info(f"Scan job {job_id} is {job.status}, skipping")
                return

            template = await db.get(ScanTemplate, job.template_id)
            if not template:
                job.status = "failed"
                job.error_message = "Scan template not found"
                await db.commit()
                return

            target = await db.get(ScanTarget, job.target_id)
            if not target:
                job.status = "failed"
                job.error_message = "Scan target not found"
                await db.commit()
                return

            # Load credential if template has one
            # Why: Internal scanners (host_audit, cloud_audit, ad_audit) need decrypted
            # credentials passed in params. External scanners ignore credentials.
            credential = None
            decrypted_secret = None
            if template.credential_id:
                credential = await db.get(Credential, template.credential_id)
                if credential:
                    decrypted_secret = decrypt_value(credential.encrypted_value)

            # ==========================================
            # 2. Set status = "running"
            # ==========================================

            job.status = "running"
            job.started_at = datetime.now(timezone.utc)
            await db.commit()

            # ==========================================
            # 3. Parse scan types + build params
            # ==========================================

            scan_types = [s.strip() for s in template.scan_types.split(",") if s.strip()]
            all_findings = []
            all_assets = []
            all_errors = []

            # Build base params from template fields
            # Why: Each scanner receives a params dict with template configuration.
            # Scanners pick what they need and ignore the rest.
            base_params = {
                "port_range": template.port_range,
                "scan_speed": template.scan_speed,
                "follow_redirects": template.follow_redirects,
                "max_depth": template.max_depth,
                "check_headers": template.check_headers,
                "dns_brute_force": template.dns_brute_force,
                "dns_wordlist": template.dns_wordlist,
                "timeout_seconds": template.timeout_seconds,
                "max_concurrent": template.max_concurrent,
                "active_scan_consent": template.active_scan_consent,
            }

            # Merge engine_params JSON if present
            # Why: Custom per-scanner overrides (custom wordlists, headers, etc.)
            if template.engine_params:
                try:
                    engine_extra = json.loads(template.engine_params)
                    base_params.update(engine_extra)
                except (json.JSONDecodeError, TypeError):
                    pass

            # Merge credential params if credential exists
            if credential and decrypted_secret:
                cred_params = build_credential_params(credential, credential.cred_type, decrypted_secret)
                base_params.update(cred_params)

            # ==========================================
            # 4. Validate scan types + build tasks
            # ==========================================

            async def run_single_scanner(scan_type: str) -> dict:
                """
                Run a single scanner with validation checks.

                Why wrapped: Each scanner needs pre-flight checks (consent, credential)
                before execution. Wrapping in a function lets asyncio.gather run them
                in parallel while each one handles its own validation.
                """
                # Check scanner exists in registry
                if scan_type not in SCANNERS:
                    return {"findings": [], "assets": [], "errors": [f"Unknown scan type: {scan_type}"], "duration_seconds": 0}

                # Check active_scan_consent for injection scanners
                if scan_type in CONSENT_SCANNERS and not template.active_scan_consent:
                    return {"findings": [], "assets": [], "errors": [f"Scan type '{scan_type}' requires active_scan_consent=True on template"], "duration_seconds": 0}

                # Check credential exists for internal scanners
                if scan_type in CREDENTIAL_SCANNERS and not credential:
                    return {"findings": [], "assets": [], "errors": [f"Scan type '{scan_type}' requires a Credential on the template"], "duration_seconds": 0}

                # Handle mobile_scan APK download from URL
                # Why nonlocal: we need to track the temp file path for cleanup in the outer scope
                nonlocal temp_apk_path
                scanner_params = dict(base_params)
                if scan_type == "mobile_scan":
                    # If no apk_file_path but apk_url exists, download first
                    if not scanner_params.get("apk_file_path") and scanner_params.get("apk_url"):
                        downloaded = await download_apk(scanner_params["apk_url"])
                        if not downloaded:
                            return {"findings": [], "assets": [], "errors": ["Failed to download APK from URL"], "duration_seconds": 0}
                        scanner_params["apk_file_path"] = downloaded
                        temp_apk_path = downloaded

                # Determine target value
                # Why: host_audit uses SSH host from credential params, cloud_audit/ad_audit
                # don't use network target. External scanners use target.target_value.
                scan_target = target.target_value
                if scan_type == "host_audit":
                    # SSH host can come from credential extra_metadata or target
                    scan_target = scanner_params.get("ssh_host") or target.target_value
                    scanner_params["ssh_host"] = scan_target

                scanner_fn = SCANNERS[scan_type]
                return await scanner_fn(scan_target, scanner_params)

            # ==========================================
            # 5. Run scanners in parallel
            # ==========================================

            # Why asyncio.gather with return_exceptions=True: If one scanner crashes
            # (unhandled exception), the others still complete. We get partial results
            # instead of losing everything.
            tasks = [run_single_scanner(st) for st in scan_types]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # ==========================================
            # 6. Collect results
            # ==========================================

            for i, result in enumerate(results):
                scan_type = scan_types[i]

                if isinstance(result, Exception):
                    # Scanner crashed with unhandled exception
                    logger.error(f"Scanner '{scan_type}' crashed: {result}")
                    all_errors.append(f"Scanner '{scan_type}' crashed: {result}")
                    continue

                if not isinstance(result, dict):
                    all_errors.append(f"Scanner '{scan_type}' returned invalid result type: {type(result)}")
                    continue

                all_findings.extend(result.get("findings", []))
                all_assets.extend(result.get("assets", []))
                all_errors.extend(result.get("errors", []))

            # ==========================================
            # 7. Fingerprint deduplication
            # ==========================================

            # Why: If the same vulnerability was found in a previous scan for this target,
            # mark it as is_new=False and link to the first scan that found it.
            # This prevents duplicate noise in the dashboard.

            # Get all existing fingerprints for this target (from previous jobs)
            existing_fps_query = (
                select(Finding.fingerprint, Finding.scan_job_id)
                .join(ScanJob, Finding.scan_job_id == ScanJob.id)
                .where(and_(
                    ScanJob.target_id == target.id,
                    ScanJob.id != job_id,
                ))
            )
            existing_result = await db.execute(existing_fps_query)
            # Map fingerprint → first job that found it
            # Why min: if a fingerprint appears in multiple old jobs, we want the earliest one
            existing_fps = {}
            for fp, old_job_id in existing_result.all():
                if fp not in existing_fps or old_job_id < existing_fps[fp]:
                    existing_fps[fp] = old_job_id

            # ==========================================
            # 8. Write findings to DB
            # ==========================================

            severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}

            for finding_dict in all_findings:
                fingerprint = finding_dict.get("fingerprint", "")

                # Determine if this finding is new or recurring
                is_new = fingerprint not in existing_fps
                first_found_job_id = existing_fps.get(fingerprint, job_id)

                finding = Finding(
                    scan_job_id=job_id,
                    fingerprint=fingerprint,
                    is_new=is_new,
                    first_found_job_id=first_found_job_id,
                    severity=finding_dict.get("severity", "info"),
                    category=finding_dict.get("category", "configuration_error"),
                    finding_type=finding_dict.get("finding_type", "unknown"),
                    title=finding_dict.get("title", "Untitled finding"),
                    description=finding_dict.get("description", ""),
                    remediation=finding_dict.get("remediation"),
                    remediation_script=finding_dict.get("remediation_script"),
                    evidence=finding_dict.get("evidence"),
                    host=finding_dict.get("host"),
                    port=finding_dict.get("port"),
                    protocol=finding_dict.get("protocol"),
                    url=finding_dict.get("url"),
                    cve_id=finding_dict.get("cve_id"),
                    cvss_score=finding_dict.get("cvss_score"),
                    cwe_id=finding_dict.get("cwe_id"),
                    owasp_category=finding_dict.get("owasp_category"),
                    mitre_tactic=finding_dict.get("mitre_tactic"),
                    mitre_technique=finding_dict.get("mitre_technique"),
                    status=finding_dict.get("status", "open"),
                )
                db.add(finding)

                # Count severities
                sev = finding_dict.get("severity", "info")
                if sev in severity_counts:
                    severity_counts[sev] += 1

            # ==========================================
            # 9. Write assets to DB
            # ==========================================

            for asset_dict in all_assets:
                asset = Asset(
                    scan_job_id=job_id,
                    asset_type=asset_dict.get("asset_type", "technology"),
                    value=asset_dict.get("value", "unknown"),
                    host=asset_dict.get("host"),
                    port=asset_dict.get("port"),
                    protocol=asset_dict.get("protocol"),
                    service_name=asset_dict.get("service_name"),
                    service_version=asset_dict.get("service_version"),
                    banner=asset_dict.get("banner"),
                    service_metadata=asset_dict.get("service_metadata"),
                    confidence=asset_dict.get("confidence", "confirmed"),
                )
                db.add(asset)

            # ==========================================
            # 10. Update job summary + complete
            # ==========================================

            job.status = "completed"
            job.completed_at = datetime.now(timezone.utc)
            job.duration_seconds = int((job.completed_at - job.started_at).total_seconds()) if job.started_at else 0
            job.total_findings = len(all_findings)
            job.critical_count = severity_counts["critical"]
            job.high_count = severity_counts["high"]
            job.medium_count = severity_counts["medium"]
            job.low_count = severity_counts["low"]
            job.info_count = severity_counts["info"]
            job.total_assets = len(all_assets)
            job.security_score = compute_security_score(all_findings)

            # Store errors in error_message (truncated to 5000 chars)
            if all_errors:
                job.error_message = "\n".join(all_errors)[:5000]

            await db.commit()
            logger.info(
                f"Scan job {job_id} completed: "
                f"findings={len(all_findings)}, assets={len(all_assets)}, "
                f"errors={len(all_errors)}, score={job.security_score}, "
                f"duration={job.duration_seconds}s"
            )

        except Exception as e:
            # Catch-all: mark job as failed so it doesn't stay "running" forever
            logger.error(f"Scan job {job_id} failed with unhandled error: {e}")
            try:
                job = await db.get(ScanJob, job_id)
                if job and job.status == "running":
                    job.status = "failed"
                    job.completed_at = datetime.now(timezone.utc)
                    job.error_message = f"Dispatcher error: {str(e)[:500]}"
                    await db.commit()
            except Exception as inner_e:
                logger.error(f"Failed to update job {job_id} status to failed: {inner_e}")

        finally:
            # Clean up temp APK file if we downloaded one
            if temp_apk_path and os.path.exists(temp_apk_path):
                try:
                    os.remove(temp_apk_path)
                    logger.debug(f"Cleaned up temp APK: {temp_apk_path}")
                except OSError:
                    pass


# ==========================================
# LIST
# ==========================================

@router.get("/", response_model=ScanJobsResponse)
async def list_scan_jobs(
    target_id: int | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """List scan jobs. Optionally filter by target_id."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            return ScanJobsResponse(success=True, data=[])

        query = (
            select(ScanJob)
            .join(ScanTarget, ScanJob.target_id == ScanTarget.id)
            .filter(ScanTarget.organization_id == org_id, ScanJob.deleted_at.is_(None))
        )
        if target_id:
            query = query.filter(ScanJob.target_id == target_id)
        query = query.order_by(ScanJob.created_at.desc())

        result = await db.execute(query)
        items = result.scalars().all()
        return ScanJobsResponse(success=True, data=[ScanJobDetail.model_validate(i) for i in items])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing scan jobs: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# DETAIL
# ==========================================

@router.get("/{job_id}", response_model=ScanJobResponse)
async def get_scan_job(
    job_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanJob)
            .join(ScanTarget, ScanJob.target_id == ScanTarget.id)
            .filter(ScanJob.id == job_id, ScanTarget.organization_id == org_id, ScanJob.deleted_at.is_(None))
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Scan job not found")
        return ScanJobResponse(success=True, data=ScanJobDetail.model_validate(item))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting scan job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# START SCAN
# ==========================================

@router.post("/start", response_model=ScanJobResponse)
async def start_scan(
    target_id: int,
    template_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Start a new scan. Creates ScanJob with status=pending, launches scanner
    dispatcher as background task, returns immediately.

    The scan runs in the background — poll GET /{job_id} for status updates.
    Status transitions: pending → running → completed (or failed/cancelled).
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        if not org_id:
            raise HTTPException(status_code=403, detail="Organization membership required")

        # Verify target ownership
        target = await db.execute(
            select(ScanTarget).filter(ScanTarget.id == target_id, ScanTarget.organization_id == org_id, ScanTarget.deleted_at.is_(None))
        )
        target = target.scalar_one_or_none()
        if not target:
            raise HTTPException(status_code=404, detail="Scan target not found")

        # Verify template belongs to target
        template = await db.execute(
            select(ScanTemplate).filter(ScanTemplate.id == template_id, ScanTemplate.target_id == target_id, ScanTemplate.deleted_at.is_(None))
        )
        template = template.scalar_one_or_none()
        if not template:
            raise HTTPException(status_code=404, detail="Scan template not found")

        # Create job with pending status
        job = ScanJob(
            target_id=target_id,
            template_id=template_id,
            status="pending",
            scan_types_run=template.scan_types,
            created_by=user.id,
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)

        # Launch scanner dispatcher as background task
        # Why asyncio.create_task: Returns immediately so the HTTP response is sent.
        # The scan runs asynchronously — frontend polls for status.
        asyncio.create_task(run_scan_job(job.id))

        return ScanJobResponse(success=True, data=ScanJobDetail.model_validate(job))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error starting scan: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# CANCEL
# ==========================================

@router.post("/{job_id}/cancel", response_model=ScanJobResponse)
async def cancel_scan(
    job_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Cancel a running or pending scan job."""
    try:
        org_id = await get_user_organization_id(user.id, db)
        result = await db.execute(
            select(ScanJob)
            .join(ScanTarget, ScanJob.target_id == ScanTarget.id)
            .filter(ScanJob.id == job_id, ScanTarget.organization_id == org_id)
        )
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Scan job not found")

        if job.status not in ("pending", "running"):
            raise HTTPException(status_code=400, detail=f"Cannot cancel job with status '{job.status}'")

        job.status = "cancelled"
        job.updated_by = user.id
        await db.commit()
        await db.refresh(job)

        return ScanJobResponse(success=True, data=ScanJobDetail.model_validate(job))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error cancelling scan job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
