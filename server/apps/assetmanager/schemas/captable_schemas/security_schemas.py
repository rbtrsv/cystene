"""
Security Schemas

Pydantic schemas for the Security model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from datetime import date as date_type
from enum import Enum

# ==========================================
# Enum Types
# ==========================================

class SecurityType(str, Enum):
    """Security type options"""
    COMMON_SHARES = "common"
    PREFERRED_SHARES = "preferred" 
    CONVERTIBLE = "convertible"
    WARRANT = "warrant"
    OPTION = "option"
    BOND = "bond"
    SAFE = "safe"

class Currency(str, Enum):
    """Currency options"""
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    RON = "RON"
    CHF = "CHF"
    JPY = "JPY"
    CNY = "CNY"
    AUD = "AUD"
    CAD = "CAD"
    SGD = "SGD"
    HKD = "HKD"

class AntiDilutionType(str, Enum):
    """Anti-dilution protection types"""
    NONE = "none"
    FULL_RATCHET = "full_ratchet"
    WEIGHTED_AVERAGE = "weighted_average"

class InterestRateType(str, Enum):
    """Interest rate types"""
    FIXED = "fixed"
    VARIABLE = "variable"
    SIMPLE = "simple"
    COMPOUND = "compound"

# ==========================================
# Security Schema (Full Representation)
# ==========================================

class Security(BaseModel):
    """Security schema - full representation"""
    id: int
    funding_round_id: int = Field(description="Associated funding round ID")
    security_name: str = Field(min_length=1, max_length=255, description="Security name")
    code: str = Field(max_length=20, description="Security code")
    security_type: SecurityType = Field(description="Security type")
    currency: Currency = Field(default=Currency.USD, description="Currency")
    issue_price: float | None = Field(None, description="Issue price")
    special_terms: str | None = Field(None, description="Special terms")
    
    # Stock Fields
    is_preferred: bool | None = Field(None, description="Is preferred stock")
    
    # Voting Rights
    has_voting_rights: bool | None = Field(None, description="Has voting rights")
    voting_ratio: float | None = Field(None, description="Voting ratio")
    
    # Dividend Rights
    has_dividend_rights: bool | None = Field(None, description="Has dividend rights")
    dividend_rate: float | None = Field(None, description="Dividend rate")
    is_dividend_cumulative: bool | None = Field(None, description="Is dividend cumulative")
    
    # Liquidation & Participation
    liquidation_preference: float | None = Field(None, description="Liquidation preference")
    has_participation: bool | None = Field(None, description="Has participation rights")
    participation_cap: float | None = Field(None, description="Participation cap")
    seniority: int | None = Field(None, description="Seniority level")
    anti_dilution: AntiDilutionType | None = Field(None, description="Anti-dilution protection")
    
    # Conversion Rights
    has_conversion_rights: bool | None = Field(None, description="Has conversion rights")
    conversion_ratio: float | None = Field(None, description="Conversion ratio")
    
    # Redemption Rights
    has_redemption_rights: bool | None = Field(None, description="Has redemption rights")
    redemption_term: int | None = Field(None, description="Redemption term in months")
    
    # Convertible Security Fields
    interest_rate: float | None = Field(None, description="Interest rate")
    interest_rate_type: InterestRateType | None = Field(None, description="Interest rate type")
    interest_period: str | None = Field(None, description="Interest period")
    maturity_date: date_type | None = Field(None, description="Maturity date")
    valuation_cap: float | None = Field(None, description="Valuation cap")
    conversion_discount: float | None = Field(None, description="Conversion discount")
    conversion_basis: str | None = Field(None, max_length=50, description="Conversion basis")
    
    # Option-Specific Fields
    option_type: str | None = Field(None, description="Option type (esop, vsop, sar)")
    
    # Vesting & Exercise Terms
    vesting_start: date_type | None = Field(None, description="Vesting start date")
    vesting_months: int | None = Field(None, description="Vesting period in months")
    cliff_months: int | None = Field(None, description="Cliff period in months")
    vesting_schedule_type: str | None = Field(None, description="Vesting schedule type")
    exercise_window_days: int | None = Field(None, description="Exercise window in days")
    strike_price: float | None = Field(None, description="Strike price")
    expiration_date: date_type | None = Field(None, description="Expiration date")
    termination_date: date_type | None = Field(None, description="Termination date")
    
    # Option Pool Management
    pool_name: str | None = Field(None, description="Pool name")
    pool_size: float | None = Field(None, description="Pool size")
    pool_available: float | None = Field(None, description="Pool available amount")
    is_active: bool | None = Field(None, description="Is active")
    
    # Warrant-Specific Fields
    warrant_type: str | None = Field(None, description="Warrant type")
    is_detachable: bool = Field(default=False, description="Is detachable")
    deal_context: str | None = Field(None, description="Deal context")
    is_transferable: bool = Field(default=False, description="Is transferable")
    
    # Shared Option/Warrant Fields
    total_shares: float | None = Field(None, description="Total shares")
    issue_rights: str | None = Field(None, max_length=50, description="Issue rights")
    convert_to: str | None = Field(None, description="Convert to")
    
    # Bond Fields
    principal: float | None = Field(None, description="Principal amount")
    coupon_rate: float | None = Field(None, description="Coupon rate")
    coupon_frequency: str | None = Field(None, description="Coupon frequency")
    principal_frequency: str | None = Field(None, description="Principal frequency")
    tenure_months: int | None = Field(None, description="Tenure in months")
    moratorium_period: int | None = Field(None, description="Moratorium period")
    
    created_at: datetime
    updated_at: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class SecurityCreate(BaseModel):
    """Schema for creating a new security"""
    funding_round_id: int = Field(description="Associated funding round ID")
    security_name: str = Field(min_length=1, max_length=255, description="Security name")
    code: str = Field(max_length=20, description="Security code")
    security_type: SecurityType = Field(description="Security type")
    currency: Currency = Field(default=Currency.USD, description="Currency")
    issue_price: float | None = Field(None, description="Issue price")
    special_terms: str | None = Field(None, description="Special terms")
    
    # Stock Fields
    is_preferred: bool | None = None
    
    # Voting Rights
    has_voting_rights: bool | None = None
    voting_ratio: float | None = None
    
    # Dividend Rights
    has_dividend_rights: bool | None = None
    dividend_rate: float | None = None
    is_dividend_cumulative: bool | None = None
    
    # Liquidation & Participation
    liquidation_preference: float | None = None
    has_participation: bool | None = None
    participation_cap: float | None = None
    seniority: int | None = None
    anti_dilution: AntiDilutionType | None = None

    # Conversion Rights
    has_conversion_rights: bool | None = None
    conversion_ratio: float | None = None

    # Redemption Rights
    has_redemption_rights: bool | None = None
    redemption_term: int | None = None

    # Convertible Security Fields
    interest_rate: float | None = None
    interest_rate_type: InterestRateType | None = None
    interest_period: str | None = None
    maturity_date: date_type | None = None
    valuation_cap: float | None = None
    conversion_discount: float | None = None
    conversion_basis: str | None = Field(None, max_length=50)
    
    # Option-Specific Fields
    option_type: str | None = None
    
    # Vesting & Exercise Terms
    vesting_start: date_type | None = None
    vesting_months: int | None = None
    cliff_months: int | None = None
    vesting_schedule_type: str | None = None
    exercise_window_days: int | None = None
    strike_price: float | None = None
    expiration_date: date_type | None = None
    termination_date: date_type | None = None
    
    # Option Pool Management
    pool_name: str | None = None
    pool_size: float | None = None
    pool_available: float | None = None
    is_active: bool | None = None
    
    # Warrant-Specific Fields
    warrant_type: str | None = None
    is_detachable: bool = Field(default=False)
    deal_context: str | None = None
    is_transferable: bool = Field(default=False)
    
    # Shared Option/Warrant Fields
    total_shares: float | None = None
    issue_rights: str | None = Field(None, max_length=50)
    convert_to: str | None = None
    
    # Bond Fields
    principal: float | None = None
    coupon_rate: float | None = None
    coupon_frequency: str | None = None
    principal_frequency: str | None = None
    tenure_months: int | None = None
    moratorium_period: int | None = None

class SecurityUpdate(BaseModel):
    """Schema for updating a security"""
    funding_round_id: int | None = None
    security_name: str | None = Field(None, min_length=1, max_length=255)
    code: str | None = Field(None, max_length=20)
    security_type: SecurityType | None = None
    currency: Currency | None = None
    issue_price: float | None = None
    special_terms: str | None = None
    
    # Stock Fields
    is_preferred: bool | None = None
    
    # Voting Rights
    has_voting_rights: bool | None = None
    voting_ratio: float | None = None
    
    # Dividend Rights
    has_dividend_rights: bool | None = None
    dividend_rate: float | None = None
    is_dividend_cumulative: bool | None = None
    
    # Liquidation & Participation
    liquidation_preference: float | None = None
    has_participation: bool | None = None
    participation_cap: float | None = None
    seniority: int | None = None
    anti_dilution: AntiDilutionType | None = None

    # Conversion Rights
    has_conversion_rights: bool | None = None
    conversion_ratio: float | None = None

    # Redemption Rights
    has_redemption_rights: bool | None = None
    redemption_term: int | None = None

    # Convertible Security Fields
    interest_rate: float | None = None
    interest_rate_type: InterestRateType | None = None
    interest_period: str | None = None
    maturity_date: date_type | None = None
    valuation_cap: float | None = None
    conversion_discount: float | None = None
    conversion_basis: str | None = Field(None, max_length=50)
    
    # Option-Specific Fields
    option_type: str | None = None
    
    # Vesting & Exercise Terms
    vesting_start: date_type | None = None
    vesting_months: int | None = None
    cliff_months: int | None = None
    vesting_schedule_type: str | None = None
    exercise_window_days: int | None = None
    strike_price: float | None = None
    expiration_date: date_type | None = None
    termination_date: date_type | None = None
    
    # Option Pool Management
    pool_name: str | None = None
    pool_size: float | None = None
    pool_available: float | None = None
    is_active: bool | None = None
    
    # Warrant-Specific Fields
    warrant_type: str | None = None
    is_detachable: bool | None = None
    deal_context: str | None = None
    is_transferable: bool | None = None
    
    # Shared Option/Warrant Fields
    total_shares: float | None = None
    issue_rights: str | None = Field(None, max_length=50)
    convert_to: str | None = None
    
    # Bond Fields
    principal: float | None = None
    coupon_rate: float | None = None
    coupon_frequency: str | None = None
    principal_frequency: str | None = None
    tenure_months: int | None = None
    moratorium_period: int | None = None

# ==========================================
# Response Types
# ==========================================

class SecurityResponse(BaseModel):
    """Response containing a single security"""
    success: bool
    data: Security | None = None
    error: str | None = None

class SecuritiesResponse(BaseModel):
    """Response containing multiple securities"""
    success: bool
    data: list[Security] | None = None
    error: str | None = None