from pydantic import BaseModel, ConfigDict
from datetime import date, datetime

# ==========================================
# Request Schemas
# ==========================================

class PatentAssigneeCreate(BaseModel):
    """Schema for creating a new patent assignee"""
    patent_id: int
    market_organization_id: int
    assignment_date: date


class PatentAssigneeUpdate(BaseModel):
    """Schema for updating a patent assignee"""
    patent_id: int = None
    market_organization_id: int = None
    assignment_date: date = None


# ==========================================
# Response Schemas
# ==========================================

class PatentAssigneeDetail(BaseModel):
    """Schema for patent assignee details"""
    id: int
    patent_id: int
    market_organization_id: int
    assignment_date: date
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PatentAssigneeListResponse(BaseModel):
    """Response schema for listing patent assignees"""
    success: bool
    data: list[PatentAssigneeDetail] | None = None
    count: int = 0
    error: str | None = None


class PatentAssigneeResponse(BaseModel):
    """Response schema for single patent assignee operations"""
    success: bool
    data: PatentAssigneeDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
