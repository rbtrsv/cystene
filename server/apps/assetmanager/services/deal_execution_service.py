"""
Deal Execution Service

Bridges the Deal system to the Cap Table system.
When a fundraising deal is executed, this service creates:
FundingRound + Security + Stakeholders (find-or-create) + SecurityTransactions (ISSUANCE).

Pattern: same as holding_generation_service.py — service handles business logic,
subrouter handles routing/auth/permissions.

Data sources: Deal, DealCommitment, Entity, Stakeholder, FundingRound, Security, SecurityTransaction.

Debit/credit convention (entity perspective — see support/to-do/3_captable_example.md):
- ISSUANCE: amount_debit = cash received by entity, units_credit = units issued to stakeholder
- Same as commitment_subrouter.py:generate_transaction (lines 499-515)
"""

import math
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models.deal_models import Deal, DealCommitment
from ..models.captable_models import FundingRound, Security, SecurityTransaction
from ..models.entity_models import Stakeholder
from ..utils.filtering_utils import apply_soft_delete_filter
from ..utils.crud_utils import create_with_audit, update_with_audit


# ==========================================
# Deal Execution
# ==========================================

async def execute_deal(
    deal_id: int,
    round_type: str,
    security_name: str,
    security_code: str,
    security_type: str,
    stakeholder_type: str,
    user_id: int,
    organization_id: int | None,
    session: AsyncSession,
) -> dict:
    """
    Execute a fundraising deal — create cap table impact from deal data.

    Steps:
    1. Load Deal + validate status and deal_type
    2. Load all firm DealCommitments (soft-delete aware)
    3. Validate: at least 1 firm commitment, target_amount > 0, share_price > 0
    4. Create FundingRound from Deal terms
    5. Create Security
    6. For each firm DealCommitment:
       a. Find or create Stakeholder
       b. Generate transaction_reference (DEAL-{deal_id}-{commitment.id})
       c. Create SecurityTransaction (ISSUANCE)
       d. Link DealCommitment.transaction_id
    7. Link Deal.funding_round_id
    8. Update Deal.status = "executed"

    Returns:
        Dict with execution summary (funding_round_id, security_id, counts, total_amount)

    Raises:
        ValueError: On validation failures (wrong status, missing data, no commitments)
    """
    # --- 1. Load Deal ---
    deal_query = select(Deal).filter(Deal.id == deal_id)
    deal_query = apply_soft_delete_filter(deal_query, Deal)
    result = await session.execute(deal_query)
    deal = result.scalar_one_or_none()

    if not deal:
        raise ValueError(f"Deal {deal_id} not found")

    # Idempotency: once executed, no re-execution
    if deal.status == "executed":
        raise ValueError("Deal has already been executed")

    # Only active or closed deals can be executed
    if deal.status not in ("active", "closed"):
        raise ValueError(f"Cannot execute deal with status '{deal.status}'. Must be 'active' or 'closed'.")

    # Only fundraising deals are supported
    if deal.deal_type != "fundraising":
        raise ValueError(f"Cannot execute deal_type '{deal.deal_type}'. Only 'fundraising' is supported.")

    # --- Validate required financial fields ---
    if not deal.target_amount or float(deal.target_amount) <= 0:
        raise ValueError("Deal.target_amount must exist and be > 0 (FundingRound.target_amount is NOT NULL)")

    if not deal.share_price or float(deal.share_price) <= 0:
        raise ValueError("Deal.share_price must exist and be > 0 (needed for units_credit calculation)")

    share_price = float(deal.share_price)

    # --- 2. Load firm DealCommitments ---
    commitments_query = (
        select(DealCommitment)
        .filter(
            DealCommitment.deal_id == deal_id,
            DealCommitment.commitment_type == "firm",
        )
    )
    commitments_query = apply_soft_delete_filter(commitments_query, DealCommitment)
    result = await session.execute(commitments_query)
    firm_commitments = result.scalars().all()

    # --- 3. Validate at least 1 firm commitment ---
    if not firm_commitments:
        raise ValueError("No firm commitments found for this deal. Cannot execute without firm commitments.")

    # --- 4. Create FundingRound ---
    raised_amount = sum(float(c.amount) for c in firm_commitments)

    funding_round_payload = {
        "entity_id": deal.entity_id,
        "name": deal.name,
        "round_type": round_type,
        "date": deal.expected_close_date or datetime.now(timezone.utc).date(),
        "target_amount": float(deal.target_amount),
        "raised_amount": raised_amount,
        "pre_money_valuation": float(deal.pre_money_valuation) if deal.pre_money_valuation else None,
        "post_money_valuation": float(deal.post_money_valuation) if deal.post_money_valuation else None,
    }

    funding_round = await create_with_audit(
        db=session,
        model=FundingRound,
        table_name="funding_rounds",
        payload=funding_round_payload,
        user_id=user_id,
        organization_id=organization_id,
    )

    # --- 5. Create Security ---
    security_payload = {
        "funding_round_id": funding_round.id,
        "security_name": security_name,
        "code": security_code,
        "security_type": security_type,
        "issue_price": share_price,
        "currency": "USD",
    }

    security = await create_with_audit(
        db=session,
        model=Security,
        table_name="securities",
        payload=security_payload,
        user_id=user_id,
        organization_id=organization_id,
    )

    # --- 6. Process each firm DealCommitment ---
    stakeholders_created = 0
    transactions_created = 0

    for commitment in firm_commitments:
        # --- 6a. Find or create Stakeholder ---
        # Match key: (entity_id=Deal.entity_id, source_entity_id=DealCommitment.entity_id)
        stk_query = (
            select(Stakeholder)
            .filter(
                Stakeholder.entity_id == deal.entity_id,
                Stakeholder.source_entity_id == commitment.entity_id,
            )
        )
        stk_query = apply_soft_delete_filter(stk_query, Stakeholder)
        result = await session.execute(stk_query)
        stakeholder = result.scalar_one_or_none()

        if not stakeholder:
            # Create new stakeholder
            stk_payload = {
                "entity_id": deal.entity_id,              # Cap table this stakeholder sits on
                "source_entity_id": commitment.entity_id,  # The investing entity
                "type": stakeholder_type,
            }
            stakeholder = await create_with_audit(
                db=session,
                model=Stakeholder,
                table_name="stakeholders",
                payload=stk_payload,
                user_id=user_id,
                organization_id=organization_id,
            )
            stakeholders_created += 1

        # --- 6b. Generate transaction_reference ---
        txn_ref = f"DEAL-{deal_id}-{commitment.id}"

        # Defensive uniqueness check (commitment.id is PK global, but defensive)
        existing_ref_query = select(SecurityTransaction.id).filter(
            SecurityTransaction.transaction_reference == txn_ref
        )
        result = await session.execute(existing_ref_query)
        if result.scalar():
            raise ValueError(f"Transaction reference '{txn_ref}' already exists — deal may have been partially executed")

        # --- 6c. Create SecurityTransaction (ISSUANCE) ---
        # Entity perspective (see support/to-do/3_captable_example.md):
        # - amount_debit = money received by entity (cash IN)
        # - units_credit = units issued to stakeholder
        units_credit = math.floor(float(commitment.amount) / share_price)

        txn_payload = {
            "entity_id": deal.entity_id,
            "stakeholder_id": stakeholder.id,
            "funding_round_id": funding_round.id,
            "security_id": security.id,
            "transaction_reference": txn_ref,
            "transaction_type": "issuance",
            "units_debit": 0,
            "units_credit": units_credit,
            "amount_debit": float(commitment.amount),
            "amount_credit": 0,
            "transaction_date": datetime.now(timezone.utc).date(),
        }

        transaction = await create_with_audit(
            db=session,
            model=SecurityTransaction,
            table_name="security_transactions",
            payload=txn_payload,
            user_id=user_id,
            organization_id=organization_id,
        )
        transactions_created += 1

        # --- 6d. Link DealCommitment.transaction_id ---
        await update_with_audit(
            db=session,
            item=commitment,
            table_name="deal_commitments",
            payload={"transaction_id": transaction.id},
            user_id=user_id,
            organization_id=organization_id,
        )

    # --- 7. Link Deal.funding_round_id ---
    # --- 8. Update Deal.status = "executed" ---
    await update_with_audit(
        db=session,
        item=deal,
        table_name="deals",
        payload={
            "funding_round_id": funding_round.id,
            "status": "executed",
        },
        user_id=user_id,
        organization_id=organization_id,
    )

    # Commit is done by the subrouter (consistent with commitment_subrouter.py pattern)

    return {
        "funding_round_id": funding_round.id,
        "security_id": security.id,
        "stakeholders_created": stakeholders_created,
        "transactions_created": transactions_created,
        "total_amount": raised_amount,
    }
