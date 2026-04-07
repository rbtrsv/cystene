/**
 * API endpoints for AssetManager module
 *
 * All endpoints under /assetmanager prefix
 */

/**
 * Base API URL
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://127.0.0.1:8001';

/**
 * API endpoints for entities
 * Backend: /server/apps/assetmanager/subrouters/entity_subrouters/entity_subrouter.py
 */
export const ENTITY_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/entities/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/entities/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/entities/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/entities/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/entities/${id}`,
  DISCOVER: `${API_BASE_URL}/assetmanager/entities/discover`,
  GENERATE_INVITE_CODE: (id: number) => `${API_BASE_URL}/assetmanager/entities/${id}/generate-invite-code`,
  REVOKE_INVITE_CODE: (id: number) => `${API_BASE_URL}/assetmanager/entities/${id}/invite-code`,
  JOIN_BY_INVITE_CODE: (code: string) => `${API_BASE_URL}/assetmanager/entities/join/${code}`,
};

/**
 * API endpoints for entity organization members
 * Backend: /server/apps/assetmanager/subrouters/entity_subrouters/entity_organization_member_subrouter.py
 */
export const ENTITY_ORGANIZATION_MEMBER_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/entity-organization-members/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/entity-organization-members/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/entity-organization-members/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/entity-organization-members/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/entity-organization-members/${id}`,
};

/**
 * API endpoints for entity organization invitations
 * Backend: /server/apps/assetmanager/subrouters/entity_subrouters/entity_organization_invitation_subrouter.py
 */
export const ENTITY_ORGANIZATION_INVITATION_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/entity-organization-invitations/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/entity-organization-invitations/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/entity-organization-invitations/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/entity-organization-invitations/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/entity-organization-invitations/${id}`,
  ACCEPT: (id: number) => `${API_BASE_URL}/assetmanager/entity-organization-invitations/${id}/accept`,
  REJECT: (id: number) => `${API_BASE_URL}/assetmanager/entity-organization-invitations/${id}/reject`,
  REQUEST_ACCESS: `${API_BASE_URL}/assetmanager/entity-organization-invitations/request-access`,
};

/**
 * API endpoints for stakeholders
 * Backend: /server/apps/assetmanager/subrouters/entity_subrouters/stakeholder_subrouter.py
 */
export const STAKEHOLDER_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/stakeholders/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/stakeholders/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/stakeholders/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/stakeholders/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/stakeholders/${id}`,
};

/**
 * API endpoints for funding rounds
 * Backend: /server/apps/assetmanager/subrouters/captable_subrouters/funding_round_subrouter.py
 */
export const FUNDING_ROUND_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/funding-rounds/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/funding-rounds/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/funding-rounds/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/funding-rounds/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/funding-rounds/${id}`,
};

/**
 * API endpoints for securities
 * Backend: /server/apps/assetmanager/subrouters/captable_subrouters/security_subrouter.py
 */
export const SECURITY_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/securities/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/securities/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/securities/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/securities/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/securities/${id}`,
};

/**
 * API endpoints for security transactions
 * Backend: /server/apps/assetmanager/subrouters/captable_subrouters/security_transaction_subrouter.py
 */
export const SECURITY_TRANSACTION_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/security-transactions/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/security-transactions/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/security-transactions/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/security-transactions/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/security-transactions/${id}`,
  NEXT_REFERENCE: `${API_BASE_URL}/assetmanager/security-transactions/next-reference`,
};

/**
 * API endpoints for commitments
 * Backend: /server/apps/assetmanager/subrouters/captable_subrouters/commitment_subrouter.py
 */
export const COMMITMENT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/commitments/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/commitments/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/commitments/`,
  RESPOND: (id: number) => `${API_BASE_URL}/assetmanager/commitments/${id}/respond`,
  REVIEW: (id: number) => `${API_BASE_URL}/assetmanager/commitments/${id}/review`,
  GENERATE_TRANSACTION: (id: number) => `${API_BASE_URL}/assetmanager/commitments/${id}/generate-transaction`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/commitments/${id}`,
};

/**
 * API endpoints for fees
 * Backend: /server/apps/assetmanager/subrouters/captable_subrouters/fee_subrouter.py
 */
export const FEE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/fees/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/fees/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/fees/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/fees/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/fees/${id}`,
};

/**
 * API endpoints for entity deal profiles
 * Backend: /server/apps/assetmanager/subrouters/deal_subrouters/entity_deal_profile_subrouter.py
 */
export const ENTITY_DEAL_PROFILE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/entity-deal-profiles/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/entity-deal-profiles/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/entity-deal-profiles/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/entity-deal-profiles/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/entity-deal-profiles/${id}`,
};

/**
 * API endpoints for deals
 * Backend: /server/apps/assetmanager/subrouters/deal_subrouters/deal_subrouter.py
 */
export const DEAL_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/deals/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/deals/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/deals/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/deals/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/deals/${id}`,
  // Why STATUS: Separate endpoint for status transitions (not part of general PUT update)
  STATUS: (id: number) => `${API_BASE_URL}/assetmanager/deals/${id}/status`,
  // Why EXECUTE: Triggers the deal-to-captable bridge — creates FundingRound + Security + Transactions
  EXECUTE: (id: number) => `${API_BASE_URL}/assetmanager/deals/${id}/execute`,
};

