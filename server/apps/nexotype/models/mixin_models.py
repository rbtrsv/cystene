"""
Nexotype Mixin Models

Reusable field mixins for all Nexotype models.

BaseMixin: Timestamps, soft delete, user audit — every model inherits this.
OwnableMixin: Data ownership (curated vs org-specific) — domain models inherit this.
"""

from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


# ==========================================
# BASE MIXIN — Every Model Gets This
# ==========================================

class BaseMixin:
    """
    Universal fields for all models.
    Provides: timestamps, soft delete, user audit.

    Usage:
        class Gene(Base, BaseMixin, OwnableMixin):
            __tablename__ = "genes"
            ...
    """

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    # Soft delete — NULL = active, SET = deleted (timestamp records when)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_by: Mapped[int | None] = mapped_column(Integer, nullable=True)  # User ID who deleted

    # User audit — loose coupling to accounts.User (not FK, like UserProfile.user_id)
    created_by: Mapped[int | None] = mapped_column(Integer, nullable=True)  # User ID who created
    updated_by: Mapped[int | None] = mapped_column(Integer, nullable=True)  # User ID who last modified


# ==========================================
# OWNABLE MIXIN — Domain Models Get This
# ==========================================

class OwnableMixin:
    """
    Data ownership fields for multi-tenant models.
    Separates platform-curated data from organization-specific data.

    is_curated + organization_id are two independent dimensions:
        is_curated=TRUE,  organization_id=NULL  → Platform-curated from the start
        is_curated=FALSE, organization_id=5     → Org 5's private data
        is_curated=TRUE,  organization_id=5     → Org 5 created it, promoted to curated

    Query patterns:
        # Enriched view: all curated + org's own private data
        WHERE is_curated = TRUE OR organization_id = :user_org_id

        # Org's private data only
        WHERE is_curated = FALSE AND organization_id = :user_org_id

        # Platform admin: manage curated content
        WHERE is_curated = TRUE

    Usage:
        class Gene(Base, BaseMixin, OwnableMixin):
            __tablename__ = "genes"
            ...
    """

    # Visibility — TRUE = visible to all subscribers, FALSE = visible only to owning org
    is_curated: Mapped[bool] = mapped_column(Boolean, default=False)

    # Ownership — loose coupling to accounts.Organization (not FK, like UserProfile.user_id)
    # NULL = Nexotype platform created it (no org ownership)
    # SET = that organization created/owns it
    organization_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
