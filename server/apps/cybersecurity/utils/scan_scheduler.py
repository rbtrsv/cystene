"""
Cybersecurity Utils — Scan Scheduler

Background asyncio loop that runs periodic scans for schedules
with is_active=True AND next_run_at <= now.

Runs inside FastAPI's lifespan — starts on app startup, stops on shutdown.
Checks for due schedules every SCAN_CHECK_INTERVAL_SECONDS (default 60s).

Why 60 seconds: A schedule set to "hourly" should run close to on-time.
With 300s delay (ecommerce pattern), a scan could start up to 5 minutes late.
60s is a good compromise between responsiveness and DB query frequency.

Uses FOR UPDATE SKIP LOCKED to prevent duplicate scans when multiple server
instances are running (each instance picks different schedules).

Pattern from: server/apps/ecommerce/utils/sync_scheduler.py

Flow per due schedule:
1. Create ScanJob with status="pending"
2. Update schedule: last_run_at, next_run_at, last_run_status
3. Launch run_scan_job() as background task (same dispatcher as POST /start)

Helpers:
    - _frequency_to_timedelta(frequency) — converts frequency string to timedelta
    - compute_next_scan_at(frequency) — returns datetime for next scheduled scan
    - _scan_scheduler_loop() — background loop that finds due schedules and launches scans
    - start_scan_scheduler() — creates asyncio task, called from FastAPI lifespan
    - stop_scan_scheduler(task) — cancels background task, called from FastAPI lifespan
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, and_, or_

from core.db import async_session
from ..models.execution_models import ScanSchedule, ScanJob
from ..subrouters.execution_subrouters.scan_job_subrouter import run_scan_job

logger = logging.getLogger(__name__)


# ==========================================
# Constants
# ==========================================

# How often the scheduler checks for due schedules (seconds)
# Why 60: Scans are time-sensitive. A "hourly" schedule should run within ~1 minute of due time.
SCAN_CHECK_INTERVAL_SECONDS = 60

# Maps frequency string values to timedelta objects
# Why these values: Matches ScheduleFrequency enum in scan_schedule_schemas.py
FREQUENCY_MAP = {
    "hourly": timedelta(hours=1),
    "daily": timedelta(days=1),
    "weekly": timedelta(weeks=1),
    "monthly": timedelta(days=30),  # Approximation — 30 days, not calendar month
}


# ==========================================
# Helpers
# ==========================================

def _frequency_to_timedelta(frequency: str) -> timedelta:
    """
    Convert a frequency string to a timedelta.

    Falls back to daily if frequency is unknown (defensive — schema validation
    prevents unknown values, but this is a safety net).

    Args:
        frequency: One of "hourly", "daily", "weekly", "monthly"

    Returns:
        Corresponding timedelta
    """
    return FREQUENCY_MAP.get(frequency, timedelta(days=1))


def compute_next_scan_at(frequency: str) -> datetime:
    """
    Compute the next scheduled scan time from now.

    Used by:
    - _scan_scheduler_loop() after completing a scan
    - scan_schedule_subrouter.py when user creates/updates schedule (future)

    Args:
        frequency: One of "hourly", "daily", "weekly", "monthly"

    Returns:
        datetime (UTC) for next scan
    """
    return datetime.now(timezone.utc) + _frequency_to_timedelta(frequency)


# ==========================================
# Background Loop
# ==========================================

async def _scan_scheduler_loop():
    """
    Background loop — finds due schedules and launches scan jobs.

    Runs indefinitely until cancelled. Each iteration:
    1. Sleeps for SCAN_CHECK_INTERVAL_SECONDS
    2. Queries schedules where is_active=True AND next_run_at <= now (or next_run_at is NULL)
    3. Locks rows with FOR UPDATE SKIP LOCKED (multi-instance safe)
    4. Creates ScanJob for each due schedule
    5. Launches run_scan_job() as background task
    6. Updates last_run_at, last_run_status, next_run_at on schedule
    """
    while True:
        await asyncio.sleep(SCAN_CHECK_INTERVAL_SECONDS)
        try:
            async with async_session() as db:
                now = datetime.now(timezone.utc)

                # Find schedules due for scanning — lock rows to prevent duplicate scans
                # Why FOR UPDATE SKIP LOCKED: if another server instance already locked a
                # schedule row, skip it. Prevents the same schedule running twice in parallel.
                result = await db.execute(
                    select(ScanSchedule)
                    .where(
                        and_(
                            ScanSchedule.is_active == True,
                            ScanSchedule.deleted_at == None,
                            or_(
                                # First run — next_run_at not yet computed
                                ScanSchedule.next_run_at == None,
                                # Due for next run
                                ScanSchedule.next_run_at <= now,
                            ),
                        )
                    )
                    .with_for_update(skip_locked=True)
                )
                schedules = result.scalars().all()

                for schedule in schedules:
                    try:
                        # Create a new ScanJob for this scheduled run
                        # Why: Same as POST /start but triggered automatically instead of by user
                        job = ScanJob(
                            target_id=schedule.target_id,
                            template_id=schedule.template_id,
                            schedule_id=schedule.id,
                            status="pending",
                            scan_types_run=None,  # Will be filled by dispatcher from template
                        )
                        db.add(job)
                        await db.flush()  # Get job.id before committing

                        # Update schedule state
                        schedule.last_run_at = datetime.now(timezone.utc)
                        schedule.last_run_status = "pending"
                        schedule.next_run_at = compute_next_scan_at(schedule.frequency)

                        await db.commit()

                        # Launch scanner dispatcher as background task
                        # Why asyncio.create_task: Non-blocking — scheduler continues to next schedule
                        # while this scan runs in the background
                        asyncio.create_task(run_scan_job(job.id))

                        logger.info(
                            "Scan scheduler: launched job %s for schedule '%s' (id=%s, frequency=%s, next=%s)",
                            job.id, schedule.name, schedule.id, schedule.frequency, schedule.next_run_at,
                        )

                    except Exception as e:
                        logger.error(
                            "Scan scheduler error for schedule_id=%s: %s",
                            schedule.id, str(e),
                        )
                        # Still schedule next run so one failure doesn't block future scans
                        # Why: If DB is temporarily down or a template is missing, the schedule
                        # should try again next cycle, not stay stuck forever
                        try:
                            schedule.last_run_status = "error"
                            schedule.next_run_at = compute_next_scan_at(schedule.frequency)
                            await db.commit()
                        except Exception:
                            await db.rollback()

        except Exception as e:
            logger.error("Scan scheduler loop error: %s", str(e))


# ==========================================
# Start / Stop
# ==========================================

async def start_scan_scheduler() -> asyncio.Task:
    """
    Start the background scan scheduler. Called from FastAPI lifespan.

    Returns:
        asyncio.Task — pass to stop_scan_scheduler() on shutdown
    """
    task = asyncio.create_task(_scan_scheduler_loop())
    logger.info(
        "Scan scheduler started (check interval: %ss)",
        SCAN_CHECK_INTERVAL_SECONDS,
    )
    return task


async def stop_scan_scheduler(task: asyncio.Task):
    """
    Stop the background scan scheduler. Called from FastAPI lifespan.

    Args:
        task: The asyncio.Task returned by start_scan_scheduler()
    """
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    logger.info("Scan scheduler stopped")
