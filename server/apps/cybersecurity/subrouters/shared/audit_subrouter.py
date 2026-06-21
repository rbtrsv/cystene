"""
Audit Trail Subrouter

Read-only endpoints for viewing audit log entries.
Audit logs are immutable — no create/update/delete.

Filtering: only shows audit logs from organizations the user belongs to — a user sees
only their own org's activity.

Why organization_id filter:
    Cybersecurity audit rows carry the organization_id snapshot written by log_audit()
    (derived from get_user_organization_id). A user may belong to multiple organizations,
    so an optional org_id param narrows to one.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime
import csv
import io
import logging

from starlette.responses import StreamingResponse

from core.db import get_session
from apps.accounts.models import User, OrganizationMember
from apps.accounts.utils.auth_utils import get_current_user
from ...models import CybersecurityAuditLog
from ...schemas.shared.audit_schemas import (
    AuditLogEntry as AuditLogEntrySchema,
    AuditLogEntriesResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Audit Trail"])


# ==========================================
# Helper — get all org IDs the user has access to
# ==========================================

async def _get_user_org_ids(user_id: int, session: AsyncSession) -> list[int]:
    """Get all organization IDs the user belongs to.
    Why list (not single): user may belong to multiple organizations."""
    result = await session.execute(
        select(OrganizationMember.organization_id)
        .filter(OrganizationMember.user_id == user_id)
    )
    return [row[0] for row in result.all()]


# ==========================================
# Helper — build changes summary for export
# ==========================================

# Fields to skip in changes summary (internal/audit fields)
_SKIP_FIELDS = {"id", "created_at", "updated_at", "created_by", "updated_by", "deleted_at", "deleted_by", "organization_id"}


def _changes_summary(action: str, old_data: dict | None, new_data: dict | None) -> str:
    """Build concise changes summary for CSV export."""
    if action == "INSERT" and new_data:
        items = [f"{k}: {v}" for k, v in list(new_data.items())[:5] if v is not None and k not in _SKIP_FIELDS]
        return "; ".join(items) if items else "Record created"

    if action == "DELETE" and old_data:
        items = [f"{k}: {v}" for k, v in list(old_data.items())[:5] if v is not None and k not in _SKIP_FIELDS]
        return "; ".join(items) if items else "Record deleted"

    if action == "UPDATE" and old_data and new_data:
        changes = []
        for key in new_data:
            old_val = old_data.get(key)
            new_val = new_data.get(key)
            if old_val != new_val and key not in _SKIP_FIELDS:
                changes.append(f"{key}: '{old_val}' → '{new_val}'")
        return "; ".join(changes[:5]) if changes else "No data changes"

    return ""


# ==========================================
# List Audit Logs — Organization Level
# ==========================================

@router.get("/", response_model=AuditLogEntriesResponse)
async def list_audit_logs(
    organization_id: Optional[int] = Query(None, description="Filter by specific org (user must be member)"),
    table_name: Optional[str] = Query(None, description="Filter by table name (e.g., 'scan_targets')"),
    action: Optional[str] = Query(None, description="Filter by action (INSERT, UPDATE, DELETE)"),
    start_date: Optional[datetime] = Query(None, description="Filter logs from this date"),
    end_date: Optional[datetime] = Query(None, description="Filter logs until this date"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    List audit log entries for the user's organizations.

    Shows only changes made by the user's organization(s).
    If organization_id is provided, filters to that specific org (user must be a member).
    """
    try:
        # Get all orgs the user belongs to
        user_org_ids = await _get_user_org_ids(user.id, session)
        if not user_org_ids:
            return AuditLogEntriesResponse(success=True, data=[], count=0)

        # If specific org requested, verify user is member
        if organization_id:
            if organization_id not in user_org_ids:
                raise HTTPException(status_code=403, detail="You are not a member of this organization")
            filter_org_ids = [organization_id]
        else:
            filter_org_ids = user_org_ids

        # Count total
        count_query = (
            select(func.count(CybersecurityAuditLog.id))
            .filter(CybersecurityAuditLog.organization_id.in_(filter_org_ids))
        )
        if table_name:
            count_query = count_query.filter(CybersecurityAuditLog.table_name == table_name)
        if action:
            count_query = count_query.filter(CybersecurityAuditLog.action == action)
        if start_date:
            count_query = count_query.filter(CybersecurityAuditLog.timestamp >= start_date)
        if end_date:
            count_query = count_query.filter(CybersecurityAuditLog.timestamp <= end_date)
        if user_id:
            count_query = count_query.filter(CybersecurityAuditLog.user_id == user_id)

        count_result = await session.execute(count_query)
        total_count = count_result.scalar()

        # Build query with LEFT JOIN to resolve user_email
        query = (
            select(CybersecurityAuditLog, User.email.label("user_email"))
            .outerjoin(User, CybersecurityAuditLog.user_id == User.id)
            .filter(CybersecurityAuditLog.organization_id.in_(filter_org_ids))
        )

        # Apply optional filters
        if table_name:
            query = query.filter(CybersecurityAuditLog.table_name == table_name)
        if action:
            query = query.filter(CybersecurityAuditLog.action == action)
        if start_date:
            query = query.filter(CybersecurityAuditLog.timestamp >= start_date)
        if end_date:
            query = query.filter(CybersecurityAuditLog.timestamp <= end_date)
        if user_id:
            query = query.filter(CybersecurityAuditLog.user_id == user_id)

        # Order by timestamp DESC (most recent first) + pagination
        query = query.order_by(CybersecurityAuditLog.timestamp.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        rows = result.all()

        # Build response — merge audit log fields + resolved user_email
        entries = []
        for audit_log, user_email in rows:
            entry_data = {
                "id": audit_log.id,
                "organization_id": audit_log.organization_id,
                "user_id": audit_log.user_id,
                "user_email": user_email,
                "table_name": audit_log.table_name,
                "record_id": audit_log.record_id,
                "action": audit_log.action,
                "old_data": audit_log.old_data,
                "new_data": audit_log.new_data,
                "timestamp": audit_log.timestamp,
                "ip_address": audit_log.ip_address,
            }
            entries.append(AuditLogEntrySchema.model_validate(entry_data))

        return AuditLogEntriesResponse(success=True, data=entries, count=total_count)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to list audit logs: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# Export Audit Logs — CSV
# ==========================================

@router.get("/export")
async def export_audit_logs(
    format: str = Query("csv", description="Export format: 'csv'"),
    organization_id: Optional[int] = Query(None, description="Filter by specific org"),
    table_name: Optional[str] = Query(None, description="Filter by table name"),
    action: Optional[str] = Query(None, description="Filter by action"),
    start_date: Optional[datetime] = Query(None, description="Filter from date"),
    end_date: Optional[datetime] = Query(None, description="Filter until date"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    limit: int = Query(5000, le=10000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Export audit log entries as CSV."""
    try:
        if format != "csv":
            raise HTTPException(status_code=400, detail="Only CSV export is supported")

        # Get accessible org IDs
        user_org_ids = await _get_user_org_ids(user.id, session)
        if not user_org_ids:
            raise HTTPException(status_code=404, detail="No accessible organizations found")

        if organization_id:
            if organization_id not in user_org_ids:
                raise HTTPException(status_code=403, detail="You are not a member of this organization")
            filter_org_ids = [organization_id]
        else:
            filter_org_ids = user_org_ids

        # Build query
        query = (
            select(CybersecurityAuditLog, User.email.label("user_email"))
            .outerjoin(User, CybersecurityAuditLog.user_id == User.id)
            .filter(CybersecurityAuditLog.organization_id.in_(filter_org_ids))
        )

        if table_name:
            query = query.filter(CybersecurityAuditLog.table_name == table_name)
        if action:
            query = query.filter(CybersecurityAuditLog.action == action)
        if start_date:
            query = query.filter(CybersecurityAuditLog.timestamp >= start_date)
        if end_date:
            query = query.filter(CybersecurityAuditLog.timestamp <= end_date)
        if user_id:
            query = query.filter(CybersecurityAuditLog.user_id == user_id)

        query = query.order_by(CybersecurityAuditLog.timestamp.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        rows = result.all()

        # Generate CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Timestamp", "User", "Table", "Action", "Record ID", "Changes"])

        for audit_log, user_email in rows:
            writer.writerow([
                audit_log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if audit_log.timestamp else "",
                user_email or "System",
                audit_log.table_name or "",
                audit_log.action,
                str(audit_log.record_id) if audit_log.record_id else "",
                _changes_summary(audit_log.action, audit_log.old_data, audit_log.new_data),
            ])

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=cystene-audit-trail-{datetime.now().strftime('%Y%m%d')}.csv"},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to export audit logs: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
