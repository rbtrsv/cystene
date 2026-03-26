"""
Nudgio Models — Ecommerce

Platform connections, recommendation settings, API usage tracking, recommendation analytics.
"""

from sqlalchemy import Integer, String, Boolean, DateTime, Float, ForeignKey, Text, UniqueConstraint, text
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional
from core.db import Base


# ==========================================
# BASE MIXIN — Every Domain Model Gets This
# ==========================================

class BaseMixin:
    """
    Universal fields for all domain models.
    Provides: timestamps, soft delete, user audit.

    Usage:
        class EcommerceConnection(BaseMixin, Base):
            __tablename__ = "ecommerce_connections"
            ...
    """

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    # Soft delete — NULL = active, SET = deleted (timestamp records when)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_by: Mapped[int | None] = mapped_column(Integer, nullable=True)  # User ID who deleted

    # User audit — loose coupling to accounts.User (not FK)
    created_by: Mapped[int | None] = mapped_column(Integer, nullable=True)  # User ID who created
    updated_by: Mapped[int | None] = mapped_column(Integer, nullable=True)  # User ID who last modified


# ==========================================
# 1. PLATFORM CONNECTIONS
# ==========================================

class EcommerceConnection(BaseMixin, Base):
    """
    Purpose: Stores credentials and configuration for connecting to a merchant's ecommerce platform.
    Scope: Multi-platform (Shopify, WooCommerce, Magento).
    Usage: "My Shopify Store via API", "WooCommerce Production via Database".
    """
    __tablename__ = "ecommerce_connections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)  # "shopify", "woocommerce", "magento"
    connection_name: Mapped[str] = mapped_column(String(255), nullable=False)
    connection_method: Mapped[str] = mapped_column(String(50), default="api")  # "api", "database"

    # API-based connection fields
    store_url: Mapped[str | None] = mapped_column(String(500), nullable=True)  # "https://mystore.myshopify.com"
    api_key: Mapped[str | None] = mapped_column(String(512), nullable=True)  # WooCommerce: consumer_key
    api_secret: Mapped[str | None] = mapped_column(String(512), nullable=True)  # WooCommerce: consumer_secret, Magento/Shopify: access token

    # Database-based connection fields (not needed for API connections)
    db_host: Mapped[str | None] = mapped_column(String(255), nullable=True)
    db_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    db_user: Mapped[str | None] = mapped_column(String(255), nullable=True)
    db_password: Mapped[str | None] = mapped_column(String(512), nullable=True)
    db_port: Mapped[int | None] = mapped_column(Integer, nullable=True, default=3306)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Auto-Sync schedule — periodic data pull from platform adapters
    # Why: without these, sync is manual-only and data goes stale
    auto_sync_enabled: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))
    sync_interval: Mapped[str] = mapped_column(String(50), default="daily", server_default="daily")  # "hourly", "every_6_hours", "daily", "weekly"
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_sync_status: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "success", "error"

    # Relationships
    settings: Mapped[Optional["RecommendationSettings"]] = relationship(back_populates="connection", uselist=False, cascade="all, delete-orphan")
    usage_tracking: Mapped[list["APIUsageTracking"]] = relationship(back_populates="connection", cascade="all, delete-orphan")
    analytics: Mapped[list["RecommendationAnalytics"]] = relationship(back_populates="connection", cascade="all, delete-orphan")
    shopify_billing: Mapped[Optional["ShopifyBilling"]] = relationship(back_populates="connection", uselist=False, cascade="all, delete-orphan")
    widget_api_keys: Mapped[list["WidgetAPIKey"]] = relationship(back_populates="connection", cascade="all, delete-orphan")
    ingested_products: Mapped[list["IngestedProduct"]] = relationship(back_populates="connection", cascade="all, delete-orphan")
    ingested_orders: Mapped[list["IngestedOrder"]] = relationship(back_populates="connection", cascade="all, delete-orphan")
    ingested_order_items: Mapped[list["IngestedOrderItem"]] = relationship(back_populates="connection", cascade="all, delete-orphan")


# ==========================================
# 2. RECOMMENDATION SETTINGS
# ==========================================

