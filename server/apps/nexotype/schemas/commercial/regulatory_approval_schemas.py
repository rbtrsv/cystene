from pydantic import BaseModel, ConfigDict
from datetime import date, datetime

# ==========================================
# Request Schemas
# ==========================================

class RegulatoryApprovalCreate(BaseModel):
    """Schema for creating a new regulatory approval"""
    asset_id: int
    indication_id: int
    agency: str
    approval_type: str
    approval_date: date
    status: str


class RegulatoryApprovalUpdate(BaseModel):
    """Schema for updating a regulatory approval"""
    asset_id: int = None
    indication_id: int = None
    agency: str = None
    approval_type: str = None
    approval_date: date = None
    status: str = None


# ==========================================
# Response Schemas
# ==========================================

class RegulatoryApprovalDetail(BaseModel):
    """Schema for regulatory approval details"""
    id: int
    asset_id: int
    indication_id: int
    agency: str
    approval_type: str
    approval_date: date
    status: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class RegulatoryApprovalListResponse(BaseModel):
    """Response schema for listing regulatory approvals"""
    success: bool
    data: list[RegulatoryApprovalDetail] | None = None
    count: int = 0
    error: str | None = None


class RegulatoryApprovalResponse(BaseModel):
    """Response schema for single regulatory approval operations"""
    success: bool
    data: RegulatoryApprovalDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
