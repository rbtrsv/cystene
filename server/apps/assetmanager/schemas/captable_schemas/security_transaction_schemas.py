"""
SecurityTransaction Schemas

Pydantic schemas for the SecurityTransaction model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from datetime import date as date_type
from enum import Enum

class TransactionType(str, Enum):
    """Security transaction type options"""
    ISSUANCE = "issuance"
    TRANSFER = "transfer"
    CONVERSION = "conversion"
    REDEMPTION = "redemption"
    EXERCISE = "exercise"
    CANCELLATION = "cancellation"
    SPLIT = "split"
    MERGER = "merger"

# ==========================================
# SecurityTransaction Schema (Full Representation)
# ==========================================

class SecurityTransaction(BaseModel):
    """SecurityTransaction schema - full representation"""
    id: int
    entity_id: int = Field(description="Associated entity ID")
    stakeholder_id: int = Field(description="Associated stakeholder ID")
    funding_round_id: int = Field(description="Associated funding round ID")
    security_id: int | None = Field(None, description="Associated security ID (NULL for fund-level transactions)")
    transaction_reference: str = Field(max_length=50, description="Transaction reference")
    transaction_type: TransactionType = Field(description="Transaction type")
    units_debit: float = Field(default=0, description="Units debit amount")
    units_credit: float = Field(default=0, description="Units credit amount")
    amount_debit: float = Field(default=0, description="Cash debit amount")
    amount_credit: float = Field(default=0, description="Cash credit amount")
    transaction_date: date_type = Field(description="Transaction date")
    notes: str | None = Field(None, description="Transaction notes")
    related_transaction_id: int | None = Field(None, description="Related transaction ID")
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class SecurityTransactionCreate(BaseModel):
    """Schema for creating a new security transaction"""
    entity_id: int = Field(description="Associated entity ID")
    stakeholder_id: int = Field(description="Associated stakeholder ID")
    funding_round_id: int = Field(description="Associated funding round ID")
    security_id: int | None = Field(None, description="Associated security ID (NULL for fund-level transactions)")
    transaction_reference: str = Field(max_length=50, description="Transaction reference")
    transaction_type: TransactionType = Field(description="Transaction type")
    units_debit: float = Field(default=0, description="Units debit amount")
    units_credit: float = Field(default=0, description="Units credit amount")
    amount_debit: float = Field(default=0, description="Cash debit amount")
    amount_credit: float = Field(default=0, description="Cash credit amount")
    transaction_date: date_type = Field(description="Transaction date")
    notes: str | None = Field(None, description="Transaction notes")
    related_transaction_id: int | None = Field(None, description="Related transaction ID")

class SecurityTransactionUpdate(BaseModel):
    """Schema for updating a security transaction"""
    entity_id: int | None = None
    stakeholder_id: int | None = None
    funding_round_id: int | None = None
    security_id: int | None = None
    transaction_reference: str | None = Field(None, max_length=50)
    transaction_type: TransactionType | None = None
    units_debit: float | None = None
    units_credit: float | None = None
    amount_debit: float | None = None
    amount_credit: float | None = None
    transaction_date: date_type | None = None
    notes: str | None = None
    related_transaction_id: int | None = None

# ==========================================
# Response Types
# ==========================================

class SecurityTransactionResponse(BaseModel):
    """Response containing a single security transaction"""
    success: bool
    data: SecurityTransaction | None = None
    error: str | None = None

class SecurityTransactionsResponse(BaseModel):
    """Response containing multiple security transactions"""
    success: bool
    data: list[SecurityTransaction] | None = None
    error: str | None = None