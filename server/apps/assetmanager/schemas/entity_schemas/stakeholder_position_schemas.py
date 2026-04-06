"""
Stakeholder Position Schemas

Read-only Pydantic schemas for Stakeholder Position View (investor side).
Positions are computed on the fly from Stakeholder + SecurityTransaction.
No CRUD — this is a computed read model, same pattern as performance_service.py.

Why: investitorul trebuie să-și vadă propria poziție pe cap table-urile altora,
fără acces la datele celorlalți stakeholders.

Data sources:
- Stakeholder (entity_id = cap table, source_entity_id = investing entity)
- SecurityTransaction (units_credit/debit, amount_credit/debit)
- Entity (name, entity_type — for display)

═══════════════════════════════════════════════════════════════════════════
DEBIT/CREDIT CONVENTION — ENTITY PERSPECTIVE (same as performance_service.py)

  units:  net_units = sum(units_credit) - sum(units_debit)
  amount: total_invested = sum(amount_debit) — money entity received = investor paid

  Confirmed from performance_service.py:362 and commitment_service.py:63.
═══════════════════════════════════════════════════════════════════════════
"""

from pydantic import BaseModel, Field
from ..captable_schemas.security_transaction_schemas import SecurityTransaction


# ==========================================
# Stakeholder Position Summary
# ==========================================

class StakeholderPositionSummary(BaseModel):
    """
    Summary of a single position (one stakeholder record on one cap table).
    Returned by both list and detail endpoints.

    Same logic as cap-table page but from the investor's perspective:
    - cap-table page: issuer sees ALL stakeholders on their cap table
    - position view: investor sees ONLY their own position on other cap tables

    List endpoint: transactions is None (not included).
    Detail endpoint: transactions is populated with SecurityTransaction objects.
    """
    # Stakeholder identity
    stakeholder_id: int = Field(description="Stakeholder record ID on the target cap table")
    stakeholder_type: str = Field(description="GP/LP/employee/advisor/board_member/investor")
    # Cap table entity (where the position sits)
    entity_id: int = Field(description="Entity ID of the cap table this position sits on")
    entity_name: str = Field(description="Name of the cap table entity (e.g. Company A)")
    entity_type: str = Field(description="Type of the cap table entity (fund/company/spv/etc.)")
    # Computed position metrics — same calculation as cap-table page
    total_units: float = Field(description="Net units = sum(units_credit) - sum(units_debit)")
    total_invested: float = Field(description="Total cash invested = sum(amount_debit) — entity perspective")
    ownership_percentage: float = Field(description="Stakeholder net units / total net units across ALL stakeholders × 100")
    # Detail view only — reuses existing SecurityTransaction schema directly
    transactions: list[SecurityTransaction] | None = Field(
        None,
        description="SecurityTransactions for this stakeholder only. None in list view, populated in detail view."
    )


# ==========================================
# Response Types
# ==========================================

class StakeholderPositionResponse(BaseModel):
    """Response containing a single stakeholder position detail"""
    success: bool
    data: StakeholderPositionSummary | None = None
    error: str | None = None


class StakeholderPositionsResponse(BaseModel):
    """Response containing multiple stakeholder position summaries (list endpoint)"""
    success: bool
    data: list[StakeholderPositionSummary] | None = None
    error: str | None = None


# ==========================================
# Track as Holding Response
# ==========================================

class TrackAsHoldingResponse(BaseModel):
    """Response for track-as-holding action (Feature 3)"""
    success: bool
    holdings_created: int = 0
    cash_flows_created: int = 0
    message: str | None = None
    error: str | None = None
