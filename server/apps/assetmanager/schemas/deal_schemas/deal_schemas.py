"""
Deal Schemas

Pydantic schemas for the Deal model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from datetime import date as date_type
from enum import Enum

# ==========================================
# Enum Types
# ==========================================

class DealType(str, Enum):
    """Deal type options"""
    FUNDRAISING = "fundraising"
    ACQUISITION = "acquisition"
    SECONDARY = "secondary"
    DEBT = "debt"

# ==========================================
# Deal Schema (Full Representation)
# ==========================================

class Deal(BaseModel):
    """Deal schema - full representation"""
    id: int
    entity_id: int = Field(description="Associated entity ID")
    name: str = Field(description="Deal name")
    deal_type: DealType = Field(description="Type of deal")

    # Financial Terms
    pre_money_valuation: float | None = Field(None, description="Pre-money valuation")
    post_money_valuation: float | None = Field(None, description="Post-money valuation")
    target_amount: float | None = Field(None, description="Target amount")
    minimum_investment: float | None = Field(None, description="Minimum investment")
    share_price: float | None = Field(None, description="Share price")
    share_allocation: int | None = Field(None, description="Share allocation")
    dilution: float | None = Field(None, description="Dilution percentage")

    # Rights & Governance
    liquidation_preference: float | None = Field(None, description="Liquidation preference")
    dividend_rights: str | None = Field(None, description="Dividend rights")
    anti_dilution: str | None = Field(None, description="Anti-dilution provisions")
    pro_rata_rights: bool = Field(default=False, description="Pro-rata rights")
    board_seats: int = Field(default=0, description="Board seats")
    veto_rights: str | None = Field(None, description="Veto rights")

    # Dates
    start_date: date_type = Field(description="Deal start date")
    end_date: date_type = Field(description="Deal end date")
    expected_close_date: date_type | None = Field(None, description="Expected close date")

    # Status & Progress
    soft_commitments: float = Field(default=0, description="Soft commitments amount")
    firm_commitments: float = Field(default=0, description="Firm commitments amount")
    profile_views: int = Field(default=0, description="Profile views count")
    due_diligence_status: str | None = Field(None, description="Due diligence status")

    # Documents
    pitch_deck: str | None = Field(None, description="Pitch deck file path")
    financial_model: str | None = Field(None, description="Financial model file path")
    data_room_link: str | None = Field(None, description="Data room link")
    term_sheet: str | None = Field(None, description="Term sheet file path")
    shareholders_agreement: str | None = Field(None, description="Shareholders agreement file path")

    # Additional Info
    investment_highlights: str | None = Field(None, description="Investment highlights")
    use_of_funds: str | None = Field(None, description="Use of funds")

    # Secondary Details
    seller_id: int | None = Field(None, description="Seller stakeholder ID")
    shares_offered: int | None = Field(None, description="Shares offered")

    # Debt Details
    interest_rate: float | None = Field(None, description="Interest rate")
    term_length: int | None = Field(None, description="Term length in months")
    collateral: str | None = Field(None, description="Collateral description")

    # M&A Details
    acquisition_price: float | None = Field(None, description="Acquisition price")
    payment_structure: str | None = Field(None, description="Payment structure")
    deal_structure: str | None = Field(None, description="Deal structure")

    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class DealCreate(BaseModel):
    """Schema for creating a new deal"""
    entity_id: int = Field(description="Associated entity ID")
    name: str = Field(min_length=1, max_length=255, description="Deal name")
    deal_type: DealType = Field(default=DealType.FUNDRAISING, description="Type of deal")

    # Financial Terms
    pre_money_valuation: float | None = Field(None, description="Pre-money valuation")
    post_money_valuation: float | None = Field(None, description="Post-money valuation")
    target_amount: float | None = Field(None, description="Target amount")
    minimum_investment: float | None = Field(None, description="Minimum investment")
    share_price: float | None = Field(None, description="Share price")
    share_allocation: int | None = Field(None, description="Share allocation")
    dilution: float | None = Field(None, description="Dilution percentage")

    # Rights & Governance
    liquidation_preference: float | None = Field(None, description="Liquidation preference")
    dividend_rights: str | None = Field(None, max_length=100, description="Dividend rights")
    anti_dilution: str | None = Field(None, max_length=100, description="Anti-dilution provisions")
    pro_rata_rights: bool = Field(default=False, description="Pro-rata rights")
    board_seats: int = Field(default=0, description="Board seats")
    veto_rights: str | None = Field(None, description="Veto rights")

    # Dates
    start_date: date_type = Field(description="Deal start date")
    end_date: date_type = Field(description="Deal end date")
    expected_close_date: date_type | None = Field(None, description="Expected close date")

    # Status & Progress
    soft_commitments: float = Field(default=0, description="Soft commitments amount")
    firm_commitments: float = Field(default=0, description="Firm commitments amount")
    profile_views: int = Field(default=0, description="Profile views count")
    due_diligence_status: str | None = Field(None, max_length=50, description="Due diligence status")

    # Documents
    pitch_deck: str | None = Field(None, max_length=255, description="Pitch deck file path")
    financial_model: str | None = Field(None, max_length=255, description="Financial model file path")
    data_room_link: str | None = Field(None, max_length=255, description="Data room link")
    term_sheet: str | None = Field(None, max_length=255, description="Term sheet file path")
    shareholders_agreement: str | None = Field(None, max_length=255, description="Shareholders agreement file path")

    # Additional Info
    investment_highlights: str | None = Field(None, description="Investment highlights")
    use_of_funds: str | None = Field(None, description="Use of funds")

    # Secondary Details
    seller_id: int | None = Field(None, description="Seller stakeholder ID")
    shares_offered: int | None = Field(None, description="Shares offered")

    # Debt Details
    interest_rate: float | None = Field(None, description="Interest rate")
    term_length: int | None = Field(None, description="Term length in months")
    collateral: str | None = Field(None, description="Collateral description")

    # M&A Details
    acquisition_price: float | None = Field(None, description="Acquisition price")
    payment_structure: str | None = Field(None, description="Payment structure")
    deal_structure: str | None = Field(None, description="Deal structure")

class DealUpdate(BaseModel):
    """Schema for updating a deal"""
    entity_id: int | None = None
    name: str | None = Field(None, min_length=1, max_length=255)
    deal_type: DealType | None = None

    # Financial Terms
    pre_money_valuation: float | None = None
    post_money_valuation: float | None = None
    target_amount: float | None = None
    minimum_investment: float | None = None
    share_price: float | None = None
    share_allocation: int | None = None
    dilution: float | None = None

    # Rights & Governance
    liquidation_preference: float | None = None
    dividend_rights: str | None = Field(None, max_length=100)
    anti_dilution: str | None = Field(None, max_length=100)
    pro_rata_rights: bool | None = None
    board_seats: int | None = None
    veto_rights: str | None = None

    # Dates
    start_date: date_type | None = None
    end_date: date_type | None = None
    expected_close_date: date_type | None = None

    # Status & Progress
    soft_commitments: float | None = None
    firm_commitments: float | None = None
    profile_views: int | None = None
    due_diligence_status: str | None = Field(None, max_length=50)

    # Documents
    pitch_deck: str | None = Field(None, max_length=255)
    financial_model: str | None = Field(None, max_length=255)
    data_room_link: str | None = Field(None, max_length=255)
    term_sheet: str | None = Field(None, max_length=255)
    shareholders_agreement: str | None = Field(None, max_length=255)

    # Additional Info
    investment_highlights: str | None = None
    use_of_funds: str | None = None

    # Secondary Details
    seller_id: int | None = None
    shares_offered: int | None = None

    # Debt Details
    interest_rate: float | None = None
    term_length: int | None = None
    collateral: str | None = None

    # M&A Details
    acquisition_price: float | None = None
    payment_structure: str | None = None
    deal_structure: str | None = None

# ==========================================
# Response Types
# ==========================================

class DealResponse(BaseModel):
    """Response containing a single deal"""
    success: bool
    data: Deal | None = None
    error: str | None = None

class DealsResponse(BaseModel):
    """Response containing multiple deals"""
    success: bool
    data: list[Deal] | None = None
    error: str | None = None