/**
 * API endpoints for deal commitments
 * Backend: /server/apps/assetmanager/subrouters/deal_subrouters/deal_commitment_subrouter.py
 */
export const DEAL_COMMITMENT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/deal-commitments/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/deal-commitments/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/deal-commitments/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/deal-commitments/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/deal-commitments/${id}`,
};

/**
 * API endpoints for income statements
 * Backend: /server/apps/assetmanager/subrouters/financial_subrouters/income_statement_subrouter.py
 */
export const INCOME_STATEMENT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/income-statements/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/income-statements/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/income-statements/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/income-statements/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/income-statements/${id}`,
};

/**
 * API endpoints for cash flow statements
 * Backend: /server/apps/assetmanager/subrouters/financial_subrouters/cash_flow_statement_subrouter.py
 */
export const CASH_FLOW_STATEMENT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/cash-flow-statements/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/cash-flow-statements/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/cash-flow-statements/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/cash-flow-statements/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/cash-flow-statements/${id}`,
};

/**
 * API endpoints for balance sheets
 * Backend: /server/apps/assetmanager/subrouters/financial_subrouters/balance_sheet_subrouter.py
 */
export const BALANCE_SHEET_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/balance-sheets/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/balance-sheets/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/balance-sheets/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/balance-sheets/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/balance-sheets/${id}`,
};

/**
 * API endpoints for financial metrics
 * Backend: /server/apps/assetmanager/subrouters/financial_subrouters/financial_metrics_subrouter.py
 */
export const FINANCIAL_METRICS_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/financial-metrics/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/financial-metrics/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/financial-metrics/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/financial-metrics/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/financial-metrics/${id}`,
};

/**
 * API endpoints for KPIs
 * Backend: /server/apps/assetmanager/subrouters/financial_subrouters/kpi_subrouter.py
 */
export const KPI_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/kpis/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/kpis/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/kpis/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/kpis/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/kpis/${id}`,
};

/**
 * API endpoints for KPI values
 * Backend: /server/apps/assetmanager/subrouters/financial_subrouters/kpi_value_subrouter.py
 */
export const KPI_VALUE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/kpi-values/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/kpi-values/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/kpi-values/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/kpi-values/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/kpi-values/${id}`,
};

/**
 * API endpoints for deal pipeline
 * Backend: /server/apps/assetmanager/subrouters/holding_subrouters/deal_pipeline_subrouter.py
 */
export const DEAL_PIPELINE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/deal-pipeline/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/deal-pipeline/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/deal-pipeline/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/deal-pipeline/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/deal-pipeline/${id}`,
};

/**
 * API endpoints for holdings
 * Backend: /server/apps/assetmanager/subrouters/holding_subrouters/holding_subrouter.py
 */
export const HOLDING_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/holdings/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/holdings/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/holdings/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/holdings/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/holdings/${id}`,
};

/**
 * API endpoints for holding cash flows
 * Backend: /server/apps/assetmanager/subrouters/holding_subrouters/holding_cash_flow_subrouter.py
 */
export const HOLDING_CASH_FLOW_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/holding-cash-flows/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/holding-cash-flows/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/holding-cash-flows/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/holding-cash-flows/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/holding-cash-flows/${id}`,
};

/**
 * API endpoints for holding performance
 * Backend: /server/apps/assetmanager/subrouters/holding_subrouters/holding_performance_subrouter.py
 */
export const HOLDING_PERFORMANCE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/holding-performance/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/holding-performance/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/holding-performance/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/holding-performance/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/holding-performance/${id}`,
};

/**
 * API endpoints for valuations
 * Backend: /server/apps/assetmanager/subrouters/holding_subrouters/valuation_subrouter.py
 */
export const VALUATION_ENDPOINTS = {
  LIST: `${API_BASE_URL}/assetmanager/valuations/`,
  DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/valuations/${id}`,
  CREATE: `${API_BASE_URL}/assetmanager/valuations/`,
  UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/valuations/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/assetmanager/valuations/${id}`,
};

/**
 * API endpoints for computed performance (read-only)
 * Backend: /server/apps/assetmanager/subrouters/holding_subrouters/performance_subrouter.py
 */
export const PERFORMANCE_ENDPOINTS = {
  ENTITY: (entityId: number) => `${API_BASE_URL}/assetmanager/performance/entity/${entityId}`,
  HOLDINGS: (entityId: number) => `${API_BASE_URL}/assetmanager/performance/holdings/${entityId}`,
  STAKEHOLDERS: (entityId: number) => `${API_BASE_URL}/assetmanager/performance/stakeholders/${entityId}`,
};

/**
 * API endpoints for computed stakeholder positions (read-only, investor side)
 * Backend: /server/apps/assetmanager/subrouters/captable_subrouters/stakeholder_position_subrouter.py
 */
export const STAKEHOLDER_POSITION_ENDPOINTS = {
  LIST: (sourceEntityId: number) =>
    `${API_BASE_URL}/assetmanager/stakeholder-positions/?source_entity_id=${sourceEntityId}`,
  DETAIL: (entityId: number, sourceEntityId: number) =>
    `${API_BASE_URL}/assetmanager/stakeholder-positions/${entityId}?source_entity_id=${sourceEntityId}`,
  TRACK_AS_HOLDING: (entityId: number, sourceEntityId: number) =>
    `${API_BASE_URL}/assetmanager/stakeholder-positions/${entityId}/track-as-holding?source_entity_id=${sourceEntityId}`,
};
