"""
Audit Trail Schemas

Pydantic schemas for CybersecurityAuditLog (read-only).
No Create/Update schemas — audit logs are immutable.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from enum import Enum
from typing import Any


class AuditAction(str, Enum):
    """Audit log action types"""
    INSERT = "INSERT"
    UPDATE = "UPDATE"
    DELETE = "DELETE"


# ==========================================
# AuditLogEntry Schema (Full Representation)
# ==========================================

class AuditLogEntry(BaseModel):
    """
    Audit log entry schema - full representation.
    user_email is resolved via JOIN with accounts.User, not a column.
    """
    id: int
    organization_id: int | None = Field(None, description="Organization that made the change")
    user_id: int | None = Field(None, description="User who made the change")
    user_email: str | None = Field(None, description="Resolved from JOIN with accounts.User")
    table_name: str | None = Field(None, description="Table that was changed (e.g., 'scan_targets')")
    record_id: int | None = Field(None, description="ID of the affected record")
    action: str = Field(description="Action type: INSERT, UPDATE, DELETE")
    old_data: dict[str, Any] | None = Field(None, description="State before the change")
    new_data: dict[str, Any] | None = Field(None, description="State after the change")
    timestamp: datetime = Field(description="When the change occurred")
    ip_address: str | None = Field(None, description="IP address of the request")

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Response Types
# ==========================================

class AuditLogEntriesResponse(BaseModel):
    """Response containing multiple audit log entries"""
    success: bool
    data: list[AuditLogEntry] | None = None
    count: int | None = None
