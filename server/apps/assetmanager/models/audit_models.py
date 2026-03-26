"""
AssetManager Audit Models

Audit log for tracking data changes across all assetmanager models.
Standardized structure matching accounts.AccountsAuditLog.

Why: Compliance, undo, debugging, full change history with before/after snapshots.
     Model-level fields (created_by, updated_by from BaseMixin) give fast current state.
     This table gives full history — every INSERT, UPDATE, DELETE with old/new data.
"""

from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from core.db import Base


# ==========================================
# ASSETMANAGER AUDIT LOG
# ==========================================

class AssetManagerAuditLog(Base):
    """
    Tracks all data changes across assetmanager models.
    Standardized structure — same fields as accounts.AccountsAuditLog.

    No BaseMixin — audit rows are immutable. No soft delete, no updated_by.

    Loose coupling to accounts.Organization and accounts.User (integer IDs, no FKs).
    Why: AssetManager can't have FKs to accounts models (cross-app dependency).
    """
    __tablename__ = "assetmanager_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Who — loose coupling to accounts.Organization and accounts.User (not FK)
    organization_id: Mapped[int | None] = mapped_column(Integer, nullable=True)  # Which subscriber org
    user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)  # Which user made the change

    # What was affected
    table_name: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "entities", "stakeholders"
    record_id: Mapped[int | None] = mapped_column(Integer, nullable=True)  # ID of affected record

    action: Mapped[str] = mapped_column(Text, nullable=False)  # "INSERT", "UPDATE", "DELETE"

    # Data change snapshots
    old_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # State before change
    new_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # State after change

    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
