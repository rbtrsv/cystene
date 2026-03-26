"""
SyndicateTransaction Schemas

Pydantic schemas for the SyndicateTransaction model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

# ==========================================
# SyndicateTransaction Schema (Full Representation)
# ==========================================

class SyndicateTransaction(BaseModel):
    """SyndicateTransaction schema - full representation"""
    id: int
    syndicate_id: int = Field(description="Syndicate ID")
    transaction_type: str = Field(description="Transaction type (transfer, allocation_change)")
    seller_entity_id: int = Field(description="Seller entity ID")
    buyer_entity_id: int = Field(description="Buyer entity ID")
    ownership_percentage: float = Field(description="Ownership percentage being transferred")
    amount: float | None = Field(None, description="Transaction amount (price)")
    status: str = Field(description="Transaction status (pending_buyer, pending_manager, completed, rejected)")
    notes: str | None = Field(None, description="Transaction notes")
    requested_at: datetime
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class CreateSyndicateTransaction(BaseModel):
    """Schema for creating a new syndicate transaction"""
    syndicate_id: int = Field(description="Syndicate ID")
    transaction_type: str = Field(description="Transaction type (transfer, allocation_change)")
    seller_entity_id: int = Field(description="Seller entity ID")
    buyer_entity_id: int = Field(description="Buyer entity ID")
    ownership_percentage: float = Field(description="Ownership percentage being transferred")
    amount: float | None = Field(None, description="Transaction amount (price)")
    status: str = Field(default="pending_buyer", description="Transaction status")
    notes: str | None = Field(None, description="Transaction notes")

class UpdateSyndicateTransaction(BaseModel):
    """Schema for updating a syndicate transaction"""
    transaction_type: str | None = None
    seller_entity_id: int | None = None
    buyer_entity_id: int | None = None
    ownership_percentage: float | None = None
    amount: float | None = None
    status: str | None = None
    notes: str | None = None
    completed_at: datetime | None = None

# ==========================================
# Response Types
# ==========================================

class SyndicateTransactionResponse(BaseModel):
    """Response containing a single syndicate transaction"""
    success: bool
    data: SyndicateTransaction | None = None
    error: str | None = None

class SyndicateTransactionsResponse(BaseModel):
    """Response containing multiple syndicate transactions"""
    success: bool
    data: list[SyndicateTransaction] | None = None
    error: str | None = None
