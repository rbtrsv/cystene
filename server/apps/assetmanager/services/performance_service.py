"""
Performance Computation Service

Computes performance metrics ON THE FLY from raw data.
Three computations:
1. Entity/Fund Performance — from holding_cash_flows + fees + holdings
2. Holdings Performance — per-holding breakdown from holding_cash_flows + holdings
3. Stakeholder Returns — from security_transactions + holdings NAV

IRR calculated via Newton-Raphson method.

═══════════════════════════════════════════════════════════════════════════
DEBIT/CREDIT CONVENTION — ALL MODELS USE ENTITY PERSPECTIVE

  amount_debit  = money IN to entity  (entity receives)
  amount_credit = money OUT from entity (entity pays)

This applies to BOTH SecurityTransaction AND HoldingCashFlow.

IRR FORMULAS (perspective differs by audience):
  - Fund/Holding performance:  debit - credit  (entity's view: IN minus OUT)
  - Stakeholder returns:       credit - debit   (stakeholder's view: receives minus pays)
═══════════════════════════════════════════════════════════════════════════
"""

from datetime import date as date_type
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sql_func

from ..models.holding_models import Holding, HoldingCashFlow
from ..models.captable_models import Fee, SecurityTransaction
from ..models.entity_models import Entity, Stakeholder
from ..utils.filtering_utils import apply_soft_delete_filter


# ==========================================
# IRR Calculator (Newton-Raphson)
# ==========================================

def calculate_irr(
    cash_flows: list[dict],
    guess: float = 0.1,
    max_iterations: int = 100,
    tolerance: float = 1e-7,
) -> Optional[float]:
    """
    Calculate Internal Rate of Return using Newton-Raphson method.

    Args:
        cash_flows: List of dicts with 'date' (date) and 'amount' (float).
                    Negative = outflow (investment), Positive = inflow (return).
        guess: Initial IRR guess (default 10%)
        max_iterations: Max iterations before giving up
        tolerance: Convergence threshold

    Returns:
        IRR as decimal (e.g., 0.15 = 15%) or None if cannot converge
    """
    if not cash_flows or len(cash_flows) < 2:
        return None

    # Sort by date
    sorted_cfs = sorted(cash_flows, key=lambda x: x['date'])
    base_date = sorted_cfs[0]['date']

    # Convert dates to year fractions from first cash flow
    year_fracs = []
    for cf in sorted_cfs:
        days = (cf['date'] - base_date).days
        year_fracs.append(days / 365.25)

    amounts = [cf['amount'] for cf in sorted_cfs]

    rate = guess

    for _ in range(max_iterations):
        # NPV and its derivative
        npv = 0.0
        dnpv = 0.0

        for i, (amount, t) in enumerate(zip(amounts, year_fracs)):
            denominator = (1 + rate) ** t
            if denominator == 0:
                return None
            npv += amount / denominator
            if t != 0:
                dnpv -= t * amount / ((1 + rate) ** (t + 1))

        if abs(npv) < tolerance:
            return round(rate * 100, 2)  # Return as percentage

        if dnpv == 0:
            return None

        rate = rate - npv / dnpv

        # Guard against divergence
        if rate < -0.99 or rate > 100:
            return None

    return None  # Did not converge


# ==========================================
# 1. Entity/Fund Performance
# ==========================================

