"""
Holding Link Service

Creates Holding + HoldingCashFlow records from Stakeholder Position data.
Manual "Track as Holding" — investor decides when to mirror cap table data
into their own portfolio tracking.

Data sources:
- Stakeholder (source_entity_id = investor, entity_id = cap table)
- SecurityTransaction (units_credit/debit, amount_credit/debit — via stakeholder_id)
- Entity (name, entity_type — for Holding display fields)
- Holding (entity_id + target_entity_id + funding_round_id — unique constraint match)
- HoldingCashFlow (cash_transaction_id — idempotency link to SecurityTransaction.id)

═══════════════════════════════════════════════════════════════════════════
DEBIT/CREDIT INVERSION — PERSPECTIVE SWITCH

SecurityTransaction (cap table entity perspective — e.g. Company A):
  amount_debit = money Company A received = investor paid
  amount_credit = money Company A gave back = investor received

HoldingCashFlow (investor entity perspective — e.g. Fund B):
  amount_debit = money Fund B received = distributions
  amount_credit = money Fund B gave = investments

Mapping: SecurityTransaction.amount_debit → HoldingCashFlow.amount_credit
         SecurityTransaction.amount_credit → HoldingCashFlow.amount_debit
═══════════════════════════════════════════════════════════════════════════

Idempotency: HoldingCashFlow.cash_transaction_id links back to SecurityTransaction.id.
If a CashFlow with that cash_transaction_id already exists, skip it.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models.entity_models import Entity, Stakeholder
from ..models.captable_models import SecurityTransaction
from ..models.holding_models import Holding, HoldingCashFlow
from ..utils.filtering_utils import apply_soft_delete_filter
from ..utils.crud_utils import create_with_audit


# ==========================================
# Track Position as Holding
# ==========================================

async def track_position_as_holding(
    source_entity_id: int,
    entity_id: int,
    user_id: int,
    organization_id: int | None,
    session: AsyncSession,
) -> tuple[int, int]:
    """
    Create or update Holding + HoldingCashFlows from cap table position data.

    One Holding per position (funding_round_id=None).
    CashFlows mirror SecurityTransactions with inverted debit/credit.

    Steps:
    1. Find Stakeholder (source_entity_id on target cap table)
    2. Read SecurityTransactions for this stakeholder (sorted by date)
    3. Compute position metrics (net_units, total_invested, ownership %)
    4. Find or create Holding (match on entity_id + target_entity_id + funding_round_id=NULL)
    5. Create HoldingCashFlows for each new transaction (skip existing via cash_transaction_id)

    Args:
        source_entity_id: Investor entity ID (Fund B — where the Holding lives)
        entity_id: Cap table entity ID (Company A — where the position sits)
        user_id: Current user ID (for audit)
        organization_id: Current org ID (for audit)
        session: Database session

    Returns:
        Tuple of (holdings_created, cash_flows_created)

    Raises:
        ValueError: If no stakeholder found or target entity not found
    """
    # 1. Find the stakeholder record (investor's position on target cap table)
    stk_query = (
        select(Stakeholder)
        .filter(
            Stakeholder.source_entity_id == source_entity_id,
            Stakeholder.entity_id == entity_id,
        )
    )
    stk_query = apply_soft_delete_filter(stk_query, Stakeholder)
    result = await session.execute(stk_query)
    stakeholder = result.scalar_one_or_none()

    if not stakeholder:
        raise ValueError(f"No stakeholder found for source_entity_id={source_entity_id} on entity_id={entity_id}")

    # 2. Get target entity for display info (name, entity_type)
    entity_query = select(Entity).filter(Entity.id == entity_id)
    entity_query = apply_soft_delete_filter(entity_query, Entity)
    result = await session.execute(entity_query)
    target_entity = result.scalar_one_or_none()

    if not target_entity:
        raise ValueError(f"Target entity {entity_id} not found")

    # 3. Get all SecurityTransactions for this stakeholder (sorted by date)
    tx_query = (
        select(SecurityTransaction)
        .filter(SecurityTransaction.stakeholder_id == stakeholder.id)
        .order_by(SecurityTransaction.transaction_date)
    )
    tx_query = apply_soft_delete_filter(tx_query, SecurityTransaction)
    result = await session.execute(tx_query)
    transactions = result.scalars().all()

    # 4. Compute position metrics from transactions (entity perspective)
    # net_units = sum(units_credit) - sum(units_debit)
    # total_invested = sum(amount_debit) — money entity received = investor paid
    net_units = sum(float(tx.units_credit or 0) - float(tx.units_debit or 0) for tx in transactions)
    total_invested = sum(float(tx.amount_debit or 0) for tx in transactions)

    # 5. Compute ownership percentage (same logic as stakeholder_position_service.py)
    # Get ALL stakeholders on this cap table for denominator
    all_stk_query = (
        select(Stakeholder)
        .filter(Stakeholder.entity_id == entity_id)
    )
    all_stk_query = apply_soft_delete_filter(all_stk_query, Stakeholder)
    result = await session.execute(all_stk_query)
    all_stakeholders = result.scalars().all()
    all_stk_ids = [s.id for s in all_stakeholders]

    # Get ALL transactions for ownership % denominator
    all_tx_query = (
        select(SecurityTransaction)
        .filter(SecurityTransaction.stakeholder_id.in_(all_stk_ids))
    )
    all_tx_query = apply_soft_delete_filter(all_tx_query, SecurityTransaction)
    result = await session.execute(all_tx_query)
    all_txns = result.scalars().all()

    total_units_all = 0.0
    txns_by_stakeholder: dict[int, list] = {}
    for tx in all_txns:
        txns_by_stakeholder.setdefault(tx.stakeholder_id, []).append(tx)
    for s in all_stakeholders:
        s_txns = txns_by_stakeholder.get(s.id, [])
        net = sum(float(tx.units_credit or 0) - float(tx.units_debit or 0) for tx in s_txns)
        total_units_all += net

    ownership_pct = round((net_units / total_units_all) * 100, 2) if total_units_all > 0 else 0.0

    # Earliest transaction date for original_investment_date
    earliest_date = min((tx.transaction_date for tx in transactions), default=None) if transactions else None

    # 6. Find or create Holding (match on entity_id + target_entity_id + funding_round_id=NULL)
    holding_query = (
        select(Holding)
        .filter(
            Holding.entity_id == source_entity_id,
            Holding.target_entity_id == entity_id,
            Holding.funding_round_id.is_(None),
        )
    )
    holding_query = apply_soft_delete_filter(holding_query, Holding)
    result = await session.execute(holding_query)
    holding = result.scalar_one_or_none()

    holdings_created = 0

    if not holding:
        # Create new Holding
        holding_payload = {
            "entity_id": source_entity_id,
            "target_entity_id": entity_id,
            "funding_round_id": None,
            "investment_name": target_entity.name,
            "entity_type": target_entity.entity_type,
            "investment_type": "equity",
            "sector": None,  # Nullable — user fills in manually if desired
            "investment_status": "active",
            "listing_status": "private",
            "total_investment_amount": round(total_invested, 2),
            "number_of_shares": round(net_units, 2),
            "ownership_percentage": ownership_pct,
            "original_investment_date": earliest_date,
            "export_functionality": False,
        }
        holding = await create_with_audit(
            db=session,
            model=Holding,
            table_name="holdings",
            payload=holding_payload,
            user_id=user_id,
            organization_id=organization_id,
        )
        holdings_created = 1
    else:
        # Update existing Holding with fresh data from cap table
        holding.total_investment_amount = round(total_invested, 2)
        holding.number_of_shares = round(net_units, 2)
        holding.ownership_percentage = ownership_pct
        if earliest_date:
            holding.original_investment_date = earliest_date
        holding.updated_by = user_id

    # 7. Create HoldingCashFlows for each SecurityTransaction (idempotent)
    # Get existing cash_transaction_ids to skip duplicates
    existing_cf_query = (
        select(HoldingCashFlow.cash_transaction_id)
        .filter(
            HoldingCashFlow.holding_id == holding.id,
            HoldingCashFlow.cash_transaction_id.isnot(None),
        )
    )
    existing_cf_query = apply_soft_delete_filter(existing_cf_query, HoldingCashFlow)
    result = await session.execute(existing_cf_query)
    existing_tx_ids = set(result.scalars().all())

    cash_flows_created = 0

    for tx in transactions:
        # Skip if already linked (idempotent)
        if tx.id in existing_tx_ids:
            continue

        # Invert debit/credit — perspective switch from entity to investor
        # SecurityTransaction.amount_debit (entity received) → HoldingCashFlow.amount_credit (investor gave)
        # SecurityTransaction.amount_credit (entity gave) → HoldingCashFlow.amount_debit (investor received)
        cf_amount_debit = float(tx.amount_credit or 0)
        cf_amount_credit = float(tx.amount_debit or 0)

        # Derive cash_flow_type from investor perspective
        # amount_credit > 0 → investor gave money → 'investment'
        # amount_debit > 0 → investor received money → 'distribution'
        if cf_amount_credit > 0:
            cash_flow_type = "investment"
        elif cf_amount_debit > 0:
            cash_flow_type = "distribution"
        else:
            cash_flow_type = "other"

        cf_payload = {
            "holding_id": holding.id,
            "entity_id": source_entity_id,
            "target_entity_id": entity_id,
            "funding_round_id": tx.funding_round_id,  # Each cash flow keeps the round from the transaction
            "date": tx.transaction_date,
            "amount_debit": cf_amount_debit,
            "amount_credit": cf_amount_credit,
            "currency": "USD",
            "cash_flow_type": cash_flow_type,
            "category": "actual",
            "scenario": "actual",
            "cash_transaction_id": tx.id,  # Link for idempotency
            "transaction_reference": tx.transaction_reference,
            "include_in_irr": True,
        }
        await create_with_audit(
            db=session,
            model=HoldingCashFlow,
            table_name="holding_cash_flows",
            payload=cf_payload,
            user_id=user_id,
            organization_id=organization_id,
        )
        cash_flows_created += 1

    await session.commit()

    return (holdings_created, cash_flows_created)
