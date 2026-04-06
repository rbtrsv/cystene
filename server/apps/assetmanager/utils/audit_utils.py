"""
AssetManager Audit Utilities — Explicit Audit Logging
=====================================================

Explicit helper functions for logging data changes to AssetManagerAuditLog.
Called in subrouter endpoints after CRUD operations.

Why explicit calls instead of event listeners or DB triggers:
    - Matches existing subrouter patterns
    - User context (user.id) is right there in the endpoint
    - Explicit and readable — no hidden magic

Same pattern as nexotype audit_utils, adapted for assetmanager's
entity-based access model (no is_curated/organization_id on records).

AssetManagerAuditLog Table Structure:
    table_name       — which table was modified (e.g., "entities", "stakeholders")
    record_id        — PK of the modified record
    action           — "INSERT", "UPDATE", or "DELETE"
    old_data         — JSON snapshot of record BEFORE the change (None for INSERT)
    new_data         — JSON snapshot of record AFTER the change (None for DELETE)
    user_id          — who performed the action (loose FK to accounts.User)
    organization_id  — the org through which the user performed the action
                       (from entity_access.organization_id — the ACCESS org,
                       NOT Entity.organization_id which is the billing owner)
    ip_address       — request IP (optional)
    timestamp        — auto-set server timestamp

Serialization:
    model_to_dict() converts a SQLAlchemy model instance to a JSON-serializable
    dict. Handles Decimal → float, datetime/date → ISO string. Captures ALL
    columns automatically via __table__.columns — no manual field listing.

Integration:
    Subrouters typically don't call log_audit() directly. Instead they use
    crud_utils helpers (create_with_audit, update_with_audit, soft_delete_with_audit)
    which wrap log_audit() with the standard snapshot pattern.

    Direct log_audit() calls are used for edge cases where crud_utils helpers
    don't fit (e.g., entity_subrouter.py which has custom create/delete logic
    for subscription sync).

Query Functions:
    get_record_audit_logs       — audit history for a specific record
    get_user_audit_logs         — all actions by a specific user
    get_organization_audit_logs — all actions through a specific org
    get_table_audit_logs        — all changes to a specific table
    All return newest-first, with configurable limit (default 100).
"""

from typing import Any, List
from decimal import Decimal
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models import AssetManagerAuditLog
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
        instance: A SQLAlchemy model instance (e.g., Entity, Stakeholder)

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
    Log a data change to the assetmanager audit log.
    Called explicitly in subrouter endpoints after CRUD operations.

    Args:
        session: Database session (same session as the endpoint — no separate commit)
        table_name: Name of the table being modified (e.g., "entities", "stakeholders")
        record_id: ID of the record being modified
        action: "INSERT", "UPDATE", or "DELETE"
        old_data: Snapshot of record before change (None for INSERT)
        new_data: Snapshot of record after change (None for DELETE)
        user_id: ID of the user making the change (loose coupling to accounts.User)
        organization_id: ID of the subscriber org context (loose coupling to accounts.Organization)
        ip_address: IP address of the request
    """
    entry = AssetManagerAuditLog(
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
) -> List[AssetManagerAuditLog]:
    """
    Get audit logs for a specific record.

    Args:
        table_name: The table name (e.g., "entities")
        record_id: The record ID
        limit: Maximum number of logs to return

    Returns:
        List of AssetManagerAuditLog objects, newest first
    """
    async with async_session() as session:
        result = await session.execute(
            select(AssetManagerAuditLog)
            .filter(AssetManagerAuditLog.table_name == table_name)
            .filter(AssetManagerAuditLog.record_id == record_id)
            .order_by(AssetManagerAuditLog.timestamp.desc())
            .limit(limit)
        )
        return result.scalars().all()


async def get_user_audit_logs(
    user_id: int,
    limit: int = 100,
) -> List[AssetManagerAuditLog]:
    """
    Get all audit logs for a specific user across all assetmanager tables.

    Args:
        user_id: The user ID
        limit: Maximum number of logs to return

    Returns:
        List of AssetManagerAuditLog objects, newest first
    """
    async with async_session() as session:
        result = await session.execute(
            select(AssetManagerAuditLog)
            .filter(AssetManagerAuditLog.user_id == user_id)
            .order_by(AssetManagerAuditLog.timestamp.desc())
            .limit(limit)
        )
        return result.scalars().all()


async def get_organization_audit_logs(
    organization_id: int,
    limit: int = 100,
) -> List[AssetManagerAuditLog]:
    """
    Get all audit logs for a specific organization across all assetmanager tables.

    Args:
        organization_id: The organization ID
        limit: Maximum number of logs to return

    Returns:
        List of AssetManagerAuditLog objects, newest first
    """
    async with async_session() as session:
        result = await session.execute(
            select(AssetManagerAuditLog)
            .filter(AssetManagerAuditLog.organization_id == organization_id)
            .order_by(AssetManagerAuditLog.timestamp.desc())
            .limit(limit)
        )
        return result.scalars().all()


async def get_table_audit_logs(
    table_name: str,
    limit: int = 100,
) -> List[AssetManagerAuditLog]:
    """
    Get all audit logs for a specific table (e.g., all entity changes).

    Args:
        table_name: The table name (e.g., "entities", "stakeholders")
        limit: Maximum number of logs to return

    Returns:
        List of AssetManagerAuditLog objects, newest first
    """
    async with async_session() as session:
        result = await session.execute(
            select(AssetManagerAuditLog)
            .filter(AssetManagerAuditLog.table_name == table_name)
            .order_by(AssetManagerAuditLog.timestamp.desc())
            .limit(limit)
        )
        return result.scalars().all()
