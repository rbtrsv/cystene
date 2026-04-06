"""
Cybersecurity Audit Models

Activity log for tracking data changes across cybersecurity models.
Standardized structure matching accounts.AccountsActivityLog and nexotype.NexotypeAuditLog.

Why: SOC2/ISO27001 compliance requires full audit trail — who added SSH key, who deleted credential,
who marked finding as resolved. Must be queryable independently.
"""

from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from core.db import Base


# ==========================================
# CYBERSECURITY AUDIT LOG
# ==========================================

class CybersecurityAuditLog(Base):
    """
    Tracks all data changes across cybersecurity models.
    No BaseMixin — audit rows are immutable. No soft delete, no updated_by.
    Loose coupling to accounts (integer IDs, no FKs).

    Used by subrouters: infrastructure, credential, scan_target, scan_template,
    scan_schedule, report (CRUD operations that modify data).
    NOT used by: finding, asset (append-only scanner writes — no user edits to audit).
    """
    __tablename__ = "cybersecurity_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Who — loose coupling to accounts (no FK, like NexotypeAuditLog)
    organization_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # What was affected
    table_name: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "infrastructure", "credentials", "scan_targets"
    record_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    action: Mapped[str] = mapped_column(Text, nullable=False)  # "INSERT", "UPDATE", "DELETE"

    # Data change snapshots
    old_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # State before change
    new_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # State after change

    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
