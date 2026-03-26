"""
Nudgio Schemas — Ecommerce Connection

Platform connection CRUD schemas, platform/method enums, test response.
"""

from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from datetime import datetime
from enum import Enum


# ==========================================
# Enums
# ==========================================

class PlatformType(str, Enum):
    """Supported ecommerce platforms"""
    SHOPIFY = "shopify"
    WOOCOMMERCE = "woocommerce"
    MAGENTO = "magento"
    CUSTOM_INTEGRATION = "custom_integration"


class ConnectionMethod(str, Enum):
    """Connection method: API (REST), DATABASE (direct SQL), or INGEST (local push/sync)"""
    API = "api"
    DATABASE = "database"
    INGEST = "ingest"


class SyncInterval(str, Enum):
    """Auto-sync frequency — how often sync_connection_data() runs for this connection"""
    HOURLY = "hourly"
    EVERY_6_HOURS = "every_6_hours"
    DAILY = "daily"
    WEEKLY = "weekly"


# ==========================================
# Request Schemas
# ==========================================

class EcommerceConnectionCreate(BaseModel):
    """Schema for creating a new ecommerce connection"""
    connection_name: str = Field(description="Human-readable name for this connection")
    platform: PlatformType = Field(description="Ecommerce platform: shopify, woocommerce, magento")
    connection_method: ConnectionMethod = Field(default=ConnectionMethod.API, description="API (REST) or DATABASE (direct SQL)")
    # API-based fields
    store_url: str | None = Field(default=None, description="Store URL, e.g. https://mystore.myshopify.com")
    api_key: str | None = Field(default=None, description="API key. WooCommerce: consumer_key (ck_xxx)")
    api_secret: str | None = Field(default=None, description="API secret. WooCommerce: consumer_secret, Magento/Shopify: access token")
    # Database-based fields (only needed for connection_method=database)
    db_host: str | None = Field(default=None, description="Database host address")
    db_name: str | None = Field(default=None, description="Database name")
    db_user: str | None = Field(default=None, description="Database username")
    db_password: str | None = Field(default=None, description="Database password")
    db_port: int | None = Field(default=None, description="Database port (default: 3306 for MySQL, 443 for API)")

    @field_validator('connection_name')
    @classmethod
    def validate_connection_name(cls, v):
        if not v or len(v.strip()) < 3:
            raise ValueError('Connection name must be at least 3 characters')
        return v.strip()

    @model_validator(mode='after')
    def validate_connection_fields(self):
        """Validate required fields based on connection_method"""
        if self.connection_method == ConnectionMethod.API:
            # API connections require store_url
            if not self.store_url or len(self.store_url.strip()) < 3:
                raise ValueError('Store URL is required for API connections')
            self.store_url = self.store_url.strip()
            # Set default port for API connections
            if self.db_port is None:
                self.db_port = 443
        elif self.connection_method == ConnectionMethod.DATABASE:
            # Database connections require db_host and db_password
            if not self.db_host or len(self.db_host.strip()) < 3:
                raise ValueError('Database host is required for database connections')
            if not self.db_password:
                raise ValueError('Database password is required for database connections')
            self.db_host = self.db_host.strip()
            # Set default port for database connections
            if self.db_port is None:
                if self.platform == PlatformType.SHOPIFY:
                    self.db_port = 443
                else:
                    self.db_port = 3306  # MySQL default for WooCommerce/Magento
        elif self.connection_method == ConnectionMethod.INGEST:
            # Ingest connections receive data via Push API or Auto-Sync — no credentials needed
            pass
        return self


class EcommerceConnectionUpdate(BaseModel):
    """Schema for updating an ecommerce connection — all fields optional (partial update)"""
    connection_name: str | None = Field(default=None, description="Human-readable name for this connection")
    platform: PlatformType | None = Field(default=None, description="Ecommerce platform: shopify, woocommerce, magento")
    connection_method: ConnectionMethod | None = Field(default=None, description="API (REST) or DATABASE (direct SQL)")
    store_url: str | None = Field(default=None, description="Store URL, e.g. https://mystore.myshopify.com")
    api_key: str | None = Field(default=None, description="API key. WooCommerce: consumer_key (ck_xxx)")
    api_secret: str | None = Field(default=None, description="API secret. WooCommerce: consumer_secret, Magento/Shopify: access token")
    db_host: str | None = Field(default=None, description="Database host address")
    db_name: str | None = Field(default=None, description="Database name")
    db_user: str | None = Field(default=None, description="Database username")
    db_password: str | None = Field(default=None, description="Database password")
    db_port: int | None = Field(default=None, description="Database port")
    # Auto-Sync settings — periodic data pull from platform adapters
    auto_sync_enabled: bool | None = Field(default=None, description="Enable periodic auto-sync")
    sync_interval: SyncInterval | None = Field(default=None, description="Sync frequency: hourly, every_6_hours, daily, weekly")


# ==========================================
# Response Schemas
# ==========================================

class EcommerceConnectionDetail(BaseModel):
    """Schema for ecommerce connection details"""
    id: int = Field(description="Connection ID")
    connection_name: str = Field(description="Human-readable name for this connection")
    platform: PlatformType = Field(description="Ecommerce platform")
    connection_method: ConnectionMethod = Field(description="Connection method: api or database")
    # API fields (api_key/api_secret intentionally excluded — never expose secrets)
    store_url: str | None = Field(default=None, description="Store URL")
    # Database fields (db_password intentionally excluded — never expose secrets)
    db_host: str | None = Field(default=None, description="Database host address")
    db_name: str | None = Field(default=None, description="Database name")
    db_user: str | None = Field(default=None, description="Database username")
    db_port: int | None = Field(default=None, description="Database port")
    is_active: bool = Field(description="Whether connection has been tested and is active")
    # Auto-Sync fields — periodic data pull status and schedule
    auto_sync_enabled: bool = Field(description="Whether auto-sync is enabled")
    sync_interval: str = Field(description="Sync frequency: hourly, every_6_hours, daily, weekly")
    last_synced_at: datetime | None = Field(default=None, description="When last sync completed")
    next_sync_at: datetime | None = Field(default=None, description="When next auto-sync is scheduled")
    last_sync_status: str | None = Field(default=None, description="Last sync result: success or error")
    created_at: datetime = Field(description="When the connection was created")
    updated_at: datetime | None = Field(default=None, description="When the connection was last updated")

    model_config = ConfigDict(from_attributes=True)


class EcommerceConnectionResponse(BaseModel):
    """Response schema for single ecommerce connection operations"""
    success: bool = Field(description="Whether the operation succeeded")
    data: EcommerceConnectionDetail | None = Field(default=None, description="Connection details")
    error: str | None = Field(default=None, description="Error message if operation failed")


class EcommerceConnectionListResponse(BaseModel):
    """Response schema for listing ecommerce connections"""
    success: bool = Field(description="Whether the operation succeeded")
    data: list[EcommerceConnectionDetail] | None = Field(default=None, description="List of connections")
    count: int = Field(default=0, description="Total number of connections")
    error: str | None = Field(default=None, description="Error message if operation failed")


class EcommerceConnectionTestResponse(BaseModel):
    """Response schema for connection test results"""
    success: bool = Field(description="Whether the connection test succeeded")
    message: str = Field(description="Test result message with details")
    sample_products_count: int = Field(default=0, description="Number of sample products retrieved")


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool = Field(description="Whether the operation succeeded")
    message: str | None = Field(default=None, description="Response message")
    error: str | None = Field(default=None, description="Error message if operation failed")
