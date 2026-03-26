from pydantic import BaseModel
from typing import Any
from enum import Enum

# ==========================================
# Enums
# ==========================================

class SubscriptionStatus(str, Enum):
    """Subscription status types"""
    ACTIVE = "ACTIVE"
    CANCELED = "CANCELED"
    PAST_DUE = "PAST_DUE"
    UNPAID = "UNPAID"
    TRIALING = "TRIALING"

# ==========================================
# Stripe Schemas
# ==========================================

class PriceDetail(BaseModel):
    """Schema for Stripe price details"""
    id: str
    product_id: str
    name: str
    description: str | None = None
    amount: float
    currency: str
    interval: str | None = None
    interval_count: int | None = None
    trial_period_days: int | None = None
    features: list[str] | None = None


class ProductDetail(BaseModel):
    """Schema for Stripe product details"""
    id: str
    name: str
    description: str | None = None
    features: list[str]
    defaultPriceId: str | None = None
    metadata: dict[str, Any]

# ==========================================
# Response Schemas
# ==========================================

class SubscriptionPlansResponse(BaseModel):
    """Response schema for subscription plans"""
    success: bool
    data: dict[str, Any] | None = None
    error: str | None = None


class UrlResponse(BaseModel):
    """Schema for URL response"""
    success: bool
    url: str | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None


class SubscriptionInfoResponse(BaseModel):
    """Response schema for current subscription info"""
    success: bool
    data: dict[str, Any] | None = None
    error: str | None = None