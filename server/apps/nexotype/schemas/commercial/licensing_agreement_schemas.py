from pydantic import BaseModel, ConfigDict
from datetime import date, datetime

# ==========================================
# Request Schemas
# ==========================================

class LicensingAgreementCreate(BaseModel):
    """Schema for creating a new licensing agreement"""
    licensor_id: int
    licensee_id: int
    asset_id: int | None = None
    patent_id: int | None = None
    agreement_type: str
    territory: str | None = None
    value_usd: float | None = None
    start_date: date
    end_date: date | None = None
    status: str


class LicensingAgreementUpdate(BaseModel):
    """Schema for updating a licensing agreement"""
    licensor_id: int = None
    licensee_id: int = None
    asset_id: int | None = None
    patent_id: int | None = None
    agreement_type: str = None
    territory: str | None = None
    value_usd: float | None = None
    start_date: date = None
    end_date: date | None = None
    status: str = None


# ==========================================
# Response Schemas
# ==========================================

class LicensingAgreementDetail(BaseModel):
    """Schema for licensing agreement details"""
    id: int
    licensor_id: int
    licensee_id: int
    asset_id: int | None = None
    patent_id: int | None = None
    agreement_type: str
    territory: str | None = None
    value_usd: float | None = None
    start_date: date
    end_date: date | None = None
    status: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class LicensingAgreementListResponse(BaseModel):
    """Response schema for listing licensing agreements"""
    success: bool
    data: list[LicensingAgreementDetail] | None = None
    count: int = 0
    error: str | None = None


class LicensingAgreementResponse(BaseModel):
    """Response schema for single licensing agreement operations"""
    success: bool
    data: LicensingAgreementDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
