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

# Why DealStatus: Mirrors the 5 lifecycle states on Deal.status.
# Used for validation in DealStatusUpdate and DealExecuteInput responses.
class DealStatus(str, Enum):
    """Deal lifecycle status options"""
    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"
    EXECUTED = "executed"
    CANCELLED = "cancelled"

# ==========================================
# Deal Schema (Full Representation)
# ==========================================

class Deal(BaseModel):
    """Deal schema - full representation"""
    id: int
    entity_id: int = Field(description="Associated entity ID")
    name: str = Field(description="Deal name")
    deal_type: DealType = Field(description="Type of deal")

    # Why status on read schema: Frontend needs to display current lifecycle state and
    # determine which action buttons to show (activate, close, execute, cancel).
    status: DealStatus = Field(description="Deal lifecycle status")

    # Why funding_round_id on read schema: Frontend can link to the created FundingRound
    # after execution, showing the cap table impact.
    funding_round_id: int | None = Field(None, description="Linked FundingRound ID after execution")

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
# Action Schemas (Status + Execute)
# ==========================================

class DealStatusUpdate(BaseModel):
    """
    Schema for updating deal status via PUT /{deal_id}/status.
    Why: Status transitions are controlled separately from general deal updates
    to enforce allowed transitions (e.g., can't go directly to 'executed').
    """
    status: DealStatus

class DealExecuteInput(BaseModel):
    """
    Schema for executing a fundraising deal via POST /{deal_id}/execute.
    Why: These fields can't be inferred from the Deal record alone — admin
    must specify the round type, security details, and default stakeholder type
    at execution time because one deal could theoretically use different security structures.
    """
    round_type: str = Field(max_length=20, description="Funding round type (seed, series_a, series_b, etc.)")
    security_name: str = Field(max_length=255, description="Security name (e.g., 'Series A Preferred')")
    security_code: str = Field(max_length=20, description="Security code (e.g., 'SER-A')")
    security_type: str = Field(max_length=50, description="Security type (common, preferred, convertible, safe)")
    stakeholder_type: str = Field(default="limited_partner", max_length=20, description="Default stakeholder type for new stakeholders")

class DealExecuteResponse(BaseModel):
    """
    Response from deal execution.
    Why: Execution creates multiple records across 4 tables — the response provides
    a summary so the admin can verify counts without querying each table separately.
    """
    success: bool
    funding_round_id: int
    security_id: int
    stakeholders_created: int
    transactions_created: int
    total_amount: float
    message: str
    error: str | None = None

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
