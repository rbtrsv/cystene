"""
Cystene Feedback — user-submitted bug reports, feature requests, questions.

Access model: a user sees only their own feedback (`created_by`); a platform admin
(accounts.User.role == "ADMIN") sees and triages all.
"""

from __future__ import annotations
from sqlalchemy import Integer, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column
from core.db import Base
from .mixin_models import BaseMixin


# ==========================================
# FEEDBACK
# ==========================================

class CybersecurityFeedback(Base, BaseMixin):
    """In-app feedback (bugs, improvements, feature requests, questions): per-user
    submission, admin triage. `created_by` (BaseMixin) is the submitter."""
    __tablename__ = "cybersecurity_feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # bug | improvement | feature | question | other
    category: Mapped[str] = mapped_column(String(20), nullable=False)

    # open | in_progress | resolved | closed — admin-managed lifecycle
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Auto-captured from the page the user submitted from (helps the admin reproduce)
    page_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Admin-only triage notes (never editable by the submitter)
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Snapshot of the submitter's active org at submit time — triage context for the
    # admin (which workspace reported it). Loose coupling (no FK), nullable.
    organization_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)

    # created_by (submitter) + soft-delete (deleted_at/deleted_by) + audit timestamps come from BaseMixin

    # created_by → "my feedback" list; status → admin triage filter.
    # Index names prefixed with the table name (ix_cybersecurity_feedback_*) to avoid
    # cross-table name collisions in the shared database.
    __table_args__ = (
        Index("ix_cybersecurity_feedback_created_by", "created_by"),
        Index("ix_cybersecurity_feedback_status", "status"),
    )
