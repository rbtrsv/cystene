"""
Cybersecurity Subscription Utilities

Tier-based system with scan credits. Each subscription tier unlocks more targets,
scan credits per month, and access to internal scanners.

Tier model:
- FREE: 1 target, 20 scans/month, external scanners only, 10 req/min
- PRO: 10 targets, 500 scans/month, + internal scanners + mobile, 60 req/min
- ENTERPRISE: unlimited targets, 5000 scans/month, all scanners, 300 req/min

Scan credit: 1 scanner execution = 1 credit. A job with 3 scan_types = 3 credits.
Monthly reset on 1st of each month.

Stripe Dashboard setup for Cystene (one-time config):
    1. Products → Create 2 products:
       - "Cystene Pro" → $49/month recurring
         Metadata: tier=PRO, tier_order=1
         features=10 targets,500 scans/mo,Internal scanners,Compliance reports
       - "Cystene Enterprise" → $199/month recurring
         Metadata: tier=ENTERPRISE, tier_order=2
         features=Unlimited targets,5000 scans/mo,All scanners,All reports
    2. Webhook: already configured in accounts
    3. Customer Portal: enable plan switching + proration + cancellation

    Note: Local dev (test mode) and Coolify (live mode) share the same database.
    If you subscribe on local, the Subscription record gets sandbox Stripe IDs.
    Live checkout/portal will fail for that org because those IDs don't exist on
    live Stripe. Fix: DELETE FROM subscriptions WHERE organization_id = <id>;
    then re-subscribe through the live app. Or create a new organization
    (no subscription record) and test live checkout on that one.

FREE tier has no Stripe product — it's the default when no subscription exists.

These are pure helpers — not FastAPI dependencies. The dependency that
uses them lives in dependency_utils.py (require_active_subscription, enforce_scan_credit_limit).
"""

import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.execution_models import ScanJob
from ..models.infrastructure_models import ScanTarget
from apps.accounts.models import Subscription

logger = logging.getLogger(__name__)


# ==========================================
# Constants
# ==========================================

# Subscription tiers from lowest to highest — index-based comparison.
# FREE is implicit (no subscription record needed).
# PRO/ENTERPRISE match Stripe product metadata "tier" values.
TIER_ORDER = ["FREE", "PRO", "ENTERPRISE", "CUSTOM"]

# Days after subscription cancellation before service is fully disabled.
# During grace period: full access (reads + writes + scans).
# After grace period: all cybersecurity endpoints return 403.
GRACE_PERIOD_DAYS = 7

# Tier limits — targets, scan credits, scanners, schedules, reports, rate limits
TIER_LIMITS = {
    "FREE": {
        "monthly_scan_credits": 20,
        "max_infrastructure": 1,
        "max_targets": 1,
        "max_credentials": 0,
        "max_schedules": 0,
        "requests_per_minute": 10,
        "requests_per_hour": 200,
        "allowed_scan_types": [
            "port_scan", "dns_enum", "ssl_check", "web_scan",
            "vuln_scan", "api_scan", "active_web_scan", "password_audit",
        ],
        "allowed_report_types": ["full"],
        "allowed_schedule_frequencies": [],
    },
    "PRO": {
        "monthly_scan_credits": 500,
        "max_infrastructure": 10,
        "max_targets": 10,
        "max_credentials": 10,
        "max_schedules": 10,
        "requests_per_minute": 60,
        "requests_per_hour": 2000,
        "allowed_scan_types": [
            "port_scan", "dns_enum", "ssl_check", "web_scan",
            "vuln_scan", "api_scan", "active_web_scan", "password_audit",
            "host_audit", "cloud_audit", "mobile_scan",
        ],
        "allowed_report_types": ["full", "compliance"],
        "allowed_schedule_frequencies": ["daily", "weekly", "monthly"],
    },
    "ENTERPRISE": {
        "monthly_scan_credits": 5000,
        "max_infrastructure": -1,       # Unlimited
        "max_targets": -1,              # Unlimited
        "max_credentials": -1,          # Unlimited
        "max_schedules": -1,            # Unlimited
        "requests_per_minute": 300,
        "requests_per_hour": 10000,
        "allowed_scan_types": [
            "port_scan", "dns_enum", "ssl_check", "web_scan",
            "vuln_scan", "api_scan", "active_web_scan", "password_audit",
            "host_audit", "cloud_audit", "ad_audit", "mobile_scan",
        ],
        "allowed_report_types": ["full", "compliance", "executive_summary", "delta"],
        "allowed_schedule_frequencies": ["hourly", "daily", "weekly", "monthly"],
    },
    "CUSTOM": {
        "monthly_scan_credits": -1,     # Unlimited
        "max_infrastructure": -1,
        "max_targets": -1,
        "max_credentials": -1,
        "max_schedules": -1,
        "requests_per_minute": 300,
        "requests_per_hour": 10000,
        "allowed_scan_types": [
            "port_scan", "dns_enum", "ssl_check", "web_scan",
            "vuln_scan", "api_scan", "active_web_scan", "password_audit",
            "host_audit", "cloud_audit", "ad_audit", "mobile_scan",
        ],
        "allowed_report_types": ["full", "compliance", "executive_summary", "delta"],
        "allowed_schedule_frequencies": ["hourly", "daily", "weekly", "monthly"],
    },
}


