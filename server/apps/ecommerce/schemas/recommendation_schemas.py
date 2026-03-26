"""
Nudgio Schemas — Recommendations

Engine request/response schemas for recommendation algorithms (bestseller, cross-sell, upsell, similar).
"""

from pydantic import BaseModel, Field
from enum import Enum


# ==========================================
# Enums
# ==========================================

class BestsellerMethod(str, Enum):
    """Bestseller calculation method"""
    VOLUME = "volume"
    VALUE = "value"
    BALANCED = "balanced"


class RecommendationType(str, Enum):
    """Recommendation algorithm types"""
    BESTSELLER = "bestseller"
    CROSS_SELL = "cross_sell"
    UP_SELL = "up_sell"
    SIMILAR = "similar"
    USER_BASED = "user_based"


class EventType(str, Enum):
    """Analytics event types"""
    VIEW = "view"
    CLICK = "click"
    PURCHASE = "purchase"


# ==========================================
# Request Schemas
# ==========================================

class RecommendationRequest(BaseModel):
    """Base request for all recommendation endpoints"""
    connection_id: int = Field(description="ID of the connection to use for data retrieval")
    limit: int = Field(default=10, description="Maximum number of recommendations to return")
    lookback_days: int = Field(default=30, description="Number of days to look back for order data")


class BestsellerRequest(RecommendationRequest):
    """Request for bestseller recommendations"""
    method: BestsellerMethod = Field(default=BestsellerMethod.VOLUME, description="Bestseller calculation method: volume, value, or balanced")


class CrossSellRequest(RecommendationRequest):
    """Request for cross-sell (frequently bought together) recommendations"""
    product_id: str = Field(description="Base product ID to find cross-sell recommendations for")


class UpsellRequest(RecommendationRequest):
    """Request for upsell (higher-priced alternative) recommendations"""
    product_id: str = Field(description="Base product ID to find upsell recommendations for")
    min_price_increase_percent: int = Field(default=10, description="Minimum price increase percentage for upsell candidates")


class SimilarProductsRequest(RecommendationRequest):
    """Request for similar product recommendations"""
    product_id: str = Field(description="Base product ID to find similar products for")


# ==========================================
# Response Schemas
# ==========================================

class ProductRecommendation(BaseModel):
    """Single product recommendation item"""
    product_id: str = Field(description="Product ID from the ecommerce platform")
    title: str = Field(description="Product title")
    price: float = Field(description="Product price")
    handle: str | None = Field(default=None, description="URL-friendly product handle/slug")
    vendor: str | None = Field(default=None, description="Product vendor/brand")
    sku: str | None = Field(default=None, description="Stock keeping unit")
    position: int = Field(description="Position in the recommendation list (1-based)")
    metrics: dict | None = Field(default=None, description="Algorithm-specific metrics (e.g. total_sold, revenue)")
    co_occurrence_count: int | None = Field(default=None, description="Number of co-occurrences in orders (cross-sell)")
    price_increase_percent: float | None = Field(default=None, description="Price increase percentage vs base product (upsell)")
    similarity_score: float | None = Field(default=None, description="Similarity score vs base product (similar)")


class RecommendationResult(BaseModel):
    """Recommendation engine result containing product list"""
    recommendations: list[ProductRecommendation] = Field(description="List of recommended products")
    count: int = Field(description="Number of recommendations returned")
    method: str | None = Field(default=None, description="Algorithm method used")
    base_product_id: str | None = Field(default=None, description="Base product ID (for cross-sell, upsell, similar)")
    lookback_days: int = Field(description="Lookback window used for this recommendation")
    generated_at: str = Field(description="ISO timestamp when recommendations were generated")


class RecommendationResponse(BaseModel):
    """Response schema for recommendation operations"""
    success: bool = Field(description="Whether the operation succeeded")
    data: RecommendationResult | None = Field(default=None, description="Recommendation results")
    error: str | None = Field(default=None, description="Error message if operation failed")
