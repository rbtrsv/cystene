"""
Nudgio Utils — Sync Scheduler

Background asyncio loop that runs periodic data syncs for connections
with auto_sync_enabled=True.

Runs inside FastAPI's lifespan — starts on app startup, stops on shutdown.
Checks for due connections every SYNC_CHECK_INTERVAL_SECONDS (default 300 = 5 min).

Skips ingest connections (connection_method="ingest") — those receive data via Push API.

Uses FOR UPDATE SKIP LOCKED to prevent duplicate syncs when multiple server
instances are running (each instance picks different connections).

Helpers:
    - _interval_to_timedelta(interval) — converts sync_interval string to timedelta
    - compute_next_sync_at(interval) — returns datetime for next scheduled sync
    - _sync_scheduler_loop() — background loop that finds due connections and syncs
    - start_sync_scheduler() — creates asyncio task, called from FastAPI lifespan
    - stop_sync_scheduler(task) — cancels background task, called from FastAPI lifespan
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, and_, or_

from core.db import async_session
from ..models import EcommerceConnection
from .sync_utils import sync_connection_data

logger = logging.getLogger(__name__)


# ==========================================
# Constants
# ==========================================

# How often the scheduler checks for due connections (seconds)
SYNC_CHECK_INTERVAL_SECONDS = 300  # 5 minutes

# Maps sync_interval string values to timedelta objects
INTERVAL_MAP = {
    "hourly": timedelta(hours=1),
    "every_6_hours": timedelta(hours=6),
    "daily": timedelta(days=1),
    "weekly": timedelta(weeks=1),
}


# ==========================================
# Helpers
# ==========================================

def _interval_to_timedelta(interval: str) -> timedelta:
    """
    Convert a sync_interval string to a timedelta.

    Falls back to daily if interval is unknown (defensive — schema validation
    prevents unknown values, but this is a safety net).

    Args:
        interval: One of "hourly", "every_6_hours", "daily", "weekly"

    Returns:
        Corresponding timedelta
    """
    return INTERVAL_MAP.get(interval, timedelta(days=1))


def compute_next_sync_at(interval: str) -> datetime:
    """
    Compute the next scheduled sync time from now.

    Used by:
    - PATCH endpoint (ecommerce_connection_subrouter.py) when user enables/changes sync
    - _sync_scheduler_loop() after completing a sync

    Args:
        interval: One of "hourly", "every_6_hours", "daily", "weekly"

    Returns:
        datetime (UTC) for next sync
    """
    return datetime.now(timezone.utc) + _interval_to_timedelta(interval)


# ==========================================
# Background Loop
# ==========================================

async def _sync_scheduler_loop():
    """
    Background loop — finds due connections and runs sync_connection_data().

    Runs indefinitely until cancelled. Each iteration:
    1. Sleeps for SYNC_CHECK_INTERVAL_SECONDS
    2. Queries connections where auto_sync_enabled=True AND next_sync_at <= now
    3. Locks rows with FOR UPDATE SKIP LOCKED (multi-instance safe)
    4. Runs sync_connection_data() for each due connection
    5. Updates last_synced_at, last_sync_status, next_sync_at
    """
    while True:
        await asyncio.sleep(SYNC_CHECK_INTERVAL_SECONDS)
        try:
            async with async_session() as db:
                now = datetime.now(timezone.utc)

                # Find connections due for sync — lock rows to prevent duplicate syncs
                # FOR UPDATE SKIP LOCKED: if another instance already locked a row, skip it
                result = await db.execute(
                    select(EcommerceConnection)
                    .where(
                        and_(
                            EcommerceConnection.auto_sync_enabled == True,
                            EcommerceConnection.is_active == True,
                            EcommerceConnection.deleted_at == None,
                            EcommerceConnection.connection_method != "ingest",
                            or_(
                                EcommerceConnection.next_sync_at == None,
                                EcommerceConnection.next_sync_at <= now,
                            ),
                        )
                    )
                    .with_for_update(skip_locked=True)
                )
                connections = result.scalars().all()

                for connection in connections:
                    try:
                        stats = await sync_connection_data(connection, db)
                        connection.last_synced_at = datetime.now(timezone.utc)
                        connection.last_sync_status = "error" if stats["errors"] else "success"
                        connection.next_sync_at = compute_next_sync_at(connection.sync_interval)
                        await db.commit()
                    except Exception as e:
                        logger.error(
                            "Sync scheduler error for connection_id=%s: %s",
                            connection.id, str(e),
                        )
                        # Still schedule next sync so one failure doesn't block future syncs
                        connection.last_sync_status = "error"
                        connection.next_sync_at = compute_next_sync_at(connection.sync_interval)
                        await db.commit()

        except Exception as e:
            logger.error("Sync scheduler loop error: %s", str(e))


# ==========================================
# Start / Stop
# ==========================================

async def start_sync_scheduler() -> asyncio.Task:
    """
    Start the background sync scheduler. Called from FastAPI lifespan.

    Returns:
        asyncio.Task — pass to stop_sync_scheduler() on shutdown
    """
    task = asyncio.create_task(_sync_scheduler_loop())
    logger.info(
        "Sync scheduler started (check interval: %ss)",
        SYNC_CHECK_INTERVAL_SECONDS,
    )
    return task


async def stop_sync_scheduler(task: asyncio.Task):
    """
    Stop the background sync scheduler. Called from FastAPI lifespan.

    Args:
        task: The asyncio.Task returned by start_sync_scheduler()
    """
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    logger.info("Sync scheduler stopped")
