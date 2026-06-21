"""
Feedback Subrouter — in-app bug reports, feature requests, questions.

Cross-cutting (not a security entity): mounted on the gated cybersecurity router, so any
user with an active subscription (including FREE) can reach it. Access is owner-or-admin
(NOT the org-scoped model), so the logic is explicit per endpoint — no shared owner filter.

Pattern: CRUD via the crud_utils helpers (create_with_audit / update_with_audit /
soft_delete_with_audit) — one call wraps the DB op + the explicit audit log.
Soft-delete via deleted_at/deleted_by.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user
from apps.accounts.schemas.auth_schemas import UserRole
from apps.accounts.utils.dependency_utils import require_user_role

# CybersecurityFeedback (prefixed, like CybersecurityAuditLog) aliased to Feedback for brevity.
from ...models import CybersecurityFeedback as Feedback
from ...schemas.shared.feedback_schemas import (
    FeedbackCreate,
    FeedbackContentUpdate,
    FeedbackUpdate,
    FeedbackDetail,
    FeedbackListResponse,
    FeedbackResponse,
    FeedbackMessageResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.crud_utils import create_with_audit, update_with_audit, soft_delete_with_audit

router = APIRouter(tags=["Feedback"])
logger = logging.getLogger(__name__)


# ==========================================
# Helpers
# ==========================================

def _is_admin(user: User) -> bool:
    """Platform admin — sees all feedback and manages status/notes.

    Case-insensitive: User.role is free-form String(50), legacy rows may have mixed casing.
    """
    return (user.role or "").upper() == UserRole.ADMIN.value


async def _enrich_user(db: AsyncSession, item: Feedback) -> FeedbackDetail:
    """Resolve the submitter's email/name from accounts.User (created_by)."""
    detail = FeedbackDetail.model_validate(item, from_attributes=True)
    if item.created_by:
        row = (await db.execute(
            select(User.email, User.name).where(User.id == item.created_by)
        )).first()
        if row:
            detail.user_email, detail.user_name = row[0], row[1]
    return detail


async def _get_feedback_or_404(db: AsyncSession, feedback_id: int) -> Feedback:
    """Fetch a non-deleted feedback row or raise 404."""
    item = (await db.execute(
        select(Feedback).where(Feedback.id == feedback_id, Feedback.deleted_at.is_(None))
    )).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return item


# ==========================================
# Endpoints
# ==========================================

@router.get("/", response_model=FeedbackListResponse)
async def list_feedback(
    status: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List feedback.

    Why admin/own split: a normal user only ever sees their own submissions; a platform
    admin sees everyone's for triage. Soft-deleted rows are excluded; optional status filter.
    Each row is JOINed to accounts.User so it carries the submitter's email/name.
    """
    try:
        count_query = select(func.count(Feedback.id)).where(Feedback.deleted_at.is_(None))
        data_query = (
            select(Feedback, User.email, User.name)
            .join(User, User.id == Feedback.created_by, isouter=True)
            .where(Feedback.deleted_at.is_(None))
            .order_by(Feedback.created_at.desc())
        )
        if not _is_admin(user):
            count_query = count_query.where(Feedback.created_by == user.id)
            data_query = data_query.where(Feedback.created_by == user.id)
        if status:
            count_query = count_query.where(Feedback.status == status)
            data_query = data_query.where(Feedback.status == status)

        total_count = (await db.execute(count_query)).scalar()
        result = await db.execute(data_query)

        data = []
        for fb, user_email, user_name in result.all():
            detail = FeedbackDetail.model_validate(fb, from_attributes=True)
            detail.user_email = user_email
            detail.user_name = user_name
            data.append(detail)

        return FeedbackListResponse(success=True, data=data, count=total_count)
    except Exception as e:
        logger.exception(f"Failed to list feedback: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback(
    feedback_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get one feedback item. Owner or admin only (otherwise 403). Returns the submitter's
    email/name resolved.
    """
    try:
        item = await _get_feedback_or_404(db, feedback_id)
        if item.created_by != user.id and not _is_admin(user):
            raise HTTPException(status_code=403, detail="Not allowed")
        return FeedbackResponse(success=True, data=await _enrich_user(db, item))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to get feedback: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/", response_model=FeedbackResponse)
async def create_feedback(
    payload: FeedbackCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Submit feedback (any authenticated user). Stamps created_by + a snapshot of the
    submitter's active org (triage context for the admin) + logs the creation.
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        # mode="json" → the category enum serializes to its string value ("bug") for the String column.
        # create_with_audit stamps created_by + org, flushes, and writes the INSERT audit.
        item = await create_with_audit(
            db, Feedback, "cybersecurity_feedback",
            payload.model_dump(mode="json"), user.id, org_id,
        )
        await db.commit()
        await db.refresh(item)

        detail = FeedbackDetail.model_validate(item, from_attributes=True)
        detail.user_email, detail.user_name = user.email, user.name
        return FeedbackResponse(success=True, data=detail)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to create feedback: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{feedback_id}", response_model=FeedbackResponse)
async def update_feedback(
    feedback_id: int,
    payload: FeedbackContentUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Edit feedback CONTENT (category/title/description) — the submitter or an admin.
    Triage (status/admin_notes) is a separate admin-only endpoint (PUT /{id}/admin).
    """
    try:
        item = await _get_feedback_or_404(db, feedback_id)
        if item.created_by != user.id and not _is_admin(user):
            raise HTTPException(status_code=403, detail="Not allowed")
        org_id = await get_user_organization_id(user.id, db)

        # exclude_unset → only the fields the user actually sent are touched.
        item = await update_with_audit(
            db, item, "cybersecurity_feedback",
            payload.model_dump(exclude_unset=True, mode="json"), user.id, org_id,
        )
        await db.commit()
        await db.refresh(item)

        return FeedbackResponse(success=True, data=await _enrich_user(db, item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to update feedback: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{feedback_id}/admin", response_model=FeedbackResponse)
async def admin_update_feedback(
    feedback_id: int,
    payload: FeedbackUpdate,
    # Gate enforced by require_user_role("ADMIN") — non-admins get 403 before the body runs.
    user: User = Depends(require_user_role("ADMIN")),
    db: AsyncSession = Depends(get_session),
):
    """
    Triage feedback — admin only. Updates status + admin_notes.
    """
    try:
        item = await _get_feedback_or_404(db, feedback_id)
        org_id = await get_user_organization_id(user.id, db)

        item = await update_with_audit(
            db, item, "cybersecurity_feedback",
            payload.model_dump(exclude_unset=True, mode="json"), user.id, org_id,
        )
        await db.commit()
        await db.refresh(item)

        return FeedbackResponse(success=True, data=await _enrich_user(db, item))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to admin-update feedback: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{feedback_id}", response_model=FeedbackMessageResponse)
async def delete_feedback(
    feedback_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Delete feedback (soft delete). Admin may delete any row; the owner only while
    status='open'. Sets deleted_at/deleted_by and logs the deletion.
    """
    try:
        item = await _get_feedback_or_404(db, feedback_id)
        is_owner_open = item.created_by == user.id and item.status == "open"
        if not _is_admin(user) and not is_owner_open:
            raise HTTPException(status_code=403, detail="Not allowed")
        org_id = await get_user_organization_id(user.id, db)

        await soft_delete_with_audit(db, item, "cybersecurity_feedback", user.id, org_id)
        await db.commit()

        return FeedbackMessageResponse(success=True, message=f"Feedback {feedback_id} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to delete feedback: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
