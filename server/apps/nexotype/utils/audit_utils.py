"""
Nexotype Audit Utilities

Explicit helper functions for logging data changes to NexotypeAuditLog.
Called in subrouter endpoints after CRUD operations (Option C from 4_data_ownership_and_audit.md).

Why explicit calls instead of event listeners or DB triggers:
    - Matches existing subrouter patterns
    - User context (user.id) is right there in the endpoint
    - Explicit and readable — no hidden magic
"""

from typing import Any, List
from decimal import Decimal
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models import NexotypeAuditLog
from core.db import async_session


# ==========================================
# Serialization Helpers
# ==========================================

def model_to_dict(instance: Any) -> dict:
    """
    Convert a SQLAlchemy model instance to a JSON-serializable dict.
    Captures ALL columns automatically — no manual field listing needed.

    Handles type conversions for JSON storage:
    - Decimal → float
    - datetime/date → ISO string
    - None stays None

    Args:
        instance: A SQLAlchemy model instance (e.g., Gene, TherapeuticAsset)

    Returns:
        Dict of {column_name: value} for all columns, JSON-serializable
    """
    result = {}
    for column in instance.__table__.columns:
        value = getattr(instance, column.name)
        # Convert types that JSON can't serialize
        if isinstance(value, Decimal):
            value = float(value)
        elif isinstance(value, datetime):
            value = value.isoformat()
        elif isinstance(value, date):
            value = value.isoformat()
        result[column.name] = value
    return result


# ==========================================
# Audit Logging
# ==========================================

async def log_audit(
    session: AsyncSession,
    table_name: str,
    record_id: int,
    action: str,
    old_data: dict | None = None,
    new_data: dict | None = None,
    user_id: int | None = None,
    organization_id: int | None = None,
    ip_address: str | None = None,
):
    """
    Log a data change to the nexotype audit log.
    Called explicitly in subrouter endpoints after CRUD operations.

    Args:
        session: Database session (same session as the endpoint — no separate commit)
        table_name: Name of the table being modified (e.g., "genes", "therapeutic_assets")
        record_id: ID of the record being modified
        action: "INSERT", "UPDATE", or "DELETE"
        old_data: Snapshot of record before change (None for INSERT)
        new_data: Snapshot of record after change (None for DELETE)
        user_id: ID of the user making the change (loose coupling to accounts.User)
        organization_id: ID of the subscriber org context (loose coupling to accounts.Organization)
        ip_address: IP address of the request
    """
    entry = NexotypeAuditLog(
        table_name=table_name,
        record_id=record_id,
        action=action,
        old_data=old_data,
        new_data=new_data,
        user_id=user_id,
        organization_id=organization_id,
        ip_address=ip_address,
    )
    session.add(entry)


# ==========================================
# Audit Log Queries
# ==========================================

async def get_record_audit_logs(
    table_name: str,
    record_id: int,
    limit: int = 100,
) -> List[NexotypeAuditLog]:
    """
    Get audit logs for a specific record.

    Args:
        table_name: The table name (e.g., "genes")
        record_id: The record ID
        limit: Maximum number of logs to return

    Returns:
        List of NexotypeAuditLog objects, newest first
    """
    async with async_session() as session:
        result = await session.execute(
            select(NexotypeAuditLog)
            .filter(NexotypeAuditLog.table_name == table_name)
            .filter(NexotypeAuditLog.record_id == record_id)
            .order_by(NexotypeAuditLog.timestamp.desc())
            .limit(limit)
        )
        return result.scalars().all()


async def get_user_audit_logs(
    user_id: int,
    limit: int = 100,
) -> List[NexotypeAuditLog]:
    """
    Get all audit logs for a specific user across all nexotype tables.

    Args:
        user_id: The user ID
        limit: Maximum number of logs to return

    Returns:
        List of NexotypeAuditLog objects, newest first
    """
    async with async_session() as session:
        result = await session.execute(
            select(NexotypeAuditLog)
            .filter(NexotypeAuditLog.user_id == user_id)
            .order_by(NexotypeAuditLog.timestamp.desc())
            .limit(limit)
        )
        return result.scalars().all()


async def get_organization_audit_logs(
    organization_id: int,
    limit: int = 100,
) -> List[NexotypeAuditLog]:
    """
    Get all audit logs for a specific organization across all nexotype tables.

    Args:
        organization_id: The organization ID
        limit: Maximum number of logs to return

    Returns:
        List of NexotypeAuditLog objects, newest first
    """
    async with async_session() as session:
        result = await session.execute(
            select(NexotypeAuditLog)
            .filter(NexotypeAuditLog.organization_id == organization_id)
            .order_by(NexotypeAuditLog.timestamp.desc())
            .limit(limit)
        )
        return result.scalars().all()


async def get_table_audit_logs(
    table_name: str,
    limit: int = 100,
) -> List[NexotypeAuditLog]:
    """
    Get all audit logs for a specific table (e.g., all gene changes).

    Args:
        table_name: The table name (e.g., "genes", "therapeutic_assets")
        limit: Maximum number of logs to return

    Returns:
        List of NexotypeAuditLog objects, newest first
    """
    async with async_session() as session:
        result = await session.execute(
            select(NexotypeAuditLog)
            .filter(NexotypeAuditLog.table_name == table_name)
            .order_by(NexotypeAuditLog.timestamp.desc())
            .limit(limit)
        )
        return result.scalars().all()
