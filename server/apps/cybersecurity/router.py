"""
Cybersecurity Router

Main router for the cybersecurity module. Mounts all subrouters with subscription gating.

Pattern: ecommerce router (ungated + gated split).
All cybersecurity endpoints are gated behind active subscription + rate limiting.
No ungated routes needed (no OAuth callbacks, no webhook receivers, no public widgets).
"""

from fastapi import APIRouter, Depends

from .utils.dependency_utils import require_active_subscription

# Infrastructure subrouters
from .subrouters.infrastructure_subrouters.infrastructure_subrouter import router as infrastructure_router
from .subrouters.infrastructure_subrouters.credential_subrouter import router as credential_router
from .subrouters.infrastructure_subrouters.scan_target_subrouter import router as scan_target_router

# Execution subrouters
from .subrouters.execution_subrouters.scan_template_subrouter import router as scan_template_router
from .subrouters.execution_subrouters.scan_schedule_subrouter import router as scan_schedule_router
from .subrouters.execution_subrouters.scan_job_subrouter import router as scan_job_router

# Discovery subrouters
from .subrouters.discovery_subrouters.finding_subrouter import router as finding_router
from .subrouters.discovery_subrouters.asset_subrouter import router as asset_router
from .subrouters.discovery_subrouters.report_subrouter import router as report_router
from .subrouters.discovery_subrouters.dashboard_subrouter import router as dashboard_router


router = APIRouter(prefix="/cybersecurity")

# All endpoints gated behind active subscription
# Why no enforce_rate_limit here: Rate limiting is applied per-endpoint on write operations
# (POST /start, POST /generate, etc.) not on all requests including GET.
# Pattern: assetmanager rate_limiter.check() per-endpoint, not router-level.
gated = APIRouter(dependencies=[Depends(require_active_subscription)])

# Infrastructure domain
gated.include_router(infrastructure_router, prefix="/infrastructure")
gated.include_router(credential_router, prefix="/credentials")
gated.include_router(scan_target_router, prefix="/scan-targets")

# Execution domain
gated.include_router(scan_template_router, prefix="/scan-templates")
gated.include_router(scan_schedule_router, prefix="/scan-schedules")
gated.include_router(scan_job_router, prefix="/scan-jobs")

# Discovery domain
gated.include_router(finding_router, prefix="/findings")
gated.include_router(asset_router, prefix="/assets")
gated.include_router(report_router, prefix="/reports")
gated.include_router(dashboard_router, prefix="/dashboard")

router.include_router(gated)
