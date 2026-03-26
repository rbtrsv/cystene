"""
Fee Schemas

Pydantic schemas for the Fee model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from datetime import date as date_type
from enum import Enum

# ==========================================
# Enum Types
# ==========================================

class FeeType(str, Enum):
    """Fee type options"""
    MANAGEMENT = "management"
    PERFORMANCE = "performance"
    SETUP = "setup"
    ADMINISTRATIVE = "administrative"
    OTHER = "other"

class Frequency(str, Enum):
    """Fee frequency options"""
    ONE_TIME = "one_time"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"

class Scenario(str, Enum):
    """Fee scenario options"""
    ACTUAL = "actual"
    FORECAST = "forecast"
    BUDGET = "budget"

class Quarter(str, Enum):
    """Quarter options"""
    Q1 = "Q1"
    Q2 = "Q2"
    Q3 = "Q3"
    Q4 = "Q4"

class Semester(str, Enum):
    """Semester options"""
    S1 = "S1"
    S2 = "S2"

# ==========================================
# Fee Schema (Full Representation)
# ==========================================

class Fee(BaseModel):
    """Fee schema - full representation"""
    id: int
    entity_id: int = Field(description="Associated entity ID")
    funding_round_id: int | None = Field(None, description="Associated funding round ID")

    # Time dimensions
    year: int = Field(description="Fee year")
    quarter: Quarter | None = Field(None, description="Quarter (Q1-Q4)")
    semester: Semester | None = Field(None, description="Semester (S1-S2)")
    month: str | None = Field(None, description="Month name")
    full_year: bool = Field(default=False, description="Whether fee applies to the full year")
    scenario: Scenario = Field(description="Fee scenario")

    # Period dimension
    date: date_type | None = Field(None, description="Fee date")

    # Fee details
    fee_type: FeeType = Field(description="Type of fee")
    fee_cost_name: str | None = Field(None, description="Fee cost name")
    frequency: Frequency = Field(description="Fee frequency")
    amount: float | None = Field(None, description="Fee amount")
    percentage: float | None = Field(None, description="Fee percentage")
    description: str | None = Field(None, description="Fee description")
    transaction_reference: str | None = Field(None, description="Transaction reference")

    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class FeeCreate(BaseModel):
    """Schema for creating a new fee"""
    entity_id: int = Field(description="Associated entity ID")
    funding_round_id: int | None = Field(None, description="Associated funding round ID")

    # Time dimensions
    year: int = Field(description="Fee year")
    quarter: Quarter | None = Field(None, description="Quarter (Q1-Q4)")
    semester: Semester | None = Field(None, description="Semester (S1-S2)")
    month: str | None = Field(None, description="Month name")
    full_year: bool = Field(default=False, description="Whether fee applies to the full year")
    scenario: Scenario = Field(default=Scenario.ACTUAL, description="Fee scenario")

    # Period dimension
    date: date_type | None = Field(None, description="Fee date")

    # Fee details
    fee_type: FeeType = Field(description="Type of fee")
    fee_cost_name: str | None = Field(None, description="Fee cost name")
    frequency: Frequency = Field(default=Frequency.ONE_TIME, description="Fee frequency")
    amount: float | None = Field(None, description="Fee amount")
    percentage: float | None = Field(None, description="Fee percentage")
    description: str | None = Field(None, description="Fee description")
    transaction_reference: str | None = Field(None, description="Transaction reference")

class FeeUpdate(BaseModel):
    """Schema for updating a fee"""
    entity_id: int | None = None
    funding_round_id: int | None = None

    # Time dimensions
    year: int | None = None
    quarter: Quarter | None = None
    semester: Semester | None = None
    month: str | None = None
    full_year: bool | None = None
    scenario: Scenario | None = None

    # Period dimension
    date: date_type | None = None

    # Fee details
    fee_type: FeeType | None = None
    fee_cost_name: str | None = None
    frequency: Frequency | None = None
    amount: float | None = None
    percentage: float | None = None
    description: str | None = None
    transaction_reference: str | None = None

# ==========================================
# Response Types
# ==========================================

class FeeResponse(BaseModel):
    """Response containing a single fee"""
    success: bool
    data: Fee | None = None
    error: str | None = None

class FeesResponse(BaseModel):
    """Response containing multiple fees"""
    success: bool
    data: list[Fee] | None = None
    error: str | None = None
