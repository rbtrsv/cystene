"""
CashFlowStatement Schemas

Pydantic schemas for the CashFlowStatement model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from datetime import date as date_type

# ==========================================
# CashFlowStatement Schema (Full Representation)
# ==========================================

class CashFlowStatement(BaseModel):
    """CashFlowStatement schema - full representation"""
    id: int
    entity_id: int = Field(description="Associated entity ID")

    # Time Dimensions
    year: int = Field(description="Fiscal year")
    quarter: str | None = Field(None, description="Fiscal quarter")
    semester: str | None = Field(None, description="Fiscal semester")
    month: str | None = Field(None, description="Fiscal month")
    full_year: bool = Field(description="Whether this is a full year statement")
    scenario: str = Field(description="Scenario type (actual, budget, forecast)")
    period_start: date_type | None = Field(None, description="Period start date")
    period_end: date_type | None = Field(None, description="Period end date")

    # Operating Activities
    net_income: float | None = Field(None, description="Net income")
    depreciation: float | None = Field(None, description="Depreciation and amortization")
    deferred_taxes: float | None = Field(None, description="Deferred taxes")
    stock_based_compensation: float | None = Field(None, description="Stock-based compensation")
    other_non_cash_items: float | None = Field(None, description="Other non-cash items")
    accounts_receivable: float | None = Field(None, description="Changes in accounts receivable")
    accounts_payable: float | None = Field(None, description="Changes in accounts payable")
    other_assets_liabilities: float | None = Field(None, description="Changes in other assets and liabilities")
    operating_cash_flow: float | None = Field(None, description="Operating cash flow")

    # Investing Activities
    capital_expenditures: float | None = Field(None, description="Capital expenditures")
    net_intangibles: float | None = Field(None, description="Net intangibles")
    net_acquisitions: float | None = Field(None, description="Net acquisitions")
    purchase_of_investments: float | None = Field(None, description="Purchase of investments")
    sale_of_investments: float | None = Field(None, description="Sale of investments")
    other_investing_activity: float | None = Field(None, description="Other investing activity")
    investing_cash_flow: float | None = Field(None, description="Investing cash flow")

    # Financing Activities
    long_term_debt_issuance: float | None = Field(None, description="Long-term debt issuance")
    long_term_debt_payments: float | None = Field(None, description="Long-term debt payments")
    short_term_debt_issuance: float | None = Field(None, description="Short-term debt issuance")
    common_stock_issuance: float | None = Field(None, description="Common stock issuance")
    common_stock_repurchase: float | None = Field(None, description="Common stock repurchase")
    common_dividends: float | None = Field(None, description="Common dividends")
    other_financing_charges: float | None = Field(None, description="Other financing charges")
    financing_cash_flow: float | None = Field(None, description="Financing cash flow")

    # Summary
    end_cash_position: float | None = Field(None, description="End cash position")
    income_tax_paid: float | None = Field(None, description="Income tax paid")
    interest_paid: float | None = Field(None, description="Interest paid")
    free_cash_flow: float | None = Field(None, description="Free cash flow")

    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class CashFlowStatementCreate(BaseModel):
    """Schema for creating a new cash flow statement"""
    # Required fields
    entity_id: int = Field(description="Associated entity ID")
    year: int = Field(description="Fiscal year")

    # Fields with defaults
    full_year: bool = Field(default=False, description="Whether this is a full year statement")
    scenario: str = Field(default="actual", description="Scenario type (actual, budget, forecast)")

    # Optional fields
    quarter: str | None = Field(None, description="Fiscal quarter")
    semester: str | None = Field(None, description="Fiscal semester")
    month: str | None = Field(None, description="Fiscal month")
    period_start: date_type | None = Field(None, description="Period start date")
    period_end: date_type | None = Field(None, description="Period end date")

    # Operating Activities
    net_income: float | None = Field(None, description="Net income")
    depreciation: float | None = Field(None, description="Depreciation and amortization")
    deferred_taxes: float | None = Field(None, description="Deferred taxes")
    stock_based_compensation: float | None = Field(None, description="Stock-based compensation")
    other_non_cash_items: float | None = Field(None, description="Other non-cash items")
    accounts_receivable: float | None = Field(None, description="Changes in accounts receivable")
    accounts_payable: float | None = Field(None, description="Changes in accounts payable")
    other_assets_liabilities: float | None = Field(None, description="Changes in other assets and liabilities")
    operating_cash_flow: float | None = Field(None, description="Operating cash flow")

    # Investing Activities
    capital_expenditures: float | None = Field(None, description="Capital expenditures")
    net_intangibles: float | None = Field(None, description="Net intangibles")
    net_acquisitions: float | None = Field(None, description="Net acquisitions")
    purchase_of_investments: float | None = Field(None, description="Purchase of investments")
    sale_of_investments: float | None = Field(None, description="Sale of investments")
    other_investing_activity: float | None = Field(None, description="Other investing activity")
    investing_cash_flow: float | None = Field(None, description="Investing cash flow")

    # Financing Activities
    long_term_debt_issuance: float | None = Field(None, description="Long-term debt issuance")
    long_term_debt_payments: float | None = Field(None, description="Long-term debt payments")
    short_term_debt_issuance: float | None = Field(None, description="Short-term debt issuance")
    common_stock_issuance: float | None = Field(None, description="Common stock issuance")
    common_stock_repurchase: float | None = Field(None, description="Common stock repurchase")
    common_dividends: float | None = Field(None, description="Common dividends")
    other_financing_charges: float | None = Field(None, description="Other financing charges")
    financing_cash_flow: float | None = Field(None, description="Financing cash flow")

    # Summary
    end_cash_position: float | None = Field(None, description="End cash position")
    income_tax_paid: float | None = Field(None, description="Income tax paid")
    interest_paid: float | None = Field(None, description="Interest paid")
    free_cash_flow: float | None = Field(None, description="Free cash flow")

class CashFlowStatementUpdate(BaseModel):
    """Schema for updating a cash flow statement"""
    entity_id: int | None = None

    # Time Dimensions
    year: int | None = None
    quarter: str | None = None
    semester: str | None = None
    month: str | None = None
    full_year: bool | None = None
    scenario: str | None = None
    period_start: date_type | None = None
    period_end: date_type | None = None

    # Operating Activities
    net_income: float | None = None
    depreciation: float | None = None
    deferred_taxes: float | None = None
    stock_based_compensation: float | None = None
    other_non_cash_items: float | None = None
    accounts_receivable: float | None = None
    accounts_payable: float | None = None
    other_assets_liabilities: float | None = None
    operating_cash_flow: float | None = None

    # Investing Activities
    capital_expenditures: float | None = None
    net_intangibles: float | None = None
    net_acquisitions: float | None = None
    purchase_of_investments: float | None = None
    sale_of_investments: float | None = None
    other_investing_activity: float | None = None
    investing_cash_flow: float | None = None

    # Financing Activities
    long_term_debt_issuance: float | None = None
    long_term_debt_payments: float | None = None
    short_term_debt_issuance: float | None = None
    common_stock_issuance: float | None = None
    common_stock_repurchase: float | None = None
    common_dividends: float | None = None
    other_financing_charges: float | None = None
    financing_cash_flow: float | None = None

    # Summary
    end_cash_position: float | None = None
    income_tax_paid: float | None = None
    interest_paid: float | None = None
    free_cash_flow: float | None = None

# ==========================================
# Response Types
# ==========================================

class CashFlowStatementResponse(BaseModel):
    """Response containing a single cash flow statement"""
    success: bool
    data: CashFlowStatement | None = None
    error: str | None = None

class CashFlowStatementsResponse(BaseModel):
    """Response containing multiple cash flow statements"""
    success: bool
    data: list[CashFlowStatement] | None = None
    error: str | None = None
