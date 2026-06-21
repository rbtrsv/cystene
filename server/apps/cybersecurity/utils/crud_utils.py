"""
Cybersecurity CRUD Utilities

Design rule: small, composable, single-purpose helpers. One stable thing per
function, reused across subrouters. Avoid factory/class abstractions unless
behavior is truly uniform — routes stay explicit, helpers do repeated building
blocks only.

Shared helpers for subrouter endpoints. Each helper handles one concern:
- create_with_audit: create with user context + INSERT audit
- update_with_audit: update with old/new snapshots + UPDATE audit
- soft_delete_with_audit: soft delete + DELETE audit

Routes stay explicit in each subrouter. Change a helper = applies everywhere.

No ownership filter here (access is owner/admin per subrouter, not a shared org filter),
so there is no get_owned_record_or_404. The audit helpers wrap log_audit() +
model_to_dict() from audit_utils — explicit audit, no ORM listeners.
"""

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .audit_utils import log_audit, model_to_dict


async def get_record_name(db: AsyncSession, model: Any, record_id: int | None) -> str | None:
    """
    Resolve a related record's display `name` by id — for FK enrichment in detail
    responses (so the UI shows "Production API" instead of a raw "Target ID: 1").

    Args:
        db: Database session
        model: SQLAlchemy model class with a `name` column (e.g., ScanTarget)
        record_id: The FK value to resolve (may be None for optional FKs)

    Returns:
        The record's name, or None if record_id is None or no row matches.
    """
    if record_id is None:
        return None
    result = await db.execute(select(model.name).where(model.id == record_id))
    return result.scalar_one_or_none()


async def create_with_audit(
    db: AsyncSession,
    model: Any,
    table_name: str,
    payload: dict[str, Any],
    user_id: int,
    organization_id: int | None,
) -> Any:
    """
    Create a row with created_by/org context and INSERT audit.

    No uniqueness handling — use for models without unique constraints,
    or when uniqueness is handled separately.

    Args:
        db: Database session
        model: SQLAlchemy model class
        table_name: Table name for audit log (e.g., "cybersecurity_feedback")
        payload: Dict of field values from schema.model_dump()
        user_id: Current user's ID (set as created_by on record)
        organization_id: User's org ID (set on record + audit log)

    Returns:
        The created model instance (flushed, has ID)
    """
    item = model(**payload, created_by=user_id, organization_id=organization_id)
    db.add(item)
    await db.flush()

    await log_audit(
        session=db,
        table_name=table_name,
        record_id=item.id,
        action="INSERT",
        new_data=model_to_dict(item),
        user_id=user_id,
        organization_id=organization_id,
    )
    return item


async def update_with_audit(
    db: AsyncSession,
    item: Any,
    table_name: str,
    payload: dict[str, Any],
    user_id: int,
    organization_id: int | None,
) -> Any:
    """
    Update a row with updated_by and UPDATE audit snapshots.

    Captures old_data snapshot before applying changes, then logs
    both old and new snapshots to audit. Returns the updated item.

    Args:
        db: Database session
        item: The model instance to update (already fetched)
        table_name: Table name for audit log
        payload: Dict of field values from schema.model_dump(exclude_unset=True)
        user_id: Current user's ID (set as updated_by on record)
        organization_id: User's org ID (for audit log)

    Returns:
        The updated model instance
    """
    old_data = model_to_dict(item)
    for field, value in payload.items():
        setattr(item, field, value)
    item.updated_by = user_id

    await log_audit(
        session=db,
        table_name=table_name,
        record_id=item.id,
        action="UPDATE",
        old_data=old_data,
        new_data=model_to_dict(item),
        user_id=user_id,
        organization_id=organization_id,
    )
    return item


async def soft_delete_with_audit(
    db: AsyncSession,
    item: Any,
    table_name: str,
    user_id: int,
    organization_id: int | None,
) -> Any:
    """
    Soft delete a row and write DELETE audit.

    Sets deleted_at (timestamp) and deleted_by (user ID).
    No hard delete — record stays in DB for audit trail.

    Args:
        db: Database session
        item: The model instance to soft delete (already fetched)
        table_name: Table name for audit log
        user_id: Current user's ID (set as deleted_by on record)
        organization_id: User's org ID (for audit log)

    Returns:
        The soft-deleted model instance
    """
    old_data = model_to_dict(item)
    item.deleted_at = func.now()
    item.deleted_by = user_id

    await log_audit(
        session=db,
        table_name=table_name,
        record_id=item.id,
        action="DELETE",
        old_data=old_data,
        user_id=user_id,
        organization_id=organization_id,
    )
    return item
