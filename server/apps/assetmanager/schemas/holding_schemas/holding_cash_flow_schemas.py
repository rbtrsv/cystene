"""
HoldingCashFlow Schemas

Pydantic schemas for the HoldingCashFlow model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from datetime import date as date_type
from enum import Enum

# ==========================================
# Enum Types
# ==========================================

class CashFlowType(str, Enum):
    """Cash flow type options"""
    INVESTMENT = "investment"
    DISTRIBUTION = "distribution"
    DIVIDEND = "dividend"
    FEE = "fee"
    OTHER = "other"

class CashFlowCategory(str, Enum):
    """Cash flow category options"""
    ACTUAL = "actual"
    PROJECTED = "projected"

class CashFlowScenario(str, Enum):
    """Cash flow scenario options"""
    ACTUAL = "actual"
    BUDGET = "budget"
    FORECAST = "forecast"

# ==========================================
# HoldingCashFlow Schema (Full Representation)
# ==========================================

class HoldingCashFlow(BaseModel):
    """HoldingCashFlow schema - full representation"""
    id: int
    holding_id: int = Field(description="Associated holding ID")
    entity_id: int = Field(description="Associated entity ID")
    target_entity_id: int | None = Field(None, description="Target entity ID")
    funding_round_id: int | None = Field(None, description="Associated funding round ID")

    # Cash Flow Details
    date: date_type = Field(description="Cash flow date")
    amount_debit: float = Field(description="Debit amount")
    amount_credit: float = Field(description="Credit amount")
    currency: str = Field(description="Currency code")
    cash_flow_type: CashFlowType = Field(description="Cash flow type")
    category: CashFlowCategory = Field(description="Cash flow category")
    scenario: CashFlowScenario = Field(description="Cash flow scenario")

    # Transaction Reference
    cash_transaction_id: int | None = Field(None, description="Associated security transaction ID")

    # Additional Info
    transaction_reference: str | None = Field(None, description="Transaction reference")
    description: str | None = Field(None, description="Description")
    include_in_irr: bool = Field(description="Include in IRR calculation")

    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class HoldingCashFlowCreate(BaseModel):
    """Schema for creating a new holding cash flow"""
    # Required fields
    holding_id: int = Field(description="Associated holding ID")
    entity_id: int = Field(description="Associated entity ID")
    date: date_type = Field(description="Cash flow date")
    cash_flow_type: CashFlowType = Field(description="Cash flow type")

    # Fields with defaults
    amount_debit: float = Field(default=0, description="Debit amount")
    amount_credit: float = Field(default=0, description="Credit amount")
    currency: str = Field(default="USD", max_length=3, description="Currency code")
    category: CashFlowCategory = Field(default=CashFlowCategory.ACTUAL, description="Cash flow category")
    scenario: CashFlowScenario = Field(default=CashFlowScenario.ACTUAL, description="Cash flow scenario")
    include_in_irr: bool = Field(default=True, description="Include in IRR calculation")

    # Optional fields
    target_entity_id: int | None = Field(None, description="Target entity ID")
    funding_round_id: int | None = Field(None, description="Associated funding round ID")
    cash_transaction_id: int | None = Field(None, description="Associated security transaction ID")
    transaction_reference: str | None = Field(None, description="Transaction reference")
    description: str | None = Field(None, description="Description")

class HoldingCashFlowUpdate(BaseModel):
    """Schema for updating a holding cash flow"""
    holding_id: int | None = None
    entity_id: int | None = None
    target_entity_id: int | None = None
    funding_round_id: int | None = None

    # Cash Flow Details
    date: date_type | None = None
    amount_debit: float | None = None
    amount_credit: float | None = None
    currency: str | None = Field(None, max_length=3)
    cash_flow_type: CashFlowType | None = None
    category: CashFlowCategory | None = None
    scenario: CashFlowScenario | None = None

    # Transaction Reference
    cash_transaction_id: int | None = None

    # Additional Info
    transaction_reference: str | None = None
    description: str | None = None
    include_in_irr: bool | None = None

# ==========================================
# Response Types
# ==========================================

class HoldingCashFlowResponse(BaseModel):
    """Response containing a single holding cash flow"""
    success: bool
    data: HoldingCashFlow | None = None
    error: str | None = None

class HoldingCashFlowsResponse(BaseModel):
    """Response containing multiple holding cash flows"""
    success: bool
    data: list[HoldingCashFlow] | None = None
    error: str | None = None