class RecommendationSettings(BaseMixin, Base):
    """
    Purpose: Per-connection configuration for recommendation algorithms.
    Scope: Controls bestseller method, lookback windows, upsell thresholds, shop URLs.
    Usage: "Use volume-based bestsellers with 30-day lookback for My Shopify Store".
    """
    __tablename__ = "recommendation_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    connection_id: Mapped[int] = mapped_column(Integer, ForeignKey("ecommerce_connections.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Algorithm configuration
    bestseller_method: Mapped[str] = mapped_column(String(50), default="volume")  # "volume", "value", "balanced"
    bestseller_lookback_days: Mapped[int] = mapped_column(Integer, default=30)
    crosssell_lookback_days: Mapped[int] = mapped_column(Integer, default=30)
    max_recommendations: Mapped[int] = mapped_column(Integer, default=10)
    min_price_increase_percent: Mapped[int] = mapped_column(Integer, default=10)  # Upsell threshold

    # Shop URL configuration for HTML components
    shop_base_url: Mapped[str | None] = mapped_column(String(500), nullable=True)  # "https://myshop.myshopify.com"
    product_url_template: Mapped[str | None] = mapped_column(String(500), nullable=True)  # "/products/{handle}"

    # Brand identity defaults — visual settings for widget rendering
    # None = use hardcoded default in widget endpoints. Fallback chain: URL param → DB → hardcoded.
    # 35 settings across 8 groups — each independently configurable.

    # Group 1: Widget Container
    widget_bg_color: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "#FFFFFF"
    widget_padding: Mapped[int | None] = mapped_column(Integer, nullable=True)  # padding in pixels

    # Group 2: Widget Title
    widget_title: Mapped[str | None] = mapped_column(String(200), nullable=True)  # "Our Picks", "" (empty = auto)
    title_color: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "#111827"
    title_size: Mapped[int | None] = mapped_column(Integer, nullable=True)  # widget heading font-size in pixels
    title_alignment: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "left", "center"

    # Group 3: Layout
    widget_style: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "grid", "carousel"
    widget_columns: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1-6
    gap: Mapped[int | None] = mapped_column(Integer, nullable=True)  # gap in pixels
    card_min_width: Mapped[int | None] = mapped_column(Integer, nullable=True)  # Min card width in px (grid minmax, carousel floor)
    card_max_width: Mapped[int | None] = mapped_column(Integer, nullable=True)  # Max card width in px (0 = no limit)

    # Group 4: Product Card
    card_bg_color: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "#FFFFFF"
    card_border_radius: Mapped[int | None] = mapped_column(Integer, nullable=True)  # border radius in pixels
    card_border_width: Mapped[int | None] = mapped_column(Integer, nullable=True)  # border width in pixels
    card_border_color: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "#E5E7EB"
    card_shadow: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "none", "sm", "md", "lg"
    card_padding: Mapped[int | None] = mapped_column(Integer, nullable=True)  # padding in pixels
    card_hover: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "none", "lift", "shadow", "glow"

    # Group 5: Product Image
    image_aspect_w: Mapped[int | None] = mapped_column(Integer, nullable=True)  # aspect ratio width (e.g. 1, 3, 4, 16)
    image_aspect_h: Mapped[int | None] = mapped_column(Integer, nullable=True)  # aspect ratio height (e.g. 1, 4, 5, 9)
    image_fit: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "cover", "contain"
    image_radius: Mapped[int | None] = mapped_column(Integer, nullable=True)  # border radius in pixels

    # Group 6: Product Title in Card
    product_title_color: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "#1F2937"
    product_title_size: Mapped[int | None] = mapped_column(Integer, nullable=True)  # card title font-size in pixels
    product_title_weight: Mapped[int | None] = mapped_column(Integer, nullable=True)  # CSS font-weight (400-700)
    product_title_lines: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1-3
    product_title_alignment: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "left", "center"

    # Group 7: Price
    show_price: Mapped[bool | None] = mapped_column(Boolean, nullable=True)  # True/False
    price_color: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "#111827"
    price_size: Mapped[int | None] = mapped_column(Integer, nullable=True)  # price font-size in pixels

    # Group 8: CTA Button
    button_text: Mapped[str | None] = mapped_column(String(100), nullable=True)  # "View", "Shop Now"
    button_bg_color: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "#3B82F6"
    button_text_color: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "#FFFFFF"
    button_radius: Mapped[int | None] = mapped_column(Integer, nullable=True)  # border radius in pixels
    button_size: Mapped[int | None] = mapped_column(Integer, nullable=True)  # button font-size in pixels
    button_variant: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "solid", "outline", "ghost"
    button_full_width: Mapped[bool | None] = mapped_column(Boolean, nullable=True)  # True/False

    # Relationships
    connection: Mapped["EcommerceConnection"] = relationship(back_populates="settings")


