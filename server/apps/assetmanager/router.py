from fastapi import APIRouter

# Entity subrouters
from .subrouters.entity_subrouters.entity_subrouter import router as entity_router
from .subrouters.entity_subrouters.entity_organization_member_subrouter import router as entity_org_member_router
from .subrouters.entity_subrouters.entity_organization_invitation_subrouter import router as entity_org_invitation_router
from .subrouters.entity_subrouters.stakeholder_subrouter import router as stakeholder_router

# Captable subrouters
from .subrouters.captable_subrouters.funding_round_subrouter import router as funding_round_router
from .subrouters.captable_subrouters.security_subrouter import router as security_router
from .subrouters.captable_subrouters.security_transaction_subrouter import router as security_transaction_router
from .subrouters.captable_subrouters.commitment_subrouter import router as commitment_router
from .subrouters.captable_subrouters.cap_table_snapshot_subrouter import router as cap_table_snapshot_router
from .subrouters.captable_subrouters.cap_table_entry_subrouter import router as cap_table_entry_router
from .subrouters.captable_subrouters.fee_subrouter import router as fee_router
from .subrouters.captable_subrouters.stakeholder_position_subrouter import router as stakeholder_position_router

# Deal subrouters
from .subrouters.deal_subrouters.entity_deal_profile_subrouter import router as entity_deal_profile_router
from .subrouters.deal_subrouters.deal_subrouter import router as deal_router
from .subrouters.deal_subrouters.deal_commitment_subrouter import router as deal_commitment_router

# Holding subrouters
from .subrouters.holding_subrouters.valuation_subrouter import router as valuation_router
from .subrouters.holding_subrouters.deal_pipeline_subrouter import router as deal_pipeline_router
from .subrouters.holding_subrouters.holding_performance_subrouter import router as holding_performance_router
from .subrouters.holding_subrouters.holding_subrouter import router as holding_router
from .subrouters.holding_subrouters.holding_cash_flow_subrouter import router as holding_cash_flow_router
from .subrouters.holding_subrouters.performance_subrouter import router as performance_router

# Financial subrouters
from .subrouters.financial_subrouters.income_statement_subrouter import router as income_statement_router
from .subrouters.financial_subrouters.cash_flow_statement_subrouter import router as cash_flow_statement_router
from .subrouters.financial_subrouters.balance_sheet_subrouter import router as balance_sheet_router
from .subrouters.financial_subrouters.financial_metrics_subrouter import router as financial_metrics_router
from .subrouters.financial_subrouters.kpi_subrouter import router as kpi_router
from .subrouters.financial_subrouters.kpi_value_subrouter import router as kpi_value_router

router = APIRouter(prefix="/assetmanager")

# Include all entity subrouters
router.include_router(entity_router, prefix="/entities")
router.include_router(entity_org_member_router, prefix="/entity-organization-members")
router.include_router(entity_org_invitation_router, prefix="/entity-organization-invitations")
router.include_router(stakeholder_router, prefix="/stakeholders")

# Include all captable subrouters
router.include_router(funding_round_router, prefix="/funding-rounds")
router.include_router(security_router, prefix="/securities")
router.include_router(security_transaction_router, prefix="/security-transactions")
router.include_router(commitment_router, prefix="/commitments")
router.include_router(cap_table_snapshot_router, prefix="/cap-table-snapshots")
router.include_router(cap_table_entry_router, prefix="/cap-table-entries")
router.include_router(fee_router, prefix="/fees")
router.include_router(stakeholder_position_router, prefix="/stakeholder-positions")

# Include all deal subrouters
router.include_router(entity_deal_profile_router, prefix="/entity-deal-profiles")
router.include_router(deal_router, prefix="/deals")
router.include_router(deal_commitment_router, prefix="/deal-commitments")

# Include all holding subrouters
router.include_router(valuation_router, prefix="/valuations")
router.include_router(deal_pipeline_router, prefix="/deal-pipeline")
router.include_router(holding_performance_router, prefix="/holding-performance")
router.include_router(holding_router, prefix="/holdings")
router.include_router(holding_cash_flow_router, prefix="/holding-cash-flows")
router.include_router(performance_router, prefix="/performance")

# Include all financial subrouters
router.include_router(income_statement_router, prefix="/income-statements")
router.include_router(cash_flow_statement_router, prefix="/cash-flow-statements")
router.include_router(balance_sheet_router, prefix="/balance-sheets")
router.include_router(financial_metrics_router, prefix="/financial-metrics")
router.include_router(kpi_router, prefix="/kpis")
router.include_router(kpi_value_router, prefix="/kpi-values")
