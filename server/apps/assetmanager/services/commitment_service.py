"""
Commitment Service

Cross-model queries for commitment enrichment.
JOINs 5 tables (commitments, funding_rounds, securities, entities ×2, stakeholders)
to return CommitmentDetail with resolved names.

Pattern: same as performance_service.py — service handles data retrieval,
subrouter handles routing/auth/permissions.
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sql_func
from sqlalchemy.orm import aliased

from ..models.captable_models import Commitment, FundingRound, Security, SecurityTransaction
from ..models.entity_models import Entity, Stakeholder
from ..schemas.captable_schemas.commitment_schemas import (
    Commitment as CommitmentSchema,
    CommitmentDetail,
    CommitmentStatus,
)
from ..utils.filtering_utils import apply_soft_delete_filter


# ==========================================
# Pro-Rata Calculation
# ==========================================

async def calculate_pro_rata(
    session: AsyncSession,
    entity_id: int,
    stakeholder_id: int,
    raise_amount: float,
) -> tuple[float, float]:
    """
    Calculate pro-rata ownership percentage and amount for a stakeholder.

    Data source: SecurityTransactions for this entity.
    - Net units per stakeholder = sum(units_credit - units_debit)
    - ownership_pct = (this stakeholder's units / total_units) × 100
    - pro_rata_amount = ownership_pct / 100 × raise_amount

    When no transactions exist (first funding round, empty cap table):
    - Equal split among all stakeholders on the entity's cap table
    - ownership_pct = 100 / total_stakeholders

    Returns:
        (ownership_percentage, pro_rata_amount) — both rounded to 2 decimals
    """
    # Get all SecurityTransactions for this entity (not soft-deleted)
    txn_query = select(SecurityTransaction).filter(
        SecurityTransaction.entity_id == entity_id
    )
    txn_query = apply_soft_delete_filter(txn_query, SecurityTransaction)
    txn_result = await session.execute(txn_query)
    all_transactions = txn_result.scalars().all()

    # Calculate net units per stakeholder (units_credit - units_debit)
    stakeholder_units: dict[int, float] = {}
    for txn in all_transactions:
        net = float(txn.units_credit) - float(txn.units_debit)
        stakeholder_units[txn.stakeholder_id] = stakeholder_units.get(txn.stakeholder_id, 0) + net

    # Total fund units across all stakeholders
    total_fund_units = sum(stakeholder_units.values())

    if total_fund_units > 0:
        # Cap table has data — calculate from actual ownership
        stakeholder_net_units = stakeholder_units.get(stakeholder_id, 0)
        ownership_pct = (stakeholder_net_units / total_fund_units) * 100
    else:
        # No transactions yet (first round) — equal split among all entity stakeholders
        stk_count_query = select(sql_func.count(Stakeholder.id)).filter(
            Stakeholder.entity_id == entity_id
        )
        stk_count_query = apply_soft_delete_filter(stk_count_query, Stakeholder)
        stk_count_result = await session.execute(stk_count_query)
        total_stakeholders = stk_count_result.scalar() or 1
        ownership_pct = 100.0 / total_stakeholders

    pro_rata_amount = round(ownership_pct / 100 * raise_amount, 2)
    return round(ownership_pct, 2), pro_rata_amount


# ==========================================
# Commitment Detail Queries
# ==========================================

async def get_commitments_detail(
    session: AsyncSession,
    accessible_entity_ids: list[int],
    *,
    entity_id: Optional[int] = None,
    funding_round_id: Optional[int] = None,
    stakeholder_id: Optional[int] = None,
    source_entity_id: Optional[int] = None,
    status: Optional[CommitmentStatus] = None,
    limit: int = 100,
    offset: int = 0,
) -> list[CommitmentDetail]:
    """
    List commitments with resolved names from JOINed tables.

    JOIN chain:
    - Commitment → FundingRound (funding_round_id → name)
    - Commitment → Security (security_id → security_name)
    - Commitment → Entity as CapTableEntity (entity_id → name)
    - Commitment → Stakeholder (stakeholder_id → source_entity_id) → Entity as SourceEntity (→ name)
    """
    # Alias Entity twice: once for cap table owner, once for investor (via stakeholder)
    CapTableEntity = aliased(Entity, name="cap_table_entity")
    SourceEntity = aliased(Entity, name="source_entity")

    query = (
        select(
            Commitment,
            FundingRound.name.label("funding_round_name"),
            Security.security_name.label("security_name"),
            CapTableEntity.name.label("entity_name"),
            SourceEntity.name.label("stakeholder_name"),
        )
        .join(FundingRound, Commitment.funding_round_id == FundingRound.id)
        .join(Security, Commitment.security_id == Security.id)
        .join(CapTableEntity, Commitment.entity_id == CapTableEntity.id)
        .join(Stakeholder, Commitment.stakeholder_id == Stakeholder.id)
        .join(SourceEntity, Stakeholder.source_entity_id == SourceEntity.id)
    )

    # Access control: either admin view (entity_id in accessible) or stakeholder view (source_entity_id filter)
    if source_entity_id:
        query = query.filter(Stakeholder.source_entity_id == source_entity_id)
    else:
        query = query.filter(Commitment.entity_id.in_(accessible_entity_ids))

    # Soft delete filter on commitments
    query = apply_soft_delete_filter(query, Commitment)

    # Optional filters
    if entity_id:
        query = query.filter(Commitment.entity_id == entity_id)

    if funding_round_id:
        query = query.filter(Commitment.funding_round_id == funding_round_id)

    if stakeholder_id:
        query = query.filter(Commitment.stakeholder_id == stakeholder_id)

    if status:
        query = query.filter(Commitment.status == status.value)

    # Ordering and pagination
    query = query.order_by(Commitment.invited_at.desc()).offset(offset).limit(limit)

    result = await session.execute(query)
    rows = result.all()

    # Build CommitmentDetail from each row (ORM model + scalar columns)
    # Validate ORM → base Commitment dict, then spread + extra fields → CommitmentDetail
    details = []
    for row in rows:
        commitment_obj = row[0]
        base = CommitmentSchema.model_validate(commitment_obj)
        detail = CommitmentDetail(
            **base.model_dump(),
            funding_round_name=row.funding_round_name,
            security_name=row.security_name,
            entity_name=row.entity_name,
            stakeholder_name=row.stakeholder_name,
        )
        details.append(detail)

    return details


async def get_commitment_detail(
    session: AsyncSession,
    commitment_id: int,
) -> Optional[CommitmentDetail]:
    """
    Get a single commitment with resolved names from JOINed tables.
    Returns None if not found or soft-deleted.
    """
    CapTableEntity = aliased(Entity, name="cap_table_entity")
    SourceEntity = aliased(Entity, name="source_entity")

    query = (
        select(
            Commitment,
            FundingRound.name.label("funding_round_name"),
            Security.security_name.label("security_name"),
            CapTableEntity.name.label("entity_name"),
            SourceEntity.name.label("stakeholder_name"),
        )
        .join(FundingRound, Commitment.funding_round_id == FundingRound.id)
        .join(Security, Commitment.security_id == Security.id)
        .join(CapTableEntity, Commitment.entity_id == CapTableEntity.id)
        .join(Stakeholder, Commitment.stakeholder_id == Stakeholder.id)
        .join(SourceEntity, Stakeholder.source_entity_id == SourceEntity.id)
        .filter(Commitment.id == commitment_id)
    )

    query = apply_soft_delete_filter(query, Commitment)

    result = await session.execute(query)
    row = result.first()

    if not row:
        return None

    commitment_obj = row[0]
    base = CommitmentSchema.model_validate(commitment_obj)
    return CommitmentDetail(
        **base.model_dump(),
        funding_round_name=row.funding_round_name,
        security_name=row.security_name,
        entity_name=row.entity_name,
        stakeholder_name=row.stakeholder_name,
    )