# ==========================================
# 3. API USAGE TRACKING
# ==========================================

class APIUsageTracking(Base):
    """
    Purpose: Logs every API call made through a connection for rate limiting and monitoring.
    Scope: Per-organization, per-connection.
    Usage: "GET /recommendations/bestsellers responded 200 in 340ms".
    """
    __tablename__ = "api_usage_tracking"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    connection_id: Mapped[int] = mapped_column(Integer, ForeignKey("ecommerce_connections.id", ondelete="CASCADE"), nullable=False)
    endpoint: Mapped[str] = mapped_column(String(255), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Relationships
    connection: Mapped["EcommerceConnection"] = relationship(back_populates="usage_tracking")


# ==========================================
# 4. RECOMMENDATION ANALYTICS
# ==========================================

class RecommendationAnalytics(Base):
    """
    Purpose: Tracks user interactions with recommendation widgets (views, clicks, purchases).
    Scope: Per-connection, per-recommendation.
    Usage: "User viewed cross_sell recommendation for product 123 at position 2".
    """
    __tablename__ = "recommendation_analytics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    connection_id: Mapped[int] = mapped_column(Integer, ForeignKey("ecommerce_connections.id", ondelete="CASCADE"), nullable=False)

    # What was recommended
    recommendation_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "bestseller", "cross_sell", "up_sell", "similar", "user_based"
    product_id: Mapped[str] = mapped_column(String(255), nullable=False)
    recommended_product_id: Mapped[str] = mapped_column(String(255), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)

    # What the user did
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "view", "click", "purchase"
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)

    # Relationships
    connection: Mapped["EcommerceConnection"] = relationship(back_populates="analytics")


# ==========================================
# 5. SHOPIFY BILLING
# ==========================================

class ShopifyBilling(BaseMixin, Base):
    """
    Purpose: Tracks Shopify app subscription charges per connection.
    Scope: Shopify merchants only — replaces Stripe for Shopify App Store billing.
    Usage: "Pro plan via Shopify Billing for My Shopify Store".
    """
    __tablename__ = "shopify_billings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    connection_id: Mapped[int] = mapped_column(Integer, ForeignKey("ecommerce_connections.id", ondelete="CASCADE"), nullable=False, unique=True)
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)

    # Shopify subscription GID (e.g., "gid://shopify/AppSubscription/12345")
    shopify_subscription_gid: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True, index=True)
    # Plan tier: "PRO", "ENTERPRISE" (matches TIER_ORDER in subscription_utils.py)
    plan_name: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # Billing status: "PENDING", "ACTIVE", "PAST_DUE", "CANCELED"
    billing_status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False)
    # Whether this is a test charge (dev store)
    test: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Billing period
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    connection: Mapped["EcommerceConnection"] = relationship(back_populates="shopify_billing")


# ==========================================
# 6. WIDGET API KEYS
# ==========================================

class WidgetAPIKey(BaseMixin, Base):
    """
    Purpose: Stores HMAC signing keys for public widget endpoints (non-Shopify platforms).
    Scope: Per-connection — each connection can have multiple API keys.
    Usage: "Production key for My WooCommerce Store" with signed iframe URLs.

    Security model:
    - api_key_encrypted: Fernet-encrypted secret used for HMAC-SHA256 verification
    - api_key_prefix: "nk_" + first 8 hex chars — safe to display in dashboard
    - The plaintext key is shown ONCE on creation, never retrievable again
    - Signed URLs use key_id (this model's PK) + HMAC signature
    """
    __tablename__ = "widget_api_keys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    connection_id: Mapped[int] = mapped_column(Integer, ForeignKey("ecommerce_connections.id", ondelete="CASCADE"), nullable=False)
    api_key_encrypted: Mapped[str] = mapped_column(String(512), nullable=False)  # Fernet-encrypted secret
    api_key_prefix: Mapped[str] = mapped_column(String(20), nullable=False)  # "nk_" + first 8 hex chars (display only)
    name: Mapped[str] = mapped_column(String(255), nullable=False)  # Human-readable label (e.g., "Production key")
    allowed_domains: Mapped[str | None] = mapped_column(String(1000), nullable=True)  # Comma-separated domains — secondary signal, not primary auth
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    connection: Mapped["EcommerceConnection"] = relationship(back_populates="widget_api_keys")


