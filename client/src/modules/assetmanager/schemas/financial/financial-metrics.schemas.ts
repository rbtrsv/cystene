/**
 * Financial Metrics Schemas
 *
 * Zod validation schemas for FinancialMetrics model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/financial_models.py
 * - Schema: /server/apps/assetmanager/schemas/financial_schemas/financial_metrics_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/financial_subrouters/financial_metrics_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// FinancialMetrics Schema (Full Representation)
// ==========================================

/**
 * FinancialMetrics schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class FinancialMetrics(BaseModel)
 */
export const FinancialMetricsSchema = z.object({
  id: z.number(),
  entity_id: z.number(),

  // Time Dimensions
  year: z.number(),
  quarter: z.string().nullable(),
  semester: z.string().nullable(),
  month: z.string().nullable(),
  full_year: z.boolean(),
  scenario: z.string(),
  period_end: z.string().nullable(),

  // Ratios: Liquidity
  current_ratio: z.number().nullable(),
  quick_ratio: z.number().nullable(),
  cash_ratio: z.number().nullable(),
  operating_cash_flow_ratio: z.number().nullable(),

  // Ratios: Solvency
  debt_to_equity_ratio: z.number().nullable(),
  debt_to_assets_ratio: z.number().nullable(),
  interest_coverage_ratio: z.number().nullable(),
  debt_service_coverage_ratio: z.number().nullable(),

  // Ratios: Profitability
  gross_profit_margin: z.number().nullable(),
  operating_profit_margin: z.number().nullable(),
  net_profit_margin: z.number().nullable(),
  ebitda_margin: z.number().nullable(),
  return_on_assets: z.number().nullable(),
  return_on_equity: z.number().nullable(),
  return_on_invested_capital: z.number().nullable(),

  // Ratios: Efficiency
  asset_turnover_ratio: z.number().nullable(),
  inventory_turnover_ratio: z.number().nullable(),
  receivables_turnover_ratio: z.number().nullable(),
  days_sales_outstanding: z.number().nullable(),
  days_inventory_outstanding: z.number().nullable(),
  days_payables_outstanding: z.number().nullable(),

  // Ratios: Investment
  earnings_per_share: z.number().nullable(),
  price_earnings_ratio: z.number().nullable(),
  dividend_yield: z.number().nullable(),
  dividend_payout_ratio: z.number().nullable(),
  book_value_per_share: z.number().nullable(),

  // Revenue Metrics
  recurring_revenue: z.number().nullable(),
  non_recurring_revenue: z.number().nullable(),
  revenue_growth_rate: z.number().nullable(),
  existing_customer_existing_seats_revenue: z.number().nullable(),
  existing_customer_additional_seats_revenue: z.number().nullable(),
  new_customer_new_seats_revenue: z.number().nullable(),
  discounts_and_refunds: z.number().nullable(),
  arr: z.number().nullable(),
  mrr: z.number().nullable(),
  average_revenue_per_customer: z.number().nullable(),
  average_contract_value: z.number().nullable(),
  revenue_churn_rate: z.number().nullable(),
  net_revenue_retention: z.number().nullable(),
  gross_revenue_retention: z.number().nullable(),
  growth_rate_cohort_1: z.number().nullable(),
  growth_rate_cohort_2: z.number().nullable(),
  growth_rate_cohort_3: z.number().nullable(),

  // Customer Metrics
  total_customers: z.number().int().nullable(),
  new_customers: z.number().int().nullable(),
  churned_customers: z.number().int().nullable(),
  total_users: z.number().int().nullable(),
  active_users: z.number().int().nullable(),
  total_monthly_active_client_users: z.number().int().nullable(),
  existing_customer_existing_seats_users: z.number().int().nullable(),
  existing_customer_additional_seats_users: z.number().int().nullable(),
  new_customer_new_seats_users: z.number().int().nullable(),
  user_growth_rate: z.number().nullable(),
  new_customer_total_addressable_seats: z.number().int().nullable(),
  new_customer_new_seats_percent_signed: z.number().nullable(),
  new_customer_total_addressable_seats_remaining: z.number().int().nullable(),
  existing_customer_count: z.number().int().nullable(),
  existing_customer_expansion_count: z.number().int().nullable(),
  new_customer_count: z.number().int().nullable(),
  customer_growth_rate: z.number().nullable(),
  cac: z.number().nullable(),
  ltv: z.number().nullable(),
  ltv_cac_ratio: z.number().nullable(),
  payback_period: z.number().nullable(),
  customer_churn_rate: z.number().nullable(),
  customer_acquisition_efficiency: z.number().nullable(),
  sales_efficiency: z.number().nullable(),

  // Operational Metrics
  burn_rate: z.number().nullable(),
  runway_months: z.number().nullable(),
  runway_gross: z.number().nullable(),
  runway_net: z.number().nullable(),
  burn_multiple: z.number().nullable(),
  rule_of_40: z.number().nullable(),
  gross_margin: z.number().nullable(),
  contribution_margin: z.number().nullable(),
  revenue_per_employee: z.number().nullable(),
  profit_per_employee: z.number().nullable(),
  capital_efficiency: z.number().nullable(),
  cash_conversion_cycle: z.number().nullable(),
  capex: z.number().nullable(),
  ebitda: z.number().nullable(),
  total_costs: z.number().nullable(),

  // Team Metrics
  total_employees: z.number().int().nullable(),
  full_time_employees: z.number().int().nullable(),
  part_time_employees: z.number().int().nullable(),
  contractors: z.number().int().nullable(),
  number_of_management: z.number().int().nullable(),
  number_of_sales_marketing_staff: z.number().int().nullable(),
  number_of_research_development_staff: z.number().int().nullable(),
  number_of_customer_service_support_staff: z.number().int().nullable(),
  number_of_general_staff: z.number().int().nullable(),
  employee_growth_rate: z.number().nullable(),
  employee_turnover_rate: z.number().nullable(),
  average_tenure_months: z.number().nullable(),
  management_costs: z.number().nullable(),
  sales_marketing_staff_costs: z.number().nullable(),
  research_development_staff_costs: z.number().nullable(),
  customer_service_support_staff_costs: z.number().nullable(),
  general_staff_costs: z.number().nullable(),
  staff_costs_total: z.number().nullable(),

  // Notes
  notes: z.string().nullable(),
  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(), // ISO datetime string from backend
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating financial metrics (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class FinancialMetricsCreate(BaseModel)
 */
export const CreateFinancialMetricsSchema = z.object({
  entity_id: z.number(),
  year: z.number(),
  quarter: z.string().nullable().optional(),
  semester: z.string().nullable().optional(),
  month: z.string().nullable().optional(),
  full_year: z.boolean().optional(),
  scenario: z.string().optional(),
  period_end: z.string().nullable().optional(),

  // Ratios: Liquidity
  current_ratio: z.number().nullable().optional(),
  quick_ratio: z.number().nullable().optional(),
  cash_ratio: z.number().nullable().optional(),
  operating_cash_flow_ratio: z.number().nullable().optional(),

  // Ratios: Solvency
  debt_to_equity_ratio: z.number().nullable().optional(),
  debt_to_assets_ratio: z.number().nullable().optional(),
  interest_coverage_ratio: z.number().nullable().optional(),
  debt_service_coverage_ratio: z.number().nullable().optional(),

  // Ratios: Profitability
  gross_profit_margin: z.number().nullable().optional(),
  operating_profit_margin: z.number().nullable().optional(),
  net_profit_margin: z.number().nullable().optional(),
  ebitda_margin: z.number().nullable().optional(),
  return_on_assets: z.number().nullable().optional(),
  return_on_equity: z.number().nullable().optional(),
  return_on_invested_capital: z.number().nullable().optional(),

  // Ratios: Efficiency
  asset_turnover_ratio: z.number().nullable().optional(),
  inventory_turnover_ratio: z.number().nullable().optional(),
  receivables_turnover_ratio: z.number().nullable().optional(),
  days_sales_outstanding: z.number().nullable().optional(),
  days_inventory_outstanding: z.number().nullable().optional(),
  days_payables_outstanding: z.number().nullable().optional(),

  // Ratios: Investment
  earnings_per_share: z.number().nullable().optional(),
  price_earnings_ratio: z.number().nullable().optional(),
  dividend_yield: z.number().nullable().optional(),
  dividend_payout_ratio: z.number().nullable().optional(),
  book_value_per_share: z.number().nullable().optional(),

  // Revenue Metrics
  recurring_revenue: z.number().nullable().optional(),
  non_recurring_revenue: z.number().nullable().optional(),
  revenue_growth_rate: z.number().nullable().optional(),
  existing_customer_existing_seats_revenue: z.number().nullable().optional(),
  existing_customer_additional_seats_revenue: z.number().nullable().optional(),
  new_customer_new_seats_revenue: z.number().nullable().optional(),
  discounts_and_refunds: z.number().nullable().optional(),
  arr: z.number().nullable().optional(),
  mrr: z.number().nullable().optional(),
  average_revenue_per_customer: z.number().nullable().optional(),
  average_contract_value: z.number().nullable().optional(),
  revenue_churn_rate: z.number().nullable().optional(),
  net_revenue_retention: z.number().nullable().optional(),
  gross_revenue_retention: z.number().nullable().optional(),
  growth_rate_cohort_1: z.number().nullable().optional(),
  growth_rate_cohort_2: z.number().nullable().optional(),
  growth_rate_cohort_3: z.number().nullable().optional(),

  // Customer Metrics
  total_customers: z.number().int().nullable().optional(),
  new_customers: z.number().int().nullable().optional(),
  churned_customers: z.number().int().nullable().optional(),
  total_users: z.number().int().nullable().optional(),
  active_users: z.number().int().nullable().optional(),
  total_monthly_active_client_users: z.number().int().nullable().optional(),
  existing_customer_existing_seats_users: z.number().int().nullable().optional(),
  existing_customer_additional_seats_users: z.number().int().nullable().optional(),
  new_customer_new_seats_users: z.number().int().nullable().optional(),
  user_growth_rate: z.number().nullable().optional(),
  new_customer_total_addressable_seats: z.number().int().nullable().optional(),
  new_customer_new_seats_percent_signed: z.number().nullable().optional(),
  new_customer_total_addressable_seats_remaining: z.number().int().nullable().optional(),
  existing_customer_count: z.number().int().nullable().optional(),
  existing_customer_expansion_count: z.number().int().nullable().optional(),
  new_customer_count: z.number().int().nullable().optional(),
  customer_growth_rate: z.number().nullable().optional(),
  cac: z.number().nullable().optional(),
  ltv: z.number().nullable().optional(),
  ltv_cac_ratio: z.number().nullable().optional(),
  payback_period: z.number().nullable().optional(),
  customer_churn_rate: z.number().nullable().optional(),
  customer_acquisition_efficiency: z.number().nullable().optional(),
  sales_efficiency: z.number().nullable().optional(),

  // Operational Metrics
  burn_rate: z.number().nullable().optional(),
  runway_months: z.number().nullable().optional(),
  runway_gross: z.number().nullable().optional(),
  runway_net: z.number().nullable().optional(),
  burn_multiple: z.number().nullable().optional(),
  rule_of_40: z.number().nullable().optional(),
  gross_margin: z.number().nullable().optional(),
  contribution_margin: z.number().nullable().optional(),
  revenue_per_employee: z.number().nullable().optional(),
  profit_per_employee: z.number().nullable().optional(),
  capital_efficiency: z.number().nullable().optional(),
  cash_conversion_cycle: z.number().nullable().optional(),
  capex: z.number().nullable().optional(),
  ebitda: z.number().nullable().optional(),
  total_costs: z.number().nullable().optional(),

  // Team Metrics
  total_employees: z.number().int().nullable().optional(),
  full_time_employees: z.number().int().nullable().optional(),
  part_time_employees: z.number().int().nullable().optional(),
  contractors: z.number().int().nullable().optional(),
  number_of_management: z.number().int().nullable().optional(),
  number_of_sales_marketing_staff: z.number().int().nullable().optional(),
  number_of_research_development_staff: z.number().int().nullable().optional(),
  number_of_customer_service_support_staff: z.number().int().nullable().optional(),
  number_of_general_staff: z.number().int().nullable().optional(),
  employee_growth_rate: z.number().nullable().optional(),
  employee_turnover_rate: z.number().nullable().optional(),
  average_tenure_months: z.number().nullable().optional(),
  management_costs: z.number().nullable().optional(),
  sales_marketing_staff_costs: z.number().nullable().optional(),
  research_development_staff_costs: z.number().nullable().optional(),
  customer_service_support_staff_costs: z.number().nullable().optional(),
  general_staff_costs: z.number().nullable().optional(),
  staff_costs_total: z.number().nullable().optional(),

  // Notes
  notes: z.string().nullable().optional(),
});

/**
 * Schema for updating financial metrics (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class FinancialMetricsUpdate(BaseModel)
 */
export const UpdateFinancialMetricsSchema = z.object({
  entity_id: z.number().nullable().optional(),

  // Time Dimensions
  year: z.number().nullable().optional(),
  quarter: z.string().nullable().optional(),
  semester: z.string().nullable().optional(),
  month: z.string().nullable().optional(),
  full_year: z.boolean().nullable().optional(),
  scenario: z.string().nullable().optional(),
  period_end: z.string().nullable().optional(),

  // Ratios: Liquidity
  current_ratio: z.number().nullable().optional(),
  quick_ratio: z.number().nullable().optional(),
  cash_ratio: z.number().nullable().optional(),
  operating_cash_flow_ratio: z.number().nullable().optional(),

  // Ratios: Solvency
  debt_to_equity_ratio: z.number().nullable().optional(),
  debt_to_assets_ratio: z.number().nullable().optional(),
  interest_coverage_ratio: z.number().nullable().optional(),
  debt_service_coverage_ratio: z.number().nullable().optional(),

  // Ratios: Profitability
  gross_profit_margin: z.number().nullable().optional(),
  operating_profit_margin: z.number().nullable().optional(),
  net_profit_margin: z.number().nullable().optional(),
  ebitda_margin: z.number().nullable().optional(),
  return_on_assets: z.number().nullable().optional(),
  return_on_equity: z.number().nullable().optional(),
  return_on_invested_capital: z.number().nullable().optional(),

  // Ratios: Efficiency
  asset_turnover_ratio: z.number().nullable().optional(),
  inventory_turnover_ratio: z.number().nullable().optional(),
  receivables_turnover_ratio: z.number().nullable().optional(),
  days_sales_outstanding: z.number().nullable().optional(),
  days_inventory_outstanding: z.number().nullable().optional(),
  days_payables_outstanding: z.number().nullable().optional(),

  // Ratios: Investment
  earnings_per_share: z.number().nullable().optional(),
  price_earnings_ratio: z.number().nullable().optional(),
  dividend_yield: z.number().nullable().optional(),
  dividend_payout_ratio: z.number().nullable().optional(),
  book_value_per_share: z.number().nullable().optional(),

  // Revenue Metrics
  recurring_revenue: z.number().nullable().optional(),
  non_recurring_revenue: z.number().nullable().optional(),
  revenue_growth_rate: z.number().nullable().optional(),
  existing_customer_existing_seats_revenue: z.number().nullable().optional(),
  existing_customer_additional_seats_revenue: z.number().nullable().optional(),
  new_customer_new_seats_revenue: z.number().nullable().optional(),
  discounts_and_refunds: z.number().nullable().optional(),
  arr: z.number().nullable().optional(),
  mrr: z.number().nullable().optional(),
  average_revenue_per_customer: z.number().nullable().optional(),
  average_contract_value: z.number().nullable().optional(),
  revenue_churn_rate: z.number().nullable().optional(),
  net_revenue_retention: z.number().nullable().optional(),
  gross_revenue_retention: z.number().nullable().optional(),
  growth_rate_cohort_1: z.number().nullable().optional(),
  growth_rate_cohort_2: z.number().nullable().optional(),
  growth_rate_cohort_3: z.number().nullable().optional(),

  // Customer Metrics
  total_customers: z.number().int().nullable().optional(),
  new_customers: z.number().int().nullable().optional(),
  churned_customers: z.number().int().nullable().optional(),
  total_users: z.number().int().nullable().optional(),
  active_users: z.number().int().nullable().optional(),
  total_monthly_active_client_users: z.number().int().nullable().optional(),
  existing_customer_existing_seats_users: z.number().int().nullable().optional(),
  existing_customer_additional_seats_users: z.number().int().nullable().optional(),
  new_customer_new_seats_users: z.number().int().nullable().optional(),
  user_growth_rate: z.number().nullable().optional(),
  new_customer_total_addressable_seats: z.number().int().nullable().optional(),
  new_customer_new_seats_percent_signed: z.number().nullable().optional(),
  new_customer_total_addressable_seats_remaining: z.number().int().nullable().optional(),
  existing_customer_count: z.number().int().nullable().optional(),
  existing_customer_expansion_count: z.number().int().nullable().optional(),
  new_customer_count: z.number().int().nullable().optional(),
  customer_growth_rate: z.number().nullable().optional(),
  cac: z.number().nullable().optional(),
  ltv: z.number().nullable().optional(),
  ltv_cac_ratio: z.number().nullable().optional(),
  payback_period: z.number().nullable().optional(),
  customer_churn_rate: z.number().nullable().optional(),
  customer_acquisition_efficiency: z.number().nullable().optional(),
  sales_efficiency: z.number().nullable().optional(),

  // Operational Metrics
  burn_rate: z.number().nullable().optional(),
  runway_months: z.number().nullable().optional(),
  runway_gross: z.number().nullable().optional(),
  runway_net: z.number().nullable().optional(),
  burn_multiple: z.number().nullable().optional(),
  rule_of_40: z.number().nullable().optional(),
  gross_margin: z.number().nullable().optional(),
  contribution_margin: z.number().nullable().optional(),
  revenue_per_employee: z.number().nullable().optional(),
  profit_per_employee: z.number().nullable().optional(),
  capital_efficiency: z.number().nullable().optional(),
  cash_conversion_cycle: z.number().nullable().optional(),
  capex: z.number().nullable().optional(),
  ebitda: z.number().nullable().optional(),
  total_costs: z.number().nullable().optional(),

  // Team Metrics
  total_employees: z.number().int().nullable().optional(),
  full_time_employees: z.number().int().nullable().optional(),
  part_time_employees: z.number().int().nullable().optional(),
  contractors: z.number().int().nullable().optional(),
  number_of_management: z.number().int().nullable().optional(),
  number_of_sales_marketing_staff: z.number().int().nullable().optional(),
  number_of_research_development_staff: z.number().int().nullable().optional(),
  number_of_customer_service_support_staff: z.number().int().nullable().optional(),
  number_of_general_staff: z.number().int().nullable().optional(),
  employee_growth_rate: z.number().nullable().optional(),
  employee_turnover_rate: z.number().nullable().optional(),
  average_tenure_months: z.number().nullable().optional(),
  management_costs: z.number().nullable().optional(),
  sales_marketing_staff_costs: z.number().nullable().optional(),
  research_development_staff_costs: z.number().nullable().optional(),
  customer_service_support_staff_costs: z.number().nullable().optional(),
  general_staff_costs: z.number().nullable().optional(),
  staff_costs_total: z.number().nullable().optional(),

  // Notes
  notes: z.string().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type FinancialMetrics = z.infer<typeof FinancialMetricsSchema>;
export type CreateFinancialMetrics = z.infer<typeof CreateFinancialMetricsSchema>;
export type UpdateFinancialMetrics = z.infer<typeof UpdateFinancialMetricsSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single financial metrics snapshot
 * Backend equivalent: class FinancialMetricsResponse(BaseModel)
 */
export type FinancialMetricsResponse = {
  success: boolean;
  data?: FinancialMetrics;
  error?: string;
};

/**
 * Response containing multiple financial metrics snapshots
 * Backend equivalent: class FinancialMetricsListResponse(BaseModel)
 */
export type FinancialMetricsListResponse = {
  success: boolean;
  data?: FinancialMetrics[];
  error?: string;
};