async def get_entity_performance(entity_id: int, session: AsyncSession) -> dict:
    """
    Compute entity-level performance metrics from raw data.

    Data sources:
    - holding_cash_flows: entity perspective (debit = money IN, credit = money OUT)
    - fees: treated as negative cash flows (costs)
    - holdings: current_fair_value for unrealized value

    Returns dict with:
        total_invested, total_returned, fair_value, total_fees,
        irr, tvpi, dpi, rvpi, fees_breakdown
    """
    # 1. Get all holding cash flows for this entity (exclude soft-deleted)
    cf_query = (
        select(HoldingCashFlow)
        .filter(HoldingCashFlow.entity_id == entity_id)
    )
    cf_query = apply_soft_delete_filter(cf_query, HoldingCashFlow)
    result = await session.execute(cf_query)
    cash_flows = result.scalars().all()

    # 2. Get all fees for this entity (exclude soft-deleted)
    fee_query = (
        select(Fee)
        .filter(Fee.entity_id == entity_id)
    )
    fee_query = apply_soft_delete_filter(fee_query, Fee)
    result = await session.execute(fee_query)
    fees = result.scalars().all()

    # 3. Get all active holdings for this entity (exclude soft-deleted)
    holding_query = (
        select(Holding)
        .filter(Holding.entity_id == entity_id)
    )
    holding_query = apply_soft_delete_filter(holding_query, Holding)
    result = await session.execute(holding_query)
    holdings = result.scalars().all()

    # Entity perspective: debit = money IN (received), credit = money OUT (paid)
    # total_invested = money entity sent OUT to holdings = amount_credit
    # total_returned = money entity received back from holdings = amount_debit
    total_invested = sum(float(cf.amount_credit or 0) for cf in cash_flows)
    total_returned = sum(float(cf.amount_debit or 0) for cf in cash_flows)

    # Current fair value from holdings
    fair_value = sum(float(h.current_fair_value or 0) for h in holdings)

    # Fees breakdown
    total_fees = sum(float(f.amount or 0) for f in fees)
    fees_breakdown = {}
    for f in fees:
        fee_type = f.fee_type or 'other'
        fees_breakdown[fee_type] = fees_breakdown.get(fee_type, 0) + float(f.amount or 0)

    # Build IRR cash flows list
    # Entity perspective IRR: debit - credit (IN minus OUT)
    # Investment (money OUT → credit) → negative amount for IRR
    # Distribution (money IN → debit) → positive amount for IRR
    irr_cash_flows = []

    for cf in cash_flows:
        amount = float(cf.amount_debit or 0) - float(cf.amount_credit or 0)
        irr_cash_flows.append({'date': cf.date, 'amount': amount})

    # Fees as negative cash flows
    for f in fees:
        if f.date and f.amount:
            irr_cash_flows.append({'date': f.date, 'amount': -float(f.amount)})

    # Add current fair value as terminal cash flow (today)
    if fair_value > 0:
        irr_cash_flows.append({'date': date_type.today(), 'amount': fair_value})

    # Calculate IRR
    irr = calculate_irr(irr_cash_flows) if irr_cash_flows else None

    # Calculate multiples (guard against division by zero)
    total_value = fair_value + total_returned
    tvpi = round(total_value / total_invested, 2) if total_invested > 0 else None
    dpi = round(total_returned / total_invested, 2) if total_invested > 0 else None
    rvpi = round(fair_value / total_invested, 2) if total_invested > 0 else None

    return {
        'entity_id': entity_id,
        'total_invested': round(total_invested, 2),
        'total_returned': round(total_returned, 2),
        'fair_value': round(fair_value, 2),
        'total_fees': round(total_fees, 2),
        'irr': irr,
        'tvpi': tvpi,
        'dpi': dpi,
        'rvpi': rvpi,
        'fees_breakdown': fees_breakdown,
    }


# ==========================================
# 2. Holdings Performance (per-holding breakdown)
# ==========================================

