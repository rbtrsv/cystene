"""
Stakeholder Position Service

Computes stakeholder positions ON THE FLY from raw data.
Two computations:
1. List — all positions for a source entity across all cap tables
2. Detail — single position with full transaction history

Same pattern as performance_service.py — cross-model queries, compute on the fly.

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

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models.entity_models import Entity, Stakeholder
from ..models.captable_models import SecurityTransaction
from ..schemas.entity_schemas.stakeholder_position_schemas import StakeholderPositionSummary
from ..schemas.captable_schemas.security_transaction_schemas import (
    SecurityTransaction as SecurityTransactionSchema,
)
from ..utils.filtering_utils import apply_soft_delete_filter


# ==========================================
# 1. List Positions (all cap tables for one investor)
# ==========================================

async def get_my_positions(
    source_entity_id: int,
    session: AsyncSession,
) -> list[StakeholderPositionSummary]:
    """
    Compute all positions for a source entity (investor view).

    Inverse of cap-table page:
    - cap-table page: issuer sees ALL stakeholders on their cap table
    - this: investor sees ONLY their own position on other cap tables

    Data sources:
    - Stakeholder WHERE source_entity_id = X → cap tables the investor sits on
    - Entity (via stakeholder.entity_id) → cap table name/type for display
    - SecurityTransaction (via stakeholder_id) → units + amounts for position metrics

    Returns list of StakeholderPositionSummary WITHOUT transactions (list view).
    """
    # 1. Get all stakeholder records for this source entity (exclude soft-deleted)
    stk_query = (
        select(Stakeholder)
        .filter(Stakeholder.source_entity_id == source_entity_id)
    )
    stk_query = apply_soft_delete_filter(stk_query, Stakeholder)
    result = await session.execute(stk_query)
    stakeholders = result.scalars().all()

    if not stakeholders:
        return []

    # 2. Get cap table entities for display (name, entity_type)
    entity_ids = list({s.entity_id for s in stakeholders})
    entity_query = select(Entity).filter(Entity.id.in_(entity_ids))
    entity_query = apply_soft_delete_filter(entity_query, Entity)
    result = await session.execute(entity_query)
    entities = result.scalars().all()
    entities_map = {e.id: e for e in entities}

    # 3. Get ALL stakeholders on those cap tables (for ownership % denominator)
    all_stk_query = (
        select(Stakeholder)
        .filter(Stakeholder.entity_id.in_(entity_ids))
    )
    all_stk_query = apply_soft_delete_filter(all_stk_query, Stakeholder)
    result = await session.execute(all_stk_query)
    all_stakeholders = result.scalars().all()
    all_stk_ids = [s.id for s in all_stakeholders]

    # 4. Get ALL security transactions for those stakeholders (for units calculation)
    tx_query = (
        select(SecurityTransaction)
        .filter(SecurityTransaction.stakeholder_id.in_(all_stk_ids))
    )
    tx_query = apply_soft_delete_filter(tx_query, SecurityTransaction)
    result = await session.execute(tx_query)
    all_txns = result.scalars().all()

    # Group transactions by stakeholder_id
    txns_by_stakeholder: dict[int, list] = {}
    for tx in all_txns:
        txns_by_stakeholder.setdefault(tx.stakeholder_id, []).append(tx)

    # 5. Calculate total net units per cap table (for ownership %)
    # Group all stakeholders by entity_id (cap table)
    stk_by_entity: dict[int, list] = {}
    for s in all_stakeholders:
        stk_by_entity.setdefault(s.entity_id, []).append(s)

    total_units_by_entity: dict[int, float] = {}
    for eid, stks in stk_by_entity.items():
        total = 0.0
        for s in stks:
            s_txns = txns_by_stakeholder.get(s.id, [])
            net = sum(float(tx.units_credit or 0) - float(tx.units_debit or 0) for tx in s_txns)
            total += net
        total_units_by_entity[eid] = total

    # 6. Build position summaries for the investor's own stakeholder records
    positions = []
    for stakeholder in stakeholders:
        entity = entities_map.get(stakeholder.entity_id)
        if not entity:
            continue

        # Investor's transactions on this cap table
        s_txns = txns_by_stakeholder.get(stakeholder.id, [])

        # Entity perspective (see support/to-do/3_captable_example.md):
        # net_units = sum(units_credit) - sum(units_debit)
        # total_invested = sum(amount_debit) — money entity received = investor paid
        net_units = sum(float(tx.units_credit or 0) - float(tx.units_debit or 0) for tx in s_txns)
        total_invested = sum(float(tx.amount_debit or 0) for tx in s_txns)

        # Ownership percentage
        total_units = total_units_by_entity.get(stakeholder.entity_id, 0)
        ownership_pct = round((net_units / total_units) * 100, 2) if total_units > 0 else 0.0

        positions.append(StakeholderPositionSummary(
            stakeholder_id=stakeholder.id,
            stakeholder_type=stakeholder.type,
            entity_id=entity.id,
            entity_name=entity.name,
            entity_type=entity.entity_type,
            total_units=round(net_units, 2),
            total_invested=round(total_invested, 2),
            ownership_percentage=ownership_pct,
            transactions=None,  # List view — no transactions
        ))

    return positions


# ==========================================
# 2. Position Detail (single cap table with transactions)
# ==========================================

async def get_my_position(
    source_entity_id: int,
    entity_id: int,
    session: AsyncSession,
) -> StakeholderPositionSummary | None:
    """
    Compute a single position for a source entity on a specific cap table.
    Same metrics as list view + full SecurityTransaction list.

    Data sources:
    - Stakeholder WHERE source_entity_id = X AND entity_id = Y → single position
    - Entity (via entity_id) → cap table name/type for display
    - SecurityTransaction (via stakeholder_id) → units + amounts + full transaction list
    - ALL Stakeholders on entity_id → for ownership % denominator

    Returns StakeholderPositionSummary WITH transactions (detail view).
    Returns None if no position found.
    """
    # 1. Get the stakeholder record for this source entity on this cap table
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
        return None

    # 2. Get cap table entity for display
    entity_query = select(Entity).filter(Entity.id == entity_id)
    entity_query = apply_soft_delete_filter(entity_query, Entity)
    result = await session.execute(entity_query)
    entity = result.scalar_one_or_none()

    if not entity:
        return None

    # 3. Get ALL stakeholders on this cap table (for ownership % denominator)
    all_stk_query = (
        select(Stakeholder)
        .filter(Stakeholder.entity_id == entity_id)
    )
    all_stk_query = apply_soft_delete_filter(all_stk_query, Stakeholder)
    result = await session.execute(all_stk_query)
    all_stakeholders = result.scalars().all()
    all_stk_ids = [s.id for s in all_stakeholders]

    # 4. Get ALL security transactions for those stakeholders (for total units)
    all_tx_query = (
        select(SecurityTransaction)
        .filter(SecurityTransaction.stakeholder_id.in_(all_stk_ids))
    )
    all_tx_query = apply_soft_delete_filter(all_tx_query, SecurityTransaction)
    result = await session.execute(all_tx_query)
    all_txns = result.scalars().all()

    # Group by stakeholder_id
    txns_by_stakeholder: dict[int, list] = {}
    for tx in all_txns:
        txns_by_stakeholder.setdefault(tx.stakeholder_id, []).append(tx)

    # 5. Calculate total net units across ALL stakeholders on this cap table
    total_units_all = 0.0
    for s in all_stakeholders:
        s_txns = txns_by_stakeholder.get(s.id, [])
        net = sum(float(tx.units_credit or 0) - float(tx.units_debit or 0) for tx in s_txns)
        total_units_all += net

    # 6. Investor's own transactions and metrics
    investor_txns = txns_by_stakeholder.get(stakeholder.id, [])

    # Entity perspective:
    # net_units = sum(units_credit) - sum(units_debit)
    # total_invested = sum(amount_debit) — money entity received = investor paid
    net_units = sum(float(tx.units_credit or 0) - float(tx.units_debit or 0) for tx in investor_txns)
    total_invested = sum(float(tx.amount_debit or 0) for tx in investor_txns)

    # Ownership percentage
    ownership_pct = round((net_units / total_units_all) * 100, 2) if total_units_all > 0 else 0.0

    # 7. Serialize transactions using existing SecurityTransaction schema
    transactions = [
        SecurityTransactionSchema.model_validate(tx)
        for tx in sorted(investor_txns, key=lambda t: t.transaction_date)
    ]

    return StakeholderPositionSummary(
        stakeholder_id=stakeholder.id,
        stakeholder_type=stakeholder.type,
        entity_id=entity.id,
        entity_name=entity.name,
        entity_type=entity.entity_type,
        total_units=round(net_units, 2),
        total_invested=round(total_invested, 2),
        ownership_percentage=ownership_pct,
        transactions=transactions,  # Detail view — include transactions
    )