# ==========================================
# Query Helpers
# ==========================================

async def get_org_subscription(org_id: int, session: AsyncSession) -> Subscription | None:
    """
    Get the organization's subscription record.

    Args:
        org_id: Organization ID
        session: Database session

    Returns:
        Subscription or None
    """
    result = await session.execute(
        select(Subscription).filter(Subscription.organization_id == org_id)
    )
    return result.scalar_one_or_none()


async def get_org_target_count(org_id: int, session: AsyncSession) -> int:
    """
    Count non-deleted scan targets owned by an organization.

    Args:
        org_id: Organization ID
        session: Database session

    Returns:
        Number of active (non-deleted) scan targets
    """
    result = await session.execute(
        select(func.count(ScanTarget.id))
        .filter(
            ScanTarget.organization_id == org_id,
            ScanTarget.deleted_at.is_(None)
        )
    )
    return result.scalar() or 0


async def get_monthly_scan_credits_used(org_id: int, session: AsyncSession) -> int:
    """
    Count scan credits used this month by an organization.

    Each scanner execution = 1 credit. A ScanJob with scan_types="port_scan,dns_enum,ssl_check"
    = 3 credits. We count the total number of comma-separated scan_types across all jobs
    created in the current calendar month.

    Why count scan_types_run not just jobs: a job with 5 scan types costs more than
    a job with 1. Fair usage — user controls cost by choosing what to scan.

    Args:
        org_id: Organization ID
        session: Database session

    Returns:
        Number of scan credits used this month
    """
    now = datetime.now(timezone.utc)

    # Get all scan jobs for this org this month (via target → org relationship)
    result = await session.execute(
        select(ScanJob.scan_types_run)
        .join(ScanTarget, ScanJob.target_id == ScanTarget.id)
        .filter(
            ScanTarget.organization_id == org_id,
            extract("year", ScanJob.created_at) == now.year,
            extract("month", ScanJob.created_at) == now.month,
        )
    )
    rows = result.scalars().all()

    # Count individual scan types across all jobs
    total_credits = 0
    for scan_types_run in rows:
        if scan_types_run:
            total_credits += len(scan_types_run.split(","))

    return total_credits


# ==========================================
# Logic Helpers
# ==========================================

def get_org_tier(subscription: Subscription | None) -> str:
    """
    Determine the organization's current tier from their subscription.

    - No subscription record → FREE
    - subscription.plan_name matches TIER_ORDER → return it
    - Unknown plan_name → FREE

    Args:
        subscription: Subscription model instance or None

    Returns:
        Tier string: "FREE", "PRO", "ENTERPRISE", or "CUSTOM"
    """
    if not subscription:
        return "FREE"

    if subscription.plan_name in TIER_ORDER:
        return subscription.plan_name

    return "FREE"


def tier_is_sufficient(current_tier: str, required_tier: str) -> bool:
    """
    Check if current tier meets or exceeds the required tier.

    Uses index-based comparison on TIER_ORDER.

    Args:
        current_tier: Organization's current tier (e.g. "PRO")
        required_tier: Minimum tier needed (e.g. "FREE")

    Returns:
        True if current_tier >= required_tier
    """
    if current_tier not in TIER_ORDER:
        return False
    if required_tier not in TIER_ORDER:
        return False

    return TIER_ORDER.index(current_tier) >= TIER_ORDER.index(required_tier)


