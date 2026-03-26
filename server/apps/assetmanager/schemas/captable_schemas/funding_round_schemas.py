"""
FundingRound Schemas

Pydantic schemas for the FundingRound model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from datetime import date as date_type
from enum import Enum

# ==========================================
# Enum Types
# ==========================================

class RoundType(str, Enum):
    """Funding round type options"""
    SEED = "seed"
    PRE_SERIES_A = "pre_series_a"
    SERIES_A = "series_a"
    SERIES_B = "series_b"
    SERIES_C = "series_c"
    SERIES_D = "series_d"
    DEBT = "debt"
    CONVERTIBLE = "convertible"
    SAFE = "safe"
    BRIDGE = "bridge"
    SECONDARY = "secondary"
    OTHER = "other"

# ==========================================
# FundingRound Schema (Full Representation)
# ==========================================

class FundingRound(BaseModel):
    """FundingRound schema - full representation"""
    id: int
    entity_id: int = Field(description="Associated entity ID")
    name: str = Field(min_length=1, max_length=255, description="Funding round name")
    round_type: RoundType = Field(description="Type of funding round")
    date: date_type = Field(description="Date of funding round")
    target_amount: float = Field(description="Target amount to raise")
    raised_amount: float = Field(default=0, description="Amount actually raised")
    pre_money_valuation: float | None = Field(None, description="Pre-money valuation")
    post_money_valuation: float | None = Field(None, description="Post-money valuation")
    created_at: datetime
    updated_at: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class FundingRoundCreate(BaseModel):
    """Schema for creating a new funding round"""
    entity_id: int = Field(description="Associated entity ID")
    name: str = Field(min_length=1, max_length=255, description="Funding round name")
    round_type: RoundType = Field(description="Type of funding round")
    date: date_type = Field(description="Date of funding round")
    target_amount: float = Field(description="Target amount to raise")
    raised_amount: float = Field(default=0, description="Amount actually raised")
    pre_money_valuation: float | None = Field(None, description="Pre-money valuation")
    post_money_valuation: float | None = Field(None, description="Post-money valuation")

class FundingRoundUpdate(BaseModel):
    """Schema for updating a funding round"""
    entity_id: int | None = None
    name: str | None = Field(None, min_length=1, max_length=255)
    round_type: RoundType | None = None
    date: date_type | None = None
    target_amount: float | None = None
    raised_amount: float | None = None
    pre_money_valuation: float | None = None
    post_money_valuation: float | None = None

# ==========================================
# Response Types
# ==========================================

class FundingRoundResponse(BaseModel):
    """Response containing a single funding round"""
    success: bool
    data: FundingRound | None = None
    error: str | None = None

class FundingRoundsResponse(BaseModel):
    """Response containing multiple funding rounds"""
    success: bool
    data: list[FundingRound] | None = None
    error: str | None = None