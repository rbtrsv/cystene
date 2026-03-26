from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..models import AccountsAuditLog, Organization, User
from core.db import async_session

# ==========================================
# Audit Logging
# ==========================================

async def log_audit(
    organization: Organization,
    user: Optional[User] = None,
    action: str = "",
    ip_address: str = "",
    session: Optional[AsyncSession] = None
):
    """
    Creates a new AccountsAuditLog entry for a given organization and user

    Args:
        organization: The organization where the activity occurred
        user: The user who performed the action (None for system actions)
        action: Description of the action that was performed
        ip_address: IP address of the user
        session: Optional SQLAlchemy session (will create one if not provided)
    """
    # Use provided session or get a new one
    if session:
        # Only session.add — caller is responsible for committing
        audit_log = AccountsAuditLog(
            organization_id=organization.id,
            user_id=user.id if user else None,
            action=action,
            ip_address=ip_address
        )
        session.add(audit_log)
    else:
        async with async_session() as db_session:
            audit_log = AccountsAuditLog(
                organization_id=organization.id,
                user_id=user.id if user else None,
                action=action,
                ip_address=ip_address
            )
            db_session.add(audit_log)
            await db_session.commit()


async def get_organization_audit_logs(organization_id: int, limit: int = 100) -> List[AccountsAuditLog]:
    """
    Get recent audit logs for an organization

    Args:
        organization_id: The ID of the organization
        limit: Maximum number of logs to return

    Returns:
        List of AccountsAuditLog objects
    """
    async with async_session() as session:
        result = await session.execute(
            select(AccountsAuditLog)
            .options(selectinload(AccountsAuditLog.user))
            .filter(AccountsAuditLog.organization_id == organization_id)
            .order_by(AccountsAuditLog.timestamp.desc())
            .limit(limit)
        )
        return result.scalars().all()


async def get_user_audit_logs(user_id: int, limit: int = 100) -> List[AccountsAuditLog]:
    """
    Get recent audit logs for a specific user

    Args:
        user_id: The ID of the user
        limit: Maximum number of logs to return

    Returns:
        List of AccountsAuditLog objects
    """
    async with async_session() as session:
        result = await session.execute(
            select(AccountsAuditLog)
            .options(selectinload(AccountsAuditLog.organization))
            .filter(AccountsAuditLog.user_id == user_id)
            .order_by(AccountsAuditLog.timestamp.desc())
            .limit(limit)
        )
        return result.scalars().all()
