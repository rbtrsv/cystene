"""
Nudgio Schemas — Recommendation Settings

Per-connection recommendation algorithm configuration schemas.
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime
from .recommendation_schemas import BestsellerMethod


# ==========================================
# Request Schemas
# ==========================================

class RecommendationSettingsCreate(BaseModel):
    """Schema for creating recommendation settings"""
    bestseller_method: BestsellerMethod = Field(default=BestsellerMethod.VOLUME, description="Bestseller calculation method: volume, value, or balanced")
    bestseller_lookback_days: int = Field(default=30, description="Number of days to look back for bestseller calculations (1-365)")
    crosssell_lookback_days: int = Field(default=30, description="Number of days to look back for cross-sell calculations (1-365)")
    max_recommendations: int = Field(default=10, description="Maximum number of recommendations to return (1-100)")
    min_price_increase_percent: int = Field(default=10, description="Minimum price increase percentage for upsell recommendations (0-1000)")
    shop_base_url: str | None = Field(default=None, description="Shop base URL, e.g. https://myshop.myshopify.com")
    product_url_template: str | None = Field(default=None, description="Product URL template, e.g. /products/{handle}")
    # Brand identity defaults — visual settings for widget rendering
    # 35 settings across 8 groups — each independently configurable.
    # Group 1: Widget Container
    widget_bg_color: str | None = Field(default=None, description="Widget background color hex, e.g. #FFFFFF")
    widget_padding: int | None = Field(default=None, description="Widget padding in pixels")
    # Group 2: Widget Title
    widget_title: str | None = Field(default=None, description="Custom widget heading (empty string = auto-default by type)")
    title_color: str | None = Field(default=None, description="Widget title color hex, e.g. #111827")
    title_size: int | None = Field(default=None, description="Widget title font-size in pixels")
    title_alignment: str | None = Field(default=None, description="Widget title alignment: left, center")
    # Group 3: Layout
    widget_style: str | None = Field(default=None, description="Widget layout style: grid, carousel")
    widget_columns: int | None = Field(default=None, description="Max grid columns at full width (1-6)")
    gap: int | None = Field(default=None, description="Gap between cards in pixels")
    card_min_width: int | None = Field(default=None, description="Min card width in pixels (grid minmax, carousel floor)")
    card_max_width: int | None = Field(default=None, description="Max card width in pixels (0 = no limit)")
    # Group 4: Product Card
    card_bg_color: str | None = Field(default=None, description="Card background color hex, e.g. #FFFFFF")
    card_border_radius: int | None = Field(default=None, description="Card border radius in pixels")
    card_border_width: int | None = Field(default=None, description="Card border width in pixels")
    card_border_color: str | None = Field(default=None, description="Card border color hex, e.g. #E5E7EB")
    card_shadow: str | None = Field(default=None, description="Card shadow: none, sm, md, lg")
    card_padding: int | None = Field(default=None, description="Card content padding in pixels")
    card_hover: str | None = Field(default=None, description="Card hover effect: none, lift, shadow, glow")
    # Group 5: Product Image
    image_aspect_w: int | None = Field(default=None, description="Image aspect ratio width (e.g. 1, 3, 4, 16)")
    image_aspect_h: int | None = Field(default=None, description="Image aspect ratio height (e.g. 1, 4, 5, 9)")
    image_fit: str | None = Field(default=None, description="Image object-fit: cover, contain")
    image_radius: int | None = Field(default=None, description="Image border radius in pixels")
    # Group 6: Product Title in Card
    product_title_color: str | None = Field(default=None, description="Product title color hex, e.g. #1F2937")
    product_title_size: int | None = Field(default=None, description="Product title font-size in pixels")
    product_title_weight: int | None = Field(default=None, description="CSS font-weight (100-900)")
    product_title_lines: int | None = Field(default=None, description="Product title max lines before truncation (1-3)")
    product_title_alignment: str | None = Field(default=None, description="Product title alignment: left, center")
    # Group 7: Price
    show_price: bool | None = Field(default=None, description="Whether to display product prices")
    price_color: str | None = Field(default=None, description="Price text color hex, e.g. #111827")
    price_size: int | None = Field(default=None, description="Price font-size in pixels")
    # Group 8: CTA Button
    button_text: str | None = Field(default=None, description="CTA button text, e.g. View, Shop Now")
    button_bg_color: str | None = Field(default=None, description="Button background color hex, e.g. #3B82F6")
    button_text_color: str | None = Field(default=None, description="Button text color hex, e.g. #FFFFFF")
    button_radius: int | None = Field(default=None, description="Button border radius in pixels")
    button_size: int | None = Field(default=None, description="Button font-size in pixels")
    button_variant: str | None = Field(default=None, description="Button style variant: solid, outline, ghost")
    button_full_width: bool | None = Field(default=None, description="Whether button stretches to full card width")

    @field_validator('bestseller_lookback_days', 'crosssell_lookback_days')
    @classmethod
    def validate_lookback_days(cls, v):
        if v < 1 or v > 365:
            raise ValueError('Lookback days must be between 1 and 365')
        return v

    @field_validator('max_recommendations')
    @classmethod
    def validate_max_recommendations(cls, v):
        if v < 1 or v > 100:
            raise ValueError('Max recommendations must be between 1 and 100')
        return v

    @field_validator('min_price_increase_percent')
    @classmethod
    def validate_min_price_increase(cls, v):
        if v < 0 or v > 1000:
            raise ValueError('Min price increase percent must be between 0 and 1000')
        return v


class RecommendationSettingsUpdate(BaseModel):
    """Schema for updating recommendation settings — all fields optional (partial update)"""
    bestseller_method: BestsellerMethod | None = Field(default=None, description="Bestseller calculation method: volume, value, or balanced")
    bestseller_lookback_days: int | None = Field(default=None, description="Number of days to look back for bestseller calculations (1-365)")
    crosssell_lookback_days: int | None = Field(default=None, description="Number of days to look back for cross-sell calculations (1-365)")
    max_recommendations: int | None = Field(default=None, description="Maximum number of recommendations to return (1-100)")
    min_price_increase_percent: int | None = Field(default=None, description="Minimum price increase percentage for upsell recommendations (0-1000)")
    shop_base_url: str | None = Field(default=None, description="Shop base URL, e.g. https://myshop.myshopify.com")
    product_url_template: str | None = Field(default=None, description="Product URL template, e.g. /products/{handle}")
    # Brand identity defaults — visual settings for widget rendering
    # 35 settings across 8 groups — each independently configurable.
    # Group 1: Widget Container
    widget_bg_color: str | None = Field(default=None, description="Widget background color hex, e.g. #FFFFFF")
    widget_padding: int | None = Field(default=None, description="Widget padding in pixels")
    # Group 2: Widget Title
    widget_title: str | None = Field(default=None, description="Custom widget heading (empty string = auto-default by type)")
    title_color: str | None = Field(default=None, description="Widget title color hex, e.g. #111827")
    title_size: int | None = Field(default=None, description="Widget title font-size in pixels")
    title_alignment: str | None = Field(default=None, description="Widget title alignment: left, center")
    # Group 3: Layout
    widget_style: str | None = Field(default=None, description="Widget layout style: grid, carousel")
    widget_columns: int | None = Field(default=None, description="Max grid columns at full width (1-6)")
    gap: int | None = Field(default=None, description="Gap between cards in pixels")
    card_min_width: int | None = Field(default=None, description="Min card width in pixels (grid minmax, carousel floor)")
    card_max_width: int | None = Field(default=None, description="Max card width in pixels (0 = no limit)")
    # Group 4: Product Card
    card_bg_color: str | None = Field(default=None, description="Card background color hex, e.g. #FFFFFF")
    card_border_radius: int | None = Field(default=None, description="Card border radius in pixels")
    card_border_width: int | None = Field(default=None, description="Card border width in pixels")
    card_border_color: str | None = Field(default=None, description="Card border color hex, e.g. #E5E7EB")
    card_shadow: str | None = Field(default=None, description="Card shadow: none, sm, md, lg")
    card_padding: int | None = Field(default=None, description="Card content padding in pixels")
    card_hover: str | None = Field(default=None, description="Card hover effect: none, lift, shadow, glow")
    # Group 5: Product Image
    image_aspect_w: int | None = Field(default=None, description="Image aspect ratio width (e.g. 1, 3, 4, 16)")
    image_aspect_h: int | None = Field(default=None, description="Image aspect ratio height (e.g. 1, 4, 5, 9)")
    image_fit: str | None = Field(default=None, description="Image object-fit: cover, contain")
    image_radius: int | None = Field(default=None, description="Image border radius in pixels")
    # Group 6: Product Title in Card
    product_title_color: str | None = Field(default=None, description="Product title color hex, e.g. #1F2937")
    product_title_size: int | None = Field(default=None, description="Product title font-size in pixels")
    product_title_weight: int | None = Field(default=None, description="CSS font-weight (100-900)")
    product_title_lines: int | None = Field(default=None, description="Product title max lines before truncation (1-3)")
    product_title_alignment: str | None = Field(default=None, description="Product title alignment: left, center")
    # Group 7: Price
    show_price: bool | None = Field(default=None, description="Whether to display product prices")
    price_color: str | None = Field(default=None, description="Price text color hex, e.g. #111827")
    price_size: int | None = Field(default=None, description="Price font-size in pixels")
    # Group 8: CTA Button
    button_text: str | None = Field(default=None, description="CTA button text, e.g. View, Shop Now")
    button_bg_color: str | None = Field(default=None, description="Button background color hex, e.g. #3B82F6")
    button_text_color: str | None = Field(default=None, description="Button text color hex, e.g. #FFFFFF")
    button_radius: int | None = Field(default=None, description="Button border radius in pixels")
    button_size: int | None = Field(default=None, description="Button font-size in pixels")
    button_variant: str | None = Field(default=None, description="Button style variant: solid, outline, ghost")
    button_full_width: bool | None = Field(default=None, description="Whether button stretches to full card width")


# ==========================================
# Response Schemas
# ==========================================

class RecommendationSettingsDetail(BaseModel):
    """Schema for recommendation settings details"""
    id: int = Field(description="Settings ID")
    connection_id: int = Field(description="ID of the associated connection")
    bestseller_method: BestsellerMethod = Field(description="Bestseller calculation method")
    bestseller_lookback_days: int = Field(description="Bestseller lookback window in days")
    crosssell_lookback_days: int = Field(description="Cross-sell lookback window in days")
    max_recommendations: int = Field(description="Maximum number of recommendations")
    min_price_increase_percent: int = Field(description="Minimum upsell price increase percentage")
    shop_base_url: str | None = Field(default=None, description="Shop base URL")
    product_url_template: str | None = Field(default=None, description="Product URL template")
    # Brand identity defaults — visual settings for widget rendering
    # Group 1: Widget Container
    widget_bg_color: str | None = Field(default=None, description="Widget background color hex")
    widget_padding: int | None = Field(default=None, description="Widget padding in pixels")
    # Group 2: Widget Title
    widget_title: str | None = Field(default=None, description="Custom widget heading")
    title_color: str | None = Field(default=None, description="Widget title color hex")
    title_size: int | None = Field(default=None, description="Widget title font-size in pixels")
    title_alignment: str | None = Field(default=None, description="Widget title alignment")
    # Group 3: Layout
    widget_style: str | None = Field(default=None, description="Widget layout style")
    widget_columns: int | None = Field(default=None, description="Max grid columns at full width")
    gap: int | None = Field(default=None, description="Gap between cards in pixels")
    card_min_width: int | None = Field(default=None, description="Min card width in pixels")
    card_max_width: int | None = Field(default=None, description="Max card width in pixels")
    # Group 4: Product Card
    card_bg_color: str | None = Field(default=None, description="Card background color hex")
    card_border_radius: int | None = Field(default=None, description="Card border radius in pixels")
    card_border_width: int | None = Field(default=None, description="Card border width in pixels")
    card_border_color: str | None = Field(default=None, description="Card border color hex")
    card_shadow: str | None = Field(default=None, description="Card shadow")
    card_padding: int | None = Field(default=None, description="Card content padding in pixels")
    card_hover: str | None = Field(default=None, description="Card hover effect")
    # Group 5: Product Image
    image_aspect_w: int | None = Field(default=None, description="Image aspect ratio width")
    image_aspect_h: int | None = Field(default=None, description="Image aspect ratio height")
    image_fit: str | None = Field(default=None, description="Image object-fit")
    image_radius: int | None = Field(default=None, description="Image border radius in pixels")
    # Group 6: Product Title in Card
    product_title_color: str | None = Field(default=None, description="Product title color hex")
    product_title_size: int | None = Field(default=None, description="Product title font-size in pixels")
    product_title_weight: int | None = Field(default=None, description="CSS font-weight (100-900)")
    product_title_lines: int | None = Field(default=None, description="Product title max lines")
    product_title_alignment: str | None = Field(default=None, description="Product title alignment")
    # Group 7: Price
    show_price: bool | None = Field(default=None, description="Whether to display product prices")
    price_color: str | None = Field(default=None, description="Price text color hex")
    price_size: int | None = Field(default=None, description="Price font-size in pixels")
    # Group 8: CTA Button
    button_text: str | None = Field(default=None, description="CTA button text")
    button_bg_color: str | None = Field(default=None, description="Button background color hex")
    button_text_color: str | None = Field(default=None, description="Button text color hex")
    button_radius: int | None = Field(default=None, description="Button border radius in pixels")
    button_size: int | None = Field(default=None, description="Button font-size in pixels")
    button_variant: str | None = Field(default=None, description="Button style variant")
    button_full_width: bool | None = Field(default=None, description="Button full width")
    created_at: datetime = Field(description="When the settings were created")
    updated_at: datetime | None = Field(default=None, description="When the settings were last updated")

    model_config = ConfigDict(from_attributes=True)


class RecommendationSettingsResponse(BaseModel):
    """Response schema for single recommendation settings operations"""
    success: bool = Field(description="Whether the operation succeeded")
    data: RecommendationSettingsDetail | None = Field(default=None, description="Settings details")
    error: str | None = Field(default=None, description="Error message if operation failed")


class ConnectionSettingsDetail(BaseModel):
    """Schema for connection with its settings"""
    connection_id: int = Field(description="ID of the connection")
    connection_name: str = Field(description="Connection name")
    platform: str = Field(description="Ecommerce platform")
    settings: RecommendationSettingsDetail | None = Field(default=None, description="Settings for this connection, null if not configured")


class RecommendationSettingsListResponse(BaseModel):
    """Response schema for listing recommendation settings across connections"""
    success: bool = Field(description="Whether the operation succeeded")
    data: list[ConnectionSettingsDetail] | None = Field(default=None, description="List of connections with their settings")
    count: int = Field(default=0, description="Total number of connections")
    error: str | None = Field(default=None, description="Error message if operation failed")


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool = Field(description="Whether the operation succeeded")
    message: str | None = Field(default=None, description="Response message")
    error: str | None = Field(default=None, description="Error message if operation failed")
