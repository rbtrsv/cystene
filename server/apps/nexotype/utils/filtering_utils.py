"""
Nexotype Filtering Utilities

Generic query filters for soft delete and data ownership.
Works for all nexotype models since they all share BaseMixin + OwnableMixin fields.

Unlike assetmanager (which needs per-model filters due to entity-based access control),
nexotype uses a flat ownership model: is_curated + organization_id on every model.
One generic filter covers all 40+ models.
"""

from typing import Optional, Any
from sqlalchemy import or_
from sqlalchemy.sql.selectable import Select


# ==========================================
# Soft Delete Filtering
# ==========================================

def apply_soft_delete_filter(query: Select, model: Any) -> Select:
    """
    Filter out soft-deleted records.

    Adds WHERE deleted_at IS NULL to the query.
    Every nexotype model has deleted_at from BaseMixin.

    Args:
        query: SQLAlchemy query to filter
        model: The model class (e.g., Gene, Protein)

    Returns:
        Filtered query excluding soft-deleted records
    """
    return query.filter(model.deleted_at.is_(None))


# ==========================================
# Data Ownership Filtering
# ==========================================

def apply_ownership_filter(query: Select, model: Any, user_org_id: Optional[int]) -> Select:
    """
    Filter by data ownership — curated data + user's org data.

    Adds WHERE is_curated = TRUE OR organization_id = :user_org_id.
    This is the "enriched view" from 4_data_ownership_and_audit.md:
    the user sees all platform-curated data plus their own org's private data.

    If user has no org (user_org_id is None), they only see curated data.

    Args:
        query: SQLAlchemy query to filter
        model: The model class (must have is_curated and organization_id from OwnableMixin)
        user_org_id: The user's organization ID (None if no org)

    Returns:
        Filtered query showing only data the user should see
    """
    if user_org_id is not None:
        # Enriched view: all curated + org's own private data
        return query.filter(
            or_(
                model.is_curated == True,
                model.organization_id == user_org_id
            )
        )
    else:
        # No org — only curated data
        return query.filter(model.is_curated == True)


# ==========================================
# Combined Filters
# ==========================================

def apply_default_filters(query: Select, model: Any, user_org_id: Optional[int]) -> Select:
    """
    Apply both soft delete and data ownership filters.

    This is the standard filter for LIST and GET endpoints:
    1. Exclude soft-deleted records (deleted_at IS NULL)
    2. Show only curated + user's org data (is_curated = TRUE OR organization_id = user_org_id)

    Args:
        query: SQLAlchemy query to filter
        model: The model class (must have BaseMixin + OwnableMixin)
        user_org_id: The user's organization ID (None if no org)

    Returns:
        Filtered query with both soft delete and ownership applied
    """
    query = apply_soft_delete_filter(query, model)
    query = apply_ownership_filter(query, model, user_org_id)
    return query
