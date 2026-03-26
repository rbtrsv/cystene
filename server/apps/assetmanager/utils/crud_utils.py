"""
AssetManager CRUD Utilities

Shared helpers for subrouter endpoints. Each helper handles one concern:
- get_record_or_404: soft-delete filtered lookup (no org ownership — entity access is separate)
- check_duplicate: composite key duplicate check with soft-delete awareness
- create_with_audit: create with created_by context + INSERT audit
- update_with_audit: update with old/new snapshots + UPDATE audit
- soft_delete_with_audit: soft delete + DELETE audit

Routes stay explicit in each subrouter. Change a helper = applies everywhere.

Key difference from nexotype's crud_utils:
    - No organization_id on records (finpy uses entity-based access, not org ownership)
    - check_duplicate uses dict-based filters (composite key support)
    - Access control stays in subrouters (entity access varies per model)
"""

from typing import Any

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from .filtering_utils import apply_soft_delete_filter
from .audit_utils import log_audit, model_to_dict


async def get_record_or_404(
    db: AsyncSession,
    model: Any,
    item_id: int,
    entity_label: str,
) -> Any:
    """
    Fetch one record by id with soft-delete filter.

    No org ownership filter — finpy uses entity-based access
    which is checked separately in each subrouter.

    Args:
        db: Database session
        model: SQLAlchemy model class (e.g., Syndicate, SyndicateMember)
        item_id: Primary key value
        entity_label: Human-readable name for error messages (e.g., "Syndicate")

    Returns:
        The model instance

    Raises:
        HTTPException 404 if not found or soft-deleted
    """
    query = select(model).where(model.id == item_id)
    query = apply_soft_delete_filter(query, model)
    result = await db.execute(query)
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail=f"{entity_label} not found")
    return item


async def check_duplicate(
    db: AsyncSession,
    model: Any,
    filters: dict[str, Any],
    entity_label: str,
    exclude_id: int | None = None,
) -> None:
    """
    Check for duplicate records using one or more field filters.
    Ignores soft-deleted rows.

    Supports composite keys (e.g., syndicate_id + member_entity_id)
    unlike nexotype's check_unique_field which handles single fields only.

    Args:
        db: Database session
        model: SQLAlchemy model class
        filters: Dict of {field_name: value} pairs to check (all must match)
        entity_label: Human-readable name for error messages
        exclude_id: ID to exclude from check (for updates)

    Raises:
        HTTPException 409 if a matching non-deleted record exists
    """
    # Skip if any filter value is None — can't be a duplicate
    if any(v is None for v in filters.values()):
        return

    query = select(model)
    for field_name, value in filters.items():
        query = query.where(getattr(model, field_name) == value)
    query = apply_soft_delete_filter(query, model)

    if exclude_id is not None:
        query = query.where(model.id != exclude_id)

    result = await db.execute(query)
    if result.scalar_one_or_none():
        fields_str = ", ".join(f"{k}={v}" for k, v in filters.items())
        raise HTTPException(
            status_code=409,
            detail=f"{entity_label} with {fields_str} already exists",
        )


async def create_with_audit(
    db: AsyncSession,
    model: Any,
    table_name: str,
    payload: dict[str, Any],
    user_id: int,
    organization_id: int | None,
) -> Any:
    """
    Create a row with created_by context and INSERT audit.

    Unlike nexotype, does NOT set organization_id on the record —
    finpy records don't have org ownership. organization_id is only
    passed to log_audit for the audit log entry.

    Args:
        db: Database session
        model: SQLAlchemy model class
        table_name: Table name for audit log (e.g., "syndicates")
        payload: Dict of field values from schema.model_dump()
        user_id: Current user's ID (set as created_by on record)
        organization_id: User's org ID (for audit log only, not on record)

    Returns:
        The created model instance (flushed, has ID)
    """
    # Convert enum values to their string representation for DB storage
    # (e.g., StakeholderType.GENERAL_PARTNER → "general_partner")
    clean_payload = {k: v.value if hasattr(v, 'value') else v for k, v in payload.items()}
    item = model(**clean_payload, created_by=user_id)
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
        organization_id: User's org ID (for audit log only)

    Returns:
        The updated model instance
    """
    old_data = model_to_dict(item)
    for field, value in payload.items():
        # Convert enum values to their string representation for DB storage
        if hasattr(value, 'value'):
            value = value.value
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
        organization_id: User's org ID (for audit log only)

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
