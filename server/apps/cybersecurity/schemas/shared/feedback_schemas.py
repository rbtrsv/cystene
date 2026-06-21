"""
Feedback Schemas — in-app bug reports, feature requests, questions.

Field names match the Feedback model (models/feedback_models.py) exactly. `created_by`
(submitter) is enriched on responses with the user's email/name (JOIN on accounts.User).
"""

from enum import Enum
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


# ==========================================
# Enums
# ==========================================

class FeedbackCategory(str, Enum):
    BUG = "bug"
    IMPROVEMENT = "improvement"
    FEATURE = "feature"
    QUESTION = "question"
    OTHER = "other"


class FeedbackStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


# ==========================================
# Request Schemas
# ==========================================

class FeedbackCreate(BaseModel):
    """Schema for submitting feedback (any authenticated user)."""
    category: FeedbackCategory = Field(description="bug | improvement | feature | question | other")
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    page_url: str | None = Field(default=None, description="Page the feedback was submitted from")


class FeedbackContentUpdate(BaseModel):
    """Schema for the submitter (or admin) editing the feedback content (not triage)."""
    category: FeedbackCategory | None = None
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=10)


class FeedbackUpdate(BaseModel):
    """Schema for admin triage — status + internal notes only."""
    status: FeedbackStatus | None = None
    admin_notes: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class FeedbackDetail(BaseModel):
    """Schema for feedback details."""
    id: int
    category: str
    status: str
    title: str
    description: str
    page_url: str | None = None
    admin_notes: str | None = None
    organization_id: int | None = None
    created_by: int | None = None
    # Resolved from accounts.User on created_by so the admin sees who submitted
    # without a second request — enriched-schema pattern.
    user_email: str | None = None
    user_name: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class FeedbackListResponse(BaseModel):
    """Response schema for listing feedback."""
    success: bool
    data: list[FeedbackDetail] | None = None
    count: int = 0
    error: str | None = None


class FeedbackResponse(BaseModel):
    """Response schema for single feedback operations."""
    success: bool
    data: FeedbackDetail | None = None
    error: str | None = None


class FeedbackMessageResponse(BaseModel):
    """Simple message response."""
    success: bool
    message: str | None = None
    error: str | None = None