def get_tier_limits(tier: str) -> dict:
    """
    Get the limits for a specific tier.

    Args:
        tier: Tier string ("FREE", "PRO", "ENTERPRISE", "CUSTOM")

    Returns:
        Dict with monthly_scan_credits, max_targets, max_infrastructure,
        max_credentials, max_schedules, requests_per_minute, requests_per_hour,
        allowed_scan_types, allowed_report_types, allowed_schedule_frequencies
    """
    return TIER_LIMITS.get(tier, TIER_LIMITS["FREE"])


async def is_over_target_limit(org_id: int, session: AsyncSession, subscription: Subscription | None) -> bool:
    """
    Check if the organization has reached their scan target limit.

    Used before creating a new scan target to enforce tier-based limits.

    Args:
        org_id: Organization ID
        session: Database session
        subscription: Organization's subscription (or None for FREE tier)

    Returns:
        True if at or over limit (cannot create more targets)
    """
    tier = get_org_tier(subscription)
    limits = get_tier_limits(tier)

    # -1 = unlimited (ENTERPRISE/CUSTOM)
    if limits["max_targets"] == -1:
        return False

    current_count = await get_org_target_count(org_id, session)
    return current_count >= limits["max_targets"]


async def is_service_active(org_id: int, session: AsyncSession) -> bool:
    """
    The main subscription check — called by require_active_subscription dependency.

    Determines whether the organization's cybersecurity service is active.
    When inactive, ALL cybersecurity endpoints return 403.

    Logic:
    1. Get subscription
    2. If no subscription → check if under FREE limits → if yes: active
    3. If subscription ACTIVE/TRIALING → active
    4. If subscription CANCELED/PAST_DUE/UNPAID → check grace period
    5. If subscription has manual_override → active (bypass Stripe status)

    Args:
        org_id: Organization ID
        session: Database session

    Returns:
        True if service is active (requests allowed), False if blocked
    """
    subscription = await get_org_subscription(org_id, session)

    # No subscription record → FREE tier
    if not subscription:
        # FREE tier is active as long as within target limits
        target_count = await get_org_target_count(org_id, session)
        free_limits = get_tier_limits("FREE")
        return target_count <= free_limits["max_targets"]

    # Manual override bypasses Stripe status checks (invoice/bank transfer clients)
    if subscription.manual_override:
        return True

    # Active or trialing subscription → service active
    if subscription.subscription_status in ("ACTIVE", "TRIALING"):
        return True

    # Canceled/past_due/unpaid — check grace period
    if subscription.subscription_status in ("CANCELED", "PAST_DUE", "UNPAID"):
        if subscription.end_date:
            grace_deadline = subscription.end_date + timedelta(days=GRACE_PERIOD_DAYS)
            if datetime.now(timezone.utc) < grace_deadline:
                return True

    # All other statuses → inactive
    return False


async def is_service_active_with_subscription(
    subscription: Subscription | None, org_id: int, session: AsyncSession
) -> bool:
    """
    Same logic as is_service_active but accepts a pre-resolved subscription.

    Used by require_active_subscription (via OrgContext) to avoid re-querying
    get_org_subscription when the subscription is already resolved.

    Args:
        subscription: Pre-resolved subscription from OrgContext (or None for FREE tier)
        org_id: Organization ID (needed for target count on FREE tier)
        session: Database session (needed for target count on FREE tier)

    Returns:
        True if service is active (requests allowed), False if blocked
    """
    # No subscription record → FREE tier
    if not subscription:
        target_count = await get_org_target_count(org_id, session)
        free_limits = get_tier_limits("FREE")
        return target_count <= free_limits["max_targets"]

    # Manual override bypasses Stripe status checks
    if subscription.manual_override:
        return True

    # Active or trialing subscription → service active
    if subscription.subscription_status in ("ACTIVE", "TRIALING"):
        return True

    # Canceled/past_due/unpaid — check grace period
    if subscription.subscription_status in ("CANCELED", "PAST_DUE", "UNPAID"):
        if subscription.end_date:
            grace_deadline = subscription.end_date + timedelta(days=GRACE_PERIOD_DAYS)
            if datetime.now(timezone.utc) < grace_deadline:
                return True

    return False
