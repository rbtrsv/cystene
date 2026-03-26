from pydantic import BaseModel, ConfigDict
from datetime import date, datetime

# ==========================================
# Request Schemas
# ==========================================

class PatentCreate(BaseModel):
    """Schema for creating a new patent"""
    jurisdiction: str
    patent_number: str
    title: str | None = None
    status: str = "Pending"
    filing_date: date | None = None
    expiry_date: date | None = None


class PatentUpdate(BaseModel):
    """Schema for updating a patent"""
    jurisdiction: str = None
    patent_number: str = None
    title: str | None = None
    status: str = None
    filing_date: date | None = None
    expiry_date: date | None = None


# ==========================================
# Response Schemas
# ==========================================

class PatentDetail(BaseModel):
    """Schema for patent details"""
    id: int
    jurisdiction: str
    patent_number: str
    title: str | None = None
    status: str
    filing_date: date | None = None
    expiry_date: date | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PatentListResponse(BaseModel):
    """Response schema for listing patents"""
    success: bool
    data: list[PatentDetail] | None = None
    count: int = 0
    error: str | None = None


class PatentResponse(BaseModel):
    """Response schema for single patent operations"""
    success: bool
    data: PatentDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
