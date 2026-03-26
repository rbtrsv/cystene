from pydantic import BaseModel, ConfigDict
from datetime import date, datetime

# ==========================================
# Request Schemas
# ==========================================

class MarketOrganizationCreate(BaseModel):
    """Schema for creating a new market organization"""
    legal_name: str
    isin: str | None = None
    ticker_symbol: str | None = None
    primary_exchange: str | None = None
    org_type: str
    status: str = "Active"
    founded: date | None = None
    headquarters: str | None = None
    website: str | None = None
    employee_count: int | None = None
    revenue_usd: float | None = None


class MarketOrganizationUpdate(BaseModel):
    """Schema for updating a market organization"""
    legal_name: str = None
    isin: str | None = None
    ticker_symbol: str | None = None
    primary_exchange: str | None = None
    org_type: str = None
    status: str = None
    founded: date | None = None
    headquarters: str | None = None
    website: str | None = None
    employee_count: int | None = None
    revenue_usd: float | None = None


# ==========================================
# Response Schemas
# ==========================================

class MarketOrganizationDetail(BaseModel):
    """Schema for market organization details"""
    id: int
    legal_name: str
    isin: str | None = None
    ticker_symbol: str | None = None
    primary_exchange: str | None = None
    org_type: str
    status: str
    founded: date | None = None
    headquarters: str | None = None
    website: str | None = None
    employee_count: int | None = None
    revenue_usd: float | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class MarketOrganizationListResponse(BaseModel):
    """Response schema for listing market organizations"""
    success: bool
    data: list[MarketOrganizationDetail] | None = None
    count: int = 0
    error: str | None = None


class MarketOrganizationResponse(BaseModel):
    """Response schema for single market organization operations"""
    success: bool
    data: MarketOrganizationDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
