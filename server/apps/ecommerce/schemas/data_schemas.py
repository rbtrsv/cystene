"""
Nudgio Schemas — Data Management

Data transfer objects for product/order import and connection statistics.
"""

from pydantic import BaseModel, Field
from datetime import datetime


# ==========================================
# Data Transfer Objects
# ==========================================

class ProductData(BaseModel):
    """Single product record for import"""
    product_id: str = Field(description="Product ID from the ecommerce platform")
    title: str = Field(description="Product title")
    handle: str | None = Field(default=None, description="URL-friendly product handle/slug")
    product_type: str | None = Field(default=None, description="Product type/category")
    vendor: str | None = Field(default=None, description="Product vendor/brand")
    sku: str | None = Field(default=None, description="Stock keeping unit")
    price: float = Field(description="Product price")
    image_url: str | None = Field(default=None, description="Product image URL")
    inventory_quantity: int | None = Field(default=None, description="Current inventory quantity")
    status: str | None = Field(default="active", description="Product status: active, draft, archived")
    created_at: datetime | None = Field(default=None, description="When the product was created on the platform")
    updated_at: datetime | None = Field(default=None, description="When the product was last updated on the platform")


class OrderData(BaseModel):
    """Single order record for import"""
    order_id: str = Field(description="Order ID from the ecommerce platform")
    customer_id: str | None = Field(default=None, description="Customer ID who placed the order")
    total_price: float = Field(description="Total order price")
    status: str = Field(description="Order status: pending, completed, cancelled, etc.")
    order_date: datetime = Field(description="When the order was placed")


class OrderItemData(BaseModel):
    """Single order line item for import"""
    order_id: str = Field(description="Order ID this item belongs to")
    product_id: str = Field(description="Product ID of the purchased item")
    variant_id: str | None = Field(default=None, description="Product variant ID")
    quantity: int = Field(description="Number of units purchased")
    price: float = Field(description="Price per unit")
    product_title: str | None = Field(default=None, description="Product title at time of purchase")
    customer_id: str | None = Field(default=None, description="Customer ID who purchased")
    order_date: datetime = Field(description="When the order was placed")


# ==========================================
# Request Schemas
# ==========================================

class DataImportRequest(BaseModel):
    """Base request for data import operations"""
    connection_id: int = Field(description="ID of the connection to import data for")
    data_type: str = Field(description="Type of data to import: products, orders, or order_items")


class ProductImportRequest(DataImportRequest):
    """Request for importing product data"""
    products: list[ProductData] = Field(description="List of product records to import")


class OrderImportRequest(DataImportRequest):
    """Request for importing order data"""
    orders: list[OrderData] = Field(description="List of order records to import")


class OrderItemImportRequest(DataImportRequest):
    """Request for importing order item data"""
    order_items: list[OrderItemData] = Field(description="List of order item records to import")


# ==========================================
# Response Schemas
# ==========================================

class DataImportResponse(BaseModel):
    """Response schema for data import operations"""
    success: bool = Field(description="Whether the import succeeded without errors")
    message: str | None = Field(default=None, description="Import result summary")
    records_processed: int = Field(default=0, description="Number of records successfully processed")
    errors: list[str] = Field(default=[], description="List of error messages for failed records")
    error: str | None = Field(default=None, description="Error message if the entire import failed")


class ConnectionStatsDetail(BaseModel):
    """Schema for connection data statistics"""
    connection_id: int = Field(description="ID of the connection")
    connection_name: str = Field(description="Connection name")
    platform: str = Field(description="Ecommerce platform")
    products_count: int = Field(description="Total number of products")
    orders_count: int = Field(description="Total number of orders")
    last_sync: datetime | None = Field(default=None, description="When data was last synced")
    data_freshness_days: int | None = Field(default=None, description="How many days old the data is")


class ConnectionStatsResponse(BaseModel):
    """Response schema for connection stats operations"""
    success: bool = Field(description="Whether the operation succeeded")
    data: ConnectionStatsDetail | None = Field(default=None, description="Connection statistics")
    error: str | None = Field(default=None, description="Error message if operation failed")
