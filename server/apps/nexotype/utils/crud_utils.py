"""
Nexotype CRUD Utilities

Shared helpers for subrouter endpoints. Each helper handles one concern:
- get_owned_record_or_404: ownership + soft-delete filtered lookup
- check_duplicate: composite key duplicate check (all rows, including soft-deleted)
- create_or_restore_with_audit: create new row or restore soft-deleted duplicate + audit
- create_with_audit: create with user context + INSERT audit (no uniqueness handling)
- update_with_audit: update with old/new snapshots + UPDATE audit
- soft_delete_with_audit: soft delete + DELETE audit

Routes stay explicit in each subrouter. Change a helper = applies everywhere.

Key difference from finpy's crud_utils:
    - Uses apply_default_filters (ownership + soft-delete, not just soft-delete)
    - Sets organization_id on records (nexotype uses org ownership, not entity-based access)
    - create_or_restore_with_audit for canonical identifiers (standardization models)
"""

from typing import Any

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from .filtering_utils import apply_default_filters
from .audit_utils import log_audit, model_to_dict


async def get_owned_record_or_404(
    db: AsyncSession,
    model: Any,
    item_id: int,
    user_org_id: int | None,
    entity_label: str,
) -> Any:
    """
    Fetch one record by id with ownership + soft-delete filters.

    Uses apply_default_filters which combines:
    - Soft-delete filter (deleted_at IS NULL)
    - Ownership filter (is_curated = TRUE OR organization_id = user_org_id)

    Args:
        db: Database session
        model: SQLAlchemy model class (e.g., OntologyTerm, Gene)
        item_id: Primary key value
        user_org_id: User's organization ID for ownership filtering
        entity_label: Human-readable name for error messages (e.g., "OntologyTerm")

    Returns:
        The model instance

    Raises:
        HTTPException 404 if not found, soft-deleted, or not owned
    """
    query = select(model).where(model.id == item_id)
    query = apply_default_filters(query, model, user_org_id)
    result = await db.execute(query)
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail=f"{entity_label} with ID {item_id} not found")
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
    Checks ALL rows including soft-deleted to prevent DB unique constraint violations.

    Supports composite keys (e.g., entity_type + entity_id + source + external_id)
    unlike a single-field check.

    Used in UPDATE endpoints. For CREATE endpoints on canonical models,
    use create_or_restore_with_audit instead.

    Args:
        db: Database session
        model: SQLAlchemy model class
        filters: Dict of {field_name: value} pairs to check (all must match)
        entity_label: Human-readable name for error messages
        exclude_id: ID to exclude from check (for updates)

    Raises:
        HTTPException 409 if a matching record exists
    """
    # Skip if any filter value is None — can't be a duplicate
    if any(v is None for v in filters.values()):
        return

    query = select(model)
    for field_name, value in filters.items():
        query = query.where(getattr(model, field_name) == value)

    if exclude_id is not None:
        query = query.where(model.id != exclude_id)

    result = await db.execute(query)
    if result.scalar_one_or_none():
        fields_str = ", ".join(f"{k}={v}" for k, v in filters.items())
        raise HTTPException(
            status_code=409,
            detail=f"{entity_label} with {fields_str} already exists",
        )


async def create_or_restore_with_audit(
    db: AsyncSession,
    model: Any,
    table_name: str,
    payload: dict[str, Any],
    user_id: int,
    organization_id: int | None,
    unique_fields: dict[str, Any],
    entity_label: str,
) -> Any:
    """
    Create a new row or restore a soft-deleted one with the same unique identifier.

    Handles the mismatch between app-level soft-delete-aware checks and
    global DB unique constraints. Prevents IntegrityError → 500 on re-creation.

    Logic:
    - If an active record matches unique_fields: raise 409 (duplicate)
    - If a soft-deleted record matches: restore it (undelete + update fields + RESTORE audit)
    - If no record matches: create new row (INSERT audit)

    Works for single fields (accession) and composite keys (entity_type + entity_id + source + external_id).

    Args:
        db: Database session
        model: SQLAlchemy model class
        table_name: Table name for audit log (e.g., "ontology_terms")
        payload: Dict of field values from schema.model_dump()
        user_id: Current user's ID (set as created_by on new record, updated_by on restore)
        organization_id: User's org ID (set on record + audit log)
        unique_fields: Dict of {field_name: value} pairs that form the unique key
        entity_label: Human-readable name for error messages

    Returns:
        The created or restored model instance (flushed, has ID)

    Raises:
        HTTPException 409 if an active record with same unique fields exists
    """
    # Look for existing record matching unique fields (including soft-deleted)
    query = select(model)
    for field_name, value in unique_fields.items():
        query = query.where(getattr(model, field_name) == value)

    result = await db.execute(query)
    existing = result.scalar_one_or_none()

    if existing:
        if existing.deleted_at is None:
            # Active record — duplicate conflict
            field_desc = ", ".join(f"{k}={v}" for k, v in unique_fields.items())
            raise HTTPException(
                status_code=409,
                detail=f"{entity_label} with {field_desc} already exists",
            )

        # Soft-deleted record — restore it with updated fields
        old_data = model_to_dict(existing)

        # Undelete
        existing.deleted_at = None
        existing.deleted_by = None

        # Update all fields from payload
        for field, value in payload.items():
            setattr(existing, field, value)
        existing.updated_by = user_id

        await log_audit(
            session=db,
            table_name=table_name,
            record_id=existing.id,
            action="RESTORE",
            old_data=old_data,
            new_data=model_to_dict(existing),
            user_id=user_id,
            organization_id=organization_id,
        )
        return existing

    # No existing record — create new
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
        table_name: Table name for audit log (e.g., "genes")
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
