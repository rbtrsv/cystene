"""
IncomeStatement Schemas

Pydantic schemas for the IncomeStatement model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from datetime import date as date_type
from .shared_financial_schemas import Scenario, Quarter, Semester, Month

# ==========================================
# IncomeStatement Schema (Full Representation)
# ==========================================

class IncomeStatement(BaseModel):
    """IncomeStatement schema - full representation"""
    id: int
    entity_id: int = Field(description="Associated entity ID")

    # Time Dimensions
    year: int = Field(description="Fiscal year")
    quarter: Quarter | None = Field(None, description="Fiscal quarter")
    semester: Semester | None = Field(None, description="Fiscal semester")
    month: Month | None = Field(None, description="Fiscal month")
    full_year: bool = Field(description="Whether this is a full year statement")
    scenario: Scenario = Field(description="Scenario type")
    period_start: date_type | None = Field(None, description="Period start date")
    period_end: date_type | None = Field(None, description="Period end date")

    # Revenue
    revenue: float | None = Field(None, description="Total revenue")
    cost_of_goods: float | None = Field(None, description="Cost of goods sold")
    gross_profit: float | None = Field(None, description="Gross profit")

    # Operating Expenses
    research_and_development: float | None = Field(None, description="Research and development expenses")
    selling_general_and_administrative: float | None = Field(None, description="Selling, general and administrative expenses")
    other_operating_expenses: float | None = Field(None, description="Other operating expenses")

    # Results
    operating_income: float | None = Field(None, description="Operating income")
    non_operating_interest_income: float | None = Field(None, description="Non-operating interest income")
    non_operating_interest_expense: float | None = Field(None, description="Non-operating interest expense")
    other_income_expense: float | None = Field(None, description="Other income/expense")
    pretax_income: float | None = Field(None, description="Pretax income")
    income_tax: float | None = Field(None, description="Income tax")
    net_income: float | None = Field(None, description="Net income")

    # Additional
    eps_basic: float | None = Field(None, description="Basic earnings per share")
    eps_diluted: float | None = Field(None, description="Diluted earnings per share")
    basic_shares_outstanding: float | None = Field(None, description="Basic shares outstanding")
    diluted_shares_outstanding: float | None = Field(None, description="Diluted shares outstanding")
    ebitda: float | None = Field(None, description="EBITDA")
    net_income_continuous_operations: float | None = Field(None, description="Net income from continuous operations")
    minority_interests: float | None = Field(None, description="Minority interests")
    preferred_stock_dividends: float | None = Field(None, description="Preferred stock dividends")

    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class IncomeStatementCreate(BaseModel):
    """Schema for creating a new income statement"""
    # Required fields
    entity_id: int = Field(description="Associated entity ID")
    year: int = Field(description="Fiscal year")

    # Fields with defaults
    full_year: bool = Field(default=False, description="Whether this is a full year statement")
    scenario: Scenario = Field(default=Scenario.ACTUAL, description="Scenario type")

    # Optional fields
    quarter: Quarter | None = Field(None, description="Fiscal quarter")
    semester: Semester | None = Field(None, description="Fiscal semester")
    month: Month | None = Field(None, description="Fiscal month")
    period_start: date_type | None = Field(None, description="Period start date")
    period_end: date_type | None = Field(None, description="Period end date")

    # Revenue
    revenue: float | None = Field(None, description="Total revenue")
    cost_of_goods: float | None = Field(None, description="Cost of goods sold")
    gross_profit: float | None = Field(None, description="Gross profit")

    # Operating Expenses
    research_and_development: float | None = Field(None, description="Research and development expenses")
    selling_general_and_administrative: float | None = Field(None, description="Selling, general and administrative expenses")
    other_operating_expenses: float | None = Field(None, description="Other operating expenses")

    # Results
    operating_income: float | None = Field(None, description="Operating income")
    non_operating_interest_income: float | None = Field(None, description="Non-operating interest income")
    non_operating_interest_expense: float | None = Field(None, description="Non-operating interest expense")
    other_income_expense: float | None = Field(None, description="Other income/expense")
    pretax_income: float | None = Field(None, description="Pretax income")
    income_tax: float | None = Field(None, description="Income tax")
    net_income: float | None = Field(None, description="Net income")

    # Additional
    eps_basic: float | None = Field(None, description="Basic earnings per share")
    eps_diluted: float | None = Field(None, description="Diluted earnings per share")
    basic_shares_outstanding: float | None = Field(None, description="Basic shares outstanding")
    diluted_shares_outstanding: float | None = Field(None, description="Diluted shares outstanding")
    ebitda: float | None = Field(None, description="EBITDA")
    net_income_continuous_operations: float | None = Field(None, description="Net income from continuous operations")
    minority_interests: float | None = Field(None, description="Minority interests")
    preferred_stock_dividends: float | None = Field(None, description="Preferred stock dividends")

class IncomeStatementUpdate(BaseModel):
    """Schema for updating an income statement"""
    entity_id: int | None = None

    # Time Dimensions
    year: int | None = None
    quarter: Quarter | None = None
    semester: Semester | None = None
    month: Month | None = None
    full_year: bool | None = None
    scenario: Scenario | None = None
    period_start: date_type | None = None
    period_end: date_type | None = None

    # Revenue
    revenue: float | None = None
    cost_of_goods: float | None = None
    gross_profit: float | None = None

    # Operating Expenses
    research_and_development: float | None = None
    selling_general_and_administrative: float | None = None
    other_operating_expenses: float | None = None

    # Results
    operating_income: float | None = None
    non_operating_interest_income: float | None = None
    non_operating_interest_expense: float | None = None
    other_income_expense: float | None = None
    pretax_income: float | None = None
    income_tax: float | None = None
    net_income: float | None = None

    # Additional
    eps_basic: float | None = None
    eps_diluted: float | None = None
    basic_shares_outstanding: float | None = None
    diluted_shares_outstanding: float | None = None
    ebitda: float | None = None
    net_income_continuous_operations: float | None = None
    minority_interests: float | None = None
    preferred_stock_dividends: float | None = None

# ==========================================
# Response Types
# ==========================================

class IncomeStatementResponse(BaseModel):
    """Response containing a single income statement"""
    success: bool
    data: IncomeStatement | None = None
    error: str | None = None

class IncomeStatementsResponse(BaseModel):
    """Response containing multiple income statements"""
    success: bool
    data: list[IncomeStatement] | None = None
    error: str | None = None