async def get_holdings_performance(entity_id: int, session: AsyncSession) -> list[dict]:
    """
    Compute per-holding performance metrics.

    Groups holding_cash_flows by holding_id, calculates metrics for each holding.

    Returns list of dicts with:
        holding_id, investment_name, total_invested, total_returned,
        fair_value, irr, tvpi, moic
    """
    # Get all holdings for this entity (exclude soft-deleted)
    holding_query = (
        select(Holding)
        .filter(Holding.entity_id == entity_id)
    )
    holding_query = apply_soft_delete_filter(holding_query, Holding)
    result = await session.execute(holding_query)
    holdings = result.scalars().all()

    if not holdings:
        return []

    holding_ids = [h.id for h in holdings]
    holdings_map = {h.id: h for h in holdings}

    # Get all cash flows for these holdings (exclude soft-deleted)
    cf_query = (
        select(HoldingCashFlow)
        .filter(HoldingCashFlow.holding_id.in_(holding_ids))
    )
    cf_query = apply_soft_delete_filter(cf_query, HoldingCashFlow)
    result = await session.execute(cf_query)
    all_cash_flows = result.scalars().all()

    # Group cash flows by holding_id
    cf_by_holding: dict[int, list] = {}
    for cf in all_cash_flows:
        cf_by_holding.setdefault(cf.holding_id, []).append(cf)

    # Calculate per-holding metrics
    results = []
    for holding in holdings:
        h_cash_flows = cf_by_holding.get(holding.id, [])

        # Entity perspective: credit = money OUT (invested), debit = money IN (returned)
        total_invested = sum(float(cf.amount_credit or 0) for cf in h_cash_flows)
        total_returned = sum(float(cf.amount_debit or 0) for cf in h_cash_flows)
        fair_value = float(holding.current_fair_value or 0)

        # Entity perspective IRR: debit - credit (IN minus OUT)
        irr_cfs = []
        for cf in h_cash_flows:
            amount = float(cf.amount_debit or 0) - float(cf.amount_credit or 0)
            irr_cfs.append({'date': cf.date, 'amount': amount})

        if fair_value > 0:
            irr_cfs.append({'date': date_type.today(), 'amount': fair_value})

        irr = calculate_irr(irr_cfs) if irr_cfs else None

        total_value = fair_value + total_returned
        tvpi = round(total_value / total_invested, 2) if total_invested > 0 else None
        moic = round(total_value / total_invested, 2) if total_invested > 0 else None

        results.append({
            'holding_id': holding.id,
            'investment_name': holding.investment_name,
            'company_name': holding.company_name,
            'sector': holding.sector,
            'investment_status': holding.investment_status,
            'total_invested': round(total_invested, 2),
            'total_returned': round(total_returned, 2),
            'fair_value': round(fair_value, 2),
            'irr': irr,
            'tvpi': tvpi,
            'moic': moic,
        })

    return results


# ==========================================
# 3. Stakeholder Returns
# ==========================================