# ==========================================
# 7. INGESTED PRODUCTS
# ==========================================

class IngestedProduct(Base):
    """
    Purpose: Locally stored product data — populated via Push API or Auto-Sync.
    Scope: Per-connection product catalog mirror.
    Usage: "Product 123 from My WooCommerce Store, synced 2 hours ago".

    No BaseMixin — bulk data table, same pattern as APIUsageTracking and RecommendationAnalytics.
    """
    __tablename__ = "ingested_products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    connection_id: Mapped[int] = mapped_column(Integer, ForeignKey("ecommerce_connections.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(255), nullable=False)  # Platform product ID (unique per connection)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    handle: Mapped[str | None] = mapped_column(String(500), nullable=True)  # URL slug
    product_type: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Category
    vendor: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Brand
    sku: Mapped[str | None] = mapped_column(String(255), nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)  # Primary image URL
    inventory_quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, draft, archived
    platform_created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)  # When created on platform
    platform_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)  # When updated on platform
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())  # When we stored it

    # Upsert by (connection_id, product_id)
    __table_args__ = (UniqueConstraint("connection_id", "product_id", name="uq_ingested_products_connection_product"),)

    # Relationships
    connection: Mapped["EcommerceConnection"] = relationship(back_populates="ingested_products")


# ==========================================
# 8. INGESTED ORDERS
# ==========================================

class IngestedOrder(Base):
    """
    Purpose: Locally stored order data — populated via Push API or Auto-Sync.
    Scope: Per-connection order history mirror.
    Usage: "Order #1001 from My WooCommerce Store, synced 2 hours ago".

    No BaseMixin — bulk data table.
    """
    __tablename__ = "ingested_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    connection_id: Mapped[int] = mapped_column(Integer, ForeignKey("ecommerce_connections.id", ondelete="CASCADE"), nullable=False)
    order_id: Mapped[str] = mapped_column(String(255), nullable=False)  # Platform order ID
    customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # completed, processing, etc.
    order_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())  # When we stored it

    # Upsert by (connection_id, order_id)
    __table_args__ = (UniqueConstraint("connection_id", "order_id", name="uq_ingested_orders_connection_order"),)

    # Relationships
    connection: Mapped["EcommerceConnection"] = relationship(back_populates="ingested_orders")


# ==========================================
# 9. INGESTED ORDER ITEMS
# ==========================================

class IngestedOrderItem(Base):
    """
    Purpose: Locally stored order line item data — populated via Push API or Auto-Sync.
    Scope: Per-connection order line items mirror.
    Usage: "Product 123 x2 in Order #1001 from My WooCommerce Store".

    No BaseMixin — bulk data table.
    """
    __tablename__ = "ingested_order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    connection_id: Mapped[int] = mapped_column(Integer, ForeignKey("ecommerce_connections.id", ondelete="CASCADE"), nullable=False)
    order_id: Mapped[str] = mapped_column(String(255), nullable=False)  # Platform order ID (not FK — just reference)
    product_id: Mapped[str] = mapped_column(String(255), nullable=False)  # Platform product ID
    variant_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)  # Price per unit
    product_title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    order_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())  # When we stored it

    # Upsert by (connection_id, order_id, product_id, variant_id)
    __table_args__ = (UniqueConstraint("connection_id", "order_id", "product_id", "variant_id", name="uq_ingested_order_items_connection_order_product_variant"),)

    # Relationships
    connection: Mapped["EcommerceConnection"] = relationship(back_populates="ingested_order_items")
