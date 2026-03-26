"""
Nudgio Schemas — Widget API Key

CRUD schemas for widget API key management.
Keys are used for HMAC-signed public widget URLs (non-Shopify platforms).
"""

from pydantic import BaseModel, Field
from datetime import datetime


# ==========================================
# Request Schemas
# ==========================================

class WidgetAPIKeyCreate(BaseModel):
    """Schema for creating a new widget API key"""
    name: str = Field(description="Human-readable label for this key (e.g., 'Production key')")
    allowed_domains: str | None = Field(default=None, description="Comma-separated domains — secondary signal, not primary auth (e.g., 'myshop.com,www.myshop.com')")


# ==========================================
# Response Schemas
# ==========================================

class WidgetAPIKeyCreatedDetail(BaseModel):
    """
    Schema returned ONCE on key creation — includes plaintext api_key.
    After this response, the plaintext key is never retrievable again.
    """
    id: int = Field(description="Key ID — used as key_id in signed widget URLs")
    name: str = Field(description="Human-readable label")
    api_key: str = Field(description="Plaintext API secret (shown once, never again) — used for HMAC signing")
    api_key_prefix: str = Field(description="Display prefix (e.g., 'nk_a1b2c3d4') — safe to show in dashboard")
    created_at: datetime = Field(description="When the key was created")


class WidgetAPIKeyDetail(BaseModel):
    """Schema for listing keys — no plaintext secret, only prefix"""
    id: int = Field(description="Key ID — used as key_id in signed widget URLs")
    name: str = Field(description="Human-readable label")
    api_key_prefix: str = Field(description="Display prefix (e.g., 'nk_a1b2c3d4') — safe to show in dashboard")
    allowed_domains: str | None = Field(default=None, description="Comma-separated allowed domains (or null for any)")
    is_active: bool = Field(description="Whether the key is active")
    created_at: datetime = Field(description="When the key was created")


class WidgetAPIKeyCreatedResponse(BaseModel):
    """Response schema for key creation — includes plaintext secret (shown once)"""
    success: bool = Field(description="Whether the operation succeeded")
    data: WidgetAPIKeyCreatedDetail | None = Field(default=None, description="Created key details with plaintext secret")
    error: str | None = Field(default=None, description="Error message if operation failed")


class WidgetAPIKeyListResponse(BaseModel):
    """Response schema for listing widget API keys"""
    success: bool = Field(description="Whether the operation succeeded")
    data: list[WidgetAPIKeyDetail] | None = Field(default=None, description="List of keys (no secrets)")
    count: int = Field(default=0, description="Total number of keys")
    error: str | None = Field(default=None, description="Error message if operation failed")


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool = Field(description="Whether the operation succeeded")
    message: str | None = Field(default=None, description="Response message")
    error: str | None = Field(default=None, description="Error message if operation failed")
