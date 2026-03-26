"""
Holding Schemas

Pydantic schemas for the Holding model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from datetime import date as date_type
from enum import Enum

# ==========================================
# Enum Types
# ==========================================

class InvestmentStatus(str, Enum):
    """Investment status options"""
    ACTIVE = "active"
    EXITED = "exited"
    WRITTEN_OFF = "written_off"

class ListingStatus(str, Enum):
    """Listing status options"""
    PRIVATE = "private"
    PUBLIC = "public"

# ==========================================
# Holding Schema (Full Representation)
# ==========================================

class Holding(BaseModel):
    """Holding schema - full representation"""
    id: int
    entity_id: int = Field(description="Associated entity ID")
    target_entity_id: int | None = Field(None, description="Target entity ID")
    company_name: str | None = Field(None, description="Company name")
    funding_round_id: int | None = Field(None, description="Associated funding round ID")

    # Investment Details
    investment_name: str = Field(description="Investment name")
    entity_type: str = Field(description="Entity type")
    investment_type: str = Field(description="Investment type")
    investment_round: str | None = Field(None, description="Investment round")
    investment_status: str = Field(description="Investment status")
    sector: str = Field(description="Sector")
    listing_status: str = Field(description="Listing status")
    original_investment_date: date_type | None = Field(None, description="Original investment date")

    # Financial Details
    total_investment_amount: float | None = Field(None, description="Total investment amount")
    ownership_percentage: float | None = Field(None, description="Ownership percentage")
    invested_as_percent_capital: float | None = Field(None, description="Invested as percent of capital")

    # Share Details
    number_of_shares: float | None = Field(None, description="Number of shares")
    average_cost_per_share: float | None = Field(None, description="Average cost per share")
    current_share_price: float | None = Field(None, description="Current share price")
    share_price_updated_at: datetime | None = Field(None, description="Share price last updated at")

    # Exchange Details
    stock_ticker: str | None = Field(None, description="Stock ticker symbol")
    exchange: str | None = Field(None, description="Stock exchange")

    # Valuation & Performance
    current_fair_value: float | None = Field(None, description="Current fair value")
    moic: float | None = Field(None, description="Multiple on invested capital")
    irr: float | None = Field(None, description="Internal rate of return")

    # Export
    export_functionality: bool = Field(description="Export functionality enabled")

    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class HoldingCreate(BaseModel):
    """Schema for creating a new holding"""
    # Required fields
    entity_id: int = Field(description="Associated entity ID")
    investment_name: str = Field(min_length=1, max_length=255, description="Investment name")
    entity_type: str = Field(max_length=50, description="Entity type")
    investment_type: str = Field(max_length=50, description="Investment type")
    sector: str = Field(max_length=50, description="Sector")

    # Fields with defaults
    investment_status: InvestmentStatus = Field(default=InvestmentStatus.ACTIVE, description="Investment status")
    listing_status: ListingStatus = Field(default=ListingStatus.PRIVATE, description="Listing status")
    export_functionality: bool = Field(default=False, description="Export functionality enabled")

    # Optional fields
    target_entity_id: int | None = Field(None, description="Target entity ID")
    company_name: str | None = Field(None, max_length=255, description="Company name")
    funding_round_id: int | None = Field(None, description="Associated funding round ID")
    investment_round: str | None = Field(None, max_length=50, description="Investment round")
    original_investment_date: date_type | None = Field(None, description="Original investment date")

    # Financial Details
    total_investment_amount: float | None = Field(None, description="Total investment amount")
    ownership_percentage: float | None = Field(None, description="Ownership percentage")
    invested_as_percent_capital: float | None = Field(None, description="Invested as percent of capital")

    # Share Details
    number_of_shares: float | None = Field(None, description="Number of shares")
    average_cost_per_share: float | None = Field(None, description="Average cost per share")
    current_share_price: float | None = Field(None, description="Current share price")
    share_price_updated_at: datetime | None = Field(None, description="Share price last updated at")

    # Exchange Details
    stock_ticker: str | None = Field(None, max_length=10, description="Stock ticker symbol")
    exchange: str | None = Field(None, max_length=50, description="Stock exchange")

    # Valuation & Performance
    current_fair_value: float | None = Field(None, description="Current fair value")
    moic: float | None = Field(None, description="Multiple on invested capital")
    irr: float | None = Field(None, description="Internal rate of return")

class HoldingUpdate(BaseModel):
    """Schema for updating a holding"""
    entity_id: int | None = None
    target_entity_id: int | None = None
    company_name: str | None = Field(None, max_length=255)
    funding_round_id: int | None = None

    # Investment Details
    investment_name: str | None = Field(None, min_length=1, max_length=255)
    entity_type: str | None = Field(None, max_length=50)
    investment_type: str | None = Field(None, max_length=50)
    investment_round: str | None = Field(None, max_length=50)
    investment_status: InvestmentStatus | None = None
    sector: str | None = Field(None, max_length=50)
    listing_status: ListingStatus | None = None
    original_investment_date: date_type | None = None

    # Financial Details
    total_investment_amount: float | None = None
    ownership_percentage: float | None = None
    invested_as_percent_capital: float | None = None

    # Share Details
    number_of_shares: float | None = None
    average_cost_per_share: float | None = None
    current_share_price: float | None = None
    share_price_updated_at: datetime | None = None

    # Exchange Details
    stock_ticker: str | None = Field(None, max_length=10)
    exchange: str | None = Field(None, max_length=50)

    # Valuation & Performance
    current_fair_value: float | None = None
    moic: float | None = None
    irr: float | None = None

    # Export
    export_functionality: bool | None = None

# ==========================================
# Response Types
# ==========================================

class HoldingResponse(BaseModel):
    """Response containing a single holding"""
    success: bool
    data: Holding | None = None
    error: str | None = None

class HoldingsResponse(BaseModel):
    """Response containing multiple holdings"""
    success: bool
    data: list[Holding] | None = None
    error: str | None = None