async def get_stakeholder_returns(entity_id: int, session: AsyncSession) -> list[dict]:
    """
    Compute per-stakeholder performance metrics.

    Data sources:
    - security_transactions: stakeholder perspective (credit - debit, opposite of fund)
    - holdings: sum of current_fair_value = fund NAV
    - ownership% = stakeholder_units / total_units

    Returns list of dicts with:
        stakeholder_id, stakeholder_name, stakeholder_type,
        total_invested, total_returned, fair_value,
        ownership_percentage, irr, tvpi, dpi, rvpi
    """
    # Get all stakeholders for this entity with resolved name from source entity
    # JOIN Stakeholder → Entity (via source_entity_id) to get investor name
    stk_query = (
        select(Stakeholder, Entity.name.label("stakeholder_name"))
        .join(Entity, Stakeholder.source_entity_id == Entity.id)
        .filter(Stakeholder.entity_id == entity_id)
    )
    stk_query = apply_soft_delete_filter(stk_query, Stakeholder)
    result = await session.execute(stk_query)
    stk_rows = result.all()

    if not stk_rows:
        return []

    stakeholders = [row[0] for row in stk_rows]
    # Map stakeholder_id → resolved name from Entity
    stakeholder_names = {row[0].id: row.stakeholder_name for row in stk_rows}
    stakeholder_ids = [s.id for s in stakeholders]
    stakeholders_map = {s.id: s for s in stakeholders}

    # Get all security transactions for this entity (exclude soft-deleted)
    tx_query = (
        select(SecurityTransaction)
        .filter(
            SecurityTransaction.entity_id == entity_id,
            SecurityTransaction.stakeholder_id.in_(stakeholder_ids),
        )
    )
    tx_query = apply_soft_delete_filter(tx_query, SecurityTransaction)
    result = await session.execute(tx_query)
    all_txns = result.scalars().all()

    # Get fund NAV = sum of holdings current_fair_value
    holding_query = (
        select(Holding)
        .filter(Holding.entity_id == entity_id)
    )
    holding_query = apply_soft_delete_filter(holding_query, Holding)
    result = await session.execute(holding_query)
    holdings = result.scalars().all()
    fund_nav = sum(float(h.current_fair_value or 0) for h in holdings)

    # Group transactions by stakeholder
    txns_by_stakeholder: dict[int, list] = {}
    for tx in all_txns:
        txns_by_stakeholder.setdefault(tx.stakeholder_id, []).append(tx)

    # Calculate total units across all stakeholders (for ownership%)
    total_units_all = 0.0
    units_by_stakeholder: dict[int, float] = {}
    for s_id in stakeholder_ids:
        s_txns = txns_by_stakeholder.get(s_id, [])
        net_units = sum(float(tx.units_credit or 0) - float(tx.units_debit or 0) for tx in s_txns)
        units_by_stakeholder[s_id] = net_units
        total_units_all += net_units

    # Calculate per-stakeholder metrics
    results = []
    for stakeholder in stakeholders:
        s_txns = txns_by_stakeholder.get(stakeholder.id, [])
        net_units = units_by_stakeholder.get(stakeholder.id, 0)

        # Entity perspective (see support/to-do/3_captable_example.md):
        # amount_debit = money entity received = stakeholder invested
        # amount_credit = money entity paid out = stakeholder received back
        total_invested = sum(float(tx.amount_debit or 0) for tx in s_txns)
        total_returned = sum(float(tx.amount_credit or 0) for tx in s_txns)

        # Ownership percentage
        ownership_pct = round((net_units / total_units_all) * 100, 2) if total_units_all > 0 else 0

        # Stakeholder's share of fund NAV
        stakeholder_nav = round(fund_nav * (ownership_pct / 100), 2) if ownership_pct > 0 else 0

        # Build IRR cash flows (entity perspective → stakeholder view for IRR)
        # amount_debit = entity received = stakeholder outflow (negative)
        # amount_credit = entity paid = stakeholder inflow (positive)
        irr_cfs = []
        for tx in s_txns:
            amount = float(tx.amount_credit or 0) - float(tx.amount_debit or 0)
            irr_cfs.append({'date': tx.transaction_date, 'amount': amount})

        # Add stakeholder's NAV share as terminal value
        if stakeholder_nav > 0:
            irr_cfs.append({'date': date_type.today(), 'amount': stakeholder_nav})

        irr = calculate_irr(irr_cfs) if irr_cfs else None

        # Multiples
        total_value = stakeholder_nav + total_returned
        tvpi = round(total_value / total_invested, 2) if total_invested > 0 else None
        dpi = round(total_returned / total_invested, 2) if total_invested > 0 else None
        rvpi = round(stakeholder_nav / total_invested, 2) if total_invested > 0 else None

        results.append({
            'stakeholder_id': stakeholder.id,
            'stakeholder_name': stakeholder_names.get(stakeholder.id, 'Unknown'),
            'stakeholder_type': stakeholder.type,
            'total_invested': round(total_invested, 2),
            'total_returned': round(total_returned, 2),
            'fair_value': round(stakeholder_nav, 2),
            'ownership_percentage': ownership_pct,
            'irr': irr,
            'tvpi': tvpi,
            'dpi': dpi,
            'rvpi': rvpi,
        })

    return results
