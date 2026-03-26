from pydantic import BaseModel, ConfigDict
from datetime import date, datetime

# ==========================================
# Request Schemas
# ==========================================

class TransactionCreate(BaseModel):
    """Schema for creating a new transaction"""
    buyer_id: int
    seller_id: int | None = None
    asset_id: int | None = None
    patent_id: int | None = None
    transaction_type: str
    value_usd: float | None = None
    announced_date: date


class TransactionUpdate(BaseModel):
    """Schema for updating a transaction"""
    buyer_id: int = None
    seller_id: int | None = None
    asset_id: int | None = None
    patent_id: int | None = None
    transaction_type: str = None
    value_usd: float | None = None
    announced_date: date = None


# ==========================================
# Response Schemas
# ==========================================

class TransactionDetail(BaseModel):
    """Schema for transaction details"""
    id: int
    buyer_id: int
    seller_id: int | None = None
    asset_id: int | None = None
    patent_id: int | None = None
    transaction_type: str
    value_usd: float | None = None
    announced_date: date
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TransactionListResponse(BaseModel):
    """Response schema for listing transactions"""
    success: bool
    data: list[TransactionDetail] | None = None
    count: int = 0
    error: str | None = None


class TransactionResponse(BaseModel):
    """Response schema for single transaction operations"""
    success: bool
    data: TransactionDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
