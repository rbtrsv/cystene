"""
BalanceSheet Schemas

Pydantic schemas for the BalanceSheet model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from datetime import date as date_type

# ==========================================
# BalanceSheet Schema (Full Representation)
# ==========================================

class BalanceSheet(BaseModel):
    """BalanceSheet schema - full representation"""
    id: int
    entity_id: int = Field(description="Associated entity ID")

    # Time Dimensions
    year: int = Field(description="Fiscal year")
    quarter: str | None = Field(None, description="Fiscal quarter")
    semester: str | None = Field(None, description="Fiscal semester")
    month: str | None = Field(None, description="Fiscal month")
    full_year: bool = Field(description="Whether this is a full year balance sheet")
    scenario: str = Field(description="Scenario type (actual, budget, forecast)")
    date: date_type | None = Field(None, description="Balance sheet date")

    # Current Assets
    cash: float | None = Field(None, description="Cash")
    cash_equivalents: float | None = Field(None, description="Cash equivalents")
    cash_and_cash_equivalents: float | None = Field(None, description="Cash and cash equivalents")
    other_short_term_investments: float | None = Field(None, description="Other short-term investments")
    accounts_receivable: float | None = Field(None, description="Accounts receivable")
    other_receivables: float | None = Field(None, description="Other receivables")
    inventory: float | None = Field(None, description="Inventory")
    prepaid_assets: float | None = Field(None, description="Prepaid assets")
    restricted_cash: float | None = Field(None, description="Restricted cash")
    assets_held_for_sale: float | None = Field(None, description="Assets held for sale")
    hedging_assets: float | None = Field(None, description="Hedging assets")
    other_current_assets: float | None = Field(None, description="Other current assets")
    total_current_assets: float | None = Field(None, description="Total current assets")

    # Non-current Assets
    properties: float | None = Field(None, description="Properties")
    land_and_improvements: float | None = Field(None, description="Land and improvements")
    machinery_furniture_equipment: float | None = Field(None, description="Machinery, furniture and equipment")
    construction_in_progress: float | None = Field(None, description="Construction in progress")
    leases: float | None = Field(None, description="Leases")
    accumulated_depreciation: float | None = Field(None, description="Accumulated depreciation")
    goodwill: float | None = Field(None, description="Goodwill")
    investment_properties: float | None = Field(None, description="Investment properties")
    financial_assets: float | None = Field(None, description="Financial assets")
    intangible_assets: float | None = Field(None, description="Intangible assets")
    investments_and_advances: float | None = Field(None, description="Investments and advances")
    other_non_current_assets: float | None = Field(None, description="Other non-current assets")
    total_non_current_assets: float | None = Field(None, description="Total non-current assets")

    # Total Assets
    total_assets: float | None = Field(None, description="Total assets")

    # Current Liabilities
    accounts_payable: float | None = Field(None, description="Accounts payable")
    accrued_expenses: float | None = Field(None, description="Accrued expenses")
    short_term_debt: float | None = Field(None, description="Short-term debt")
    deferred_revenue: float | None = Field(None, description="Deferred revenue")
    tax_payable: float | None = Field(None, description="Tax payable")
    pensions: float | None = Field(None, description="Pensions")
    other_current_liabilities: float | None = Field(None, description="Other current liabilities")
    total_current_liabilities: float | None = Field(None, description="Total current liabilities")

    # Non-current Liabilities
    long_term_provisions: float | None = Field(None, description="Long-term provisions")
    long_term_debt: float | None = Field(None, description="Long-term debt")
    provision_for_risks_and_charges: float | None = Field(None, description="Provision for risks and charges")
    deferred_liabilities: float | None = Field(None, description="Deferred liabilities")
    derivative_product_liabilities: float | None = Field(None, description="Derivative product liabilities")
    other_non_current_liabilities: float | None = Field(None, description="Other non-current liabilities")
    total_non_current_liabilities: float | None = Field(None, description="Total non-current liabilities")

    # Total Liabilities
    total_liabilities: float | None = Field(None, description="Total liabilities")

    # Shareholders Equity
    common_stock: float | None = Field(None, description="Common stock")
    retained_earnings: float | None = Field(None, description="Retained earnings")
    other_shareholders_equity: float | None = Field(None, description="Other shareholders equity")
    total_shareholders_equity: float | None = Field(None, description="Total shareholders equity")
    additional_paid_in_capital: float | None = Field(None, description="Additional paid-in capital")
    treasury_stock: float | None = Field(None, description="Treasury stock")
    minority_interest: float | None = Field(None, description="Minority interest")

    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class BalanceSheetCreate(BaseModel):
    """Schema for creating a new balance sheet"""
    # Required fields
    entity_id: int = Field(description="Associated entity ID")
    year: int = Field(description="Fiscal year")

    # Fields with defaults
    full_year: bool = Field(default=False, description="Whether this is a full year balance sheet")
    scenario: str = Field(default="actual", description="Scenario type (actual, budget, forecast)")

    # Optional fields
    quarter: str | None = Field(None, description="Fiscal quarter")
    semester: str | None = Field(None, description="Fiscal semester")
    month: str | None = Field(None, description="Fiscal month")
    date: date_type | None = Field(None, description="Balance sheet date")

    # Current Assets
    cash: float | None = Field(None, description="Cash")
    cash_equivalents: float | None = Field(None, description="Cash equivalents")
    cash_and_cash_equivalents: float | None = Field(None, description="Cash and cash equivalents")
    other_short_term_investments: float | None = Field(None, description="Other short-term investments")
    accounts_receivable: float | None = Field(None, description="Accounts receivable")
    other_receivables: float | None = Field(None, description="Other receivables")
    inventory: float | None = Field(None, description="Inventory")
    prepaid_assets: float | None = Field(None, description="Prepaid assets")
    restricted_cash: float | None = Field(None, description="Restricted cash")
    assets_held_for_sale: float | None = Field(None, description="Assets held for sale")
    hedging_assets: float | None = Field(None, description="Hedging assets")
    other_current_assets: float | None = Field(None, description="Other current assets")
    total_current_assets: float | None = Field(None, description="Total current assets")

    # Non-current Assets
    properties: float | None = Field(None, description="Properties")
    land_and_improvements: float | None = Field(None, description="Land and improvements")
    machinery_furniture_equipment: float | None = Field(None, description="Machinery, furniture and equipment")
    construction_in_progress: float | None = Field(None, description="Construction in progress")
    leases: float | None = Field(None, description="Leases")
    accumulated_depreciation: float | None = Field(None, description="Accumulated depreciation")
    goodwill: float | None = Field(None, description="Goodwill")
    investment_properties: float | None = Field(None, description="Investment properties")
    financial_assets: float | None = Field(None, description="Financial assets")
    intangible_assets: float | None = Field(None, description="Intangible assets")
    investments_and_advances: float | None = Field(None, description="Investments and advances")
    other_non_current_assets: float | None = Field(None, description="Other non-current assets")
    total_non_current_assets: float | None = Field(None, description="Total non-current assets")

    # Total Assets
    total_assets: float | None = Field(None, description="Total assets")

    # Current Liabilities
    accounts_payable: float | None = Field(None, description="Accounts payable")
    accrued_expenses: float | None = Field(None, description="Accrued expenses")
    short_term_debt: float | None = Field(None, description="Short-term debt")
    deferred_revenue: float | None = Field(None, description="Deferred revenue")
    tax_payable: float | None = Field(None, description="Tax payable")
    pensions: float | None = Field(None, description="Pensions")
    other_current_liabilities: float | None = Field(None, description="Other current liabilities")
    total_current_liabilities: float | None = Field(None, description="Total current liabilities")

    # Non-current Liabilities
    long_term_provisions: float | None = Field(None, description="Long-term provisions")
    long_term_debt: float | None = Field(None, description="Long-term debt")
    provision_for_risks_and_charges: float | None = Field(None, description="Provision for risks and charges")
    deferred_liabilities: float | None = Field(None, description="Deferred liabilities")
    derivative_product_liabilities: float | None = Field(None, description="Derivative product liabilities")
    other_non_current_liabilities: float | None = Field(None, description="Other non-current liabilities")
    total_non_current_liabilities: float | None = Field(None, description="Total non-current liabilities")

    # Total Liabilities
    total_liabilities: float | None = Field(None, description="Total liabilities")

    # Shareholders Equity
    common_stock: float | None = Field(None, description="Common stock")
    retained_earnings: float | None = Field(None, description="Retained earnings")
    other_shareholders_equity: float | None = Field(None, description="Other shareholders equity")
    total_shareholders_equity: float | None = Field(None, description="Total shareholders equity")
    additional_paid_in_capital: float | None = Field(None, description="Additional paid-in capital")
    treasury_stock: float | None = Field(None, description="Treasury stock")
    minority_interest: float | None = Field(None, description="Minority interest")

class BalanceSheetUpdate(BaseModel):
    """Schema for updating a balance sheet"""
    entity_id: int | None = None

    # Time Dimensions
    year: int | None = None
    quarter: str | None = None
    semester: str | None = None
    month: str | None = None
    full_year: bool | None = None
    scenario: str | None = None
    date: date_type | None = None

    # Current Assets
    cash: float | None = None
    cash_equivalents: float | None = None
    cash_and_cash_equivalents: float | None = None
    other_short_term_investments: float | None = None
    accounts_receivable: float | None = None
    other_receivables: float | None = None
    inventory: float | None = None
    prepaid_assets: float | None = None
    restricted_cash: float | None = None
    assets_held_for_sale: float | None = None
    hedging_assets: float | None = None
    other_current_assets: float | None = None
    total_current_assets: float | None = None

    # Non-current Assets
    properties: float | None = None
    land_and_improvements: float | None = None
    machinery_furniture_equipment: float | None = None
    construction_in_progress: float | None = None
    leases: float | None = None
    accumulated_depreciation: float | None = None
    goodwill: float | None = None
    investment_properties: float | None = None
    financial_assets: float | None = None
    intangible_assets: float | None = None
    investments_and_advances: float | None = None
    other_non_current_assets: float | None = None
    total_non_current_assets: float | None = None

    # Total Assets
    total_assets: float | None = None

    # Current Liabilities
    accounts_payable: float | None = None
    accrued_expenses: float | None = None
    short_term_debt: float | None = None
    deferred_revenue: float | None = None
    tax_payable: float | None = None
    pensions: float | None = None
    other_current_liabilities: float | None = None
    total_current_liabilities: float | None = None

    # Non-current Liabilities
    long_term_provisions: float | None = None
    long_term_debt: float | None = None
    provision_for_risks_and_charges: float | None = None
    deferred_liabilities: float | None = None
    derivative_product_liabilities: float | None = None
    other_non_current_liabilities: float | None = None
    total_non_current_liabilities: float | None = None

    # Total Liabilities
    total_liabilities: float | None = None

    # Shareholders Equity
    common_stock: float | None = None
    retained_earnings: float | None = None
    other_shareholders_equity: float | None = None
    total_shareholders_equity: float | None = None
    additional_paid_in_capital: float | None = None
    treasury_stock: float | None = None
    minority_interest: float | None = None

# ==========================================
# Response Types
# ==========================================

class BalanceSheetResponse(BaseModel):
    """Response containing a single balance sheet"""
    success: bool
    data: BalanceSheet | None = None
    error: str | None = None

class BalanceSheetsResponse(BaseModel):
    """Response containing multiple balance sheets"""
    success: bool
    data: list[BalanceSheet] | None = None
    error: str | None = None
