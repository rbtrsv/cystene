"""
AssetManager Mixin Models

Reusable field mixins for all AssetManager models.

BaseMixin: Timestamps, soft delete, user audit — every model inherits this.
"""

from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, DateTime
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
        class Entity(Base, BaseMixin):
            __tablename__ = "entities"
            ...
    """

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    # Soft delete — NULL = active, SET = deleted (timestamp records when)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_by: Mapped[int | None] = mapped_column(Integer, nullable=True)  # User ID who deleted

    # User audit — loose coupling to accounts.User (not FK)
    created_by: Mapped[int | None] = mapped_column(Integer, nullable=True)  # User ID who created
    updated_by: Mapped[int | None] = mapped_column(Integer, nullable=True)  # User ID who last modified
