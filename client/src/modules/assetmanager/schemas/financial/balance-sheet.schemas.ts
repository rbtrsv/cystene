/**
 * Balance Sheet Schemas
 *
 * Zod validation schemas for BalanceSheet model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/financial_models.py
 * - Schema: /server/apps/assetmanager/schemas/financial_schemas/balance_sheet_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/financial_subrouters/balance_sheet_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// BalanceSheet Schema (Full Representation)
// ==========================================

/**
 * BalanceSheet schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class BalanceSheet(BaseModel)
 */
export const BalanceSheetSchema = z.object({
  id: z.number(),
  entity_id: z.number(),

  // Time Dimensions
  year: z.number(),
  quarter: z.string().nullable(),
  semester: z.string().nullable(),
  month: z.string().nullable(),
  full_year: z.boolean(),
  scenario: z.string(),
  date: z.string().nullable(),

  // Current Assets
  cash: z.number().nullable(),
  cash_equivalents: z.number().nullable(),
  cash_and_cash_equivalents: z.number().nullable(),
  other_short_term_investments: z.number().nullable(),
  accounts_receivable: z.number().nullable(),
  other_receivables: z.number().nullable(),
  inventory: z.number().nullable(),
  prepaid_assets: z.number().nullable(),
  restricted_cash: z.number().nullable(),
  assets_held_for_sale: z.number().nullable(),
  hedging_assets: z.number().nullable(),
  other_current_assets: z.number().nullable(),
  total_current_assets: z.number().nullable(),

  // Non-current Assets
  properties: z.number().nullable(),
  land_and_improvements: z.number().nullable(),
  machinery_furniture_equipment: z.number().nullable(),
  construction_in_progress: z.number().nullable(),
  leases: z.number().nullable(),
  accumulated_depreciation: z.number().nullable(),
  goodwill: z.number().nullable(),
  investment_properties: z.number().nullable(),
  financial_assets: z.number().nullable(),
  intangible_assets: z.number().nullable(),
  investments_and_advances: z.number().nullable(),
  other_non_current_assets: z.number().nullable(),
  total_non_current_assets: z.number().nullable(),

  // Total Assets
  total_assets: z.number().nullable(),

  // Current Liabilities
  accounts_payable: z.number().nullable(),
  accrued_expenses: z.number().nullable(),
  short_term_debt: z.number().nullable(),
  deferred_revenue: z.number().nullable(),
  tax_payable: z.number().nullable(),
  pensions: z.number().nullable(),
  other_current_liabilities: z.number().nullable(),
  total_current_liabilities: z.number().nullable(),

  // Non-current Liabilities
  long_term_provisions: z.number().nullable(),
  long_term_debt: z.number().nullable(),
  provision_for_risks_and_charges: z.number().nullable(),
  deferred_liabilities: z.number().nullable(),
  derivative_product_liabilities: z.number().nullable(),
  other_non_current_liabilities: z.number().nullable(),
  total_non_current_liabilities: z.number().nullable(),

  // Total Liabilities
  total_liabilities: z.number().nullable(),

  // Shareholders Equity
  common_stock: z.number().nullable(),
  retained_earnings: z.number().nullable(),
  other_shareholders_equity: z.number().nullable(),
  total_shareholders_equity: z.number().nullable(),
  additional_paid_in_capital: z.number().nullable(),
  treasury_stock: z.number().nullable(),
  minority_interest: z.number().nullable(),

  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(), // ISO datetime string from backend
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new balance sheet (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class BalanceSheetCreate(BaseModel)
 */
export const CreateBalanceSheetSchema = z.object({
  entity_id: z.number(),
  year: z.number(),
  full_year: z.boolean().optional(),
  scenario: z.string().optional(),
  quarter: z.string().nullable().optional(),
  semester: z.string().nullable().optional(),
  month: z.string().nullable().optional(),
  date: z.string().nullable().optional(),

  // Current Assets
  cash: z.number().nullable().optional(),
  cash_equivalents: z.number().nullable().optional(),
  cash_and_cash_equivalents: z.number().nullable().optional(),
  other_short_term_investments: z.number().nullable().optional(),
  accounts_receivable: z.number().nullable().optional(),
  other_receivables: z.number().nullable().optional(),
  inventory: z.number().nullable().optional(),
  prepaid_assets: z.number().nullable().optional(),
  restricted_cash: z.number().nullable().optional(),
  assets_held_for_sale: z.number().nullable().optional(),
  hedging_assets: z.number().nullable().optional(),
  other_current_assets: z.number().nullable().optional(),
  total_current_assets: z.number().nullable().optional(),

  // Non-current Assets
  properties: z.number().nullable().optional(),
  land_and_improvements: z.number().nullable().optional(),
  machinery_furniture_equipment: z.number().nullable().optional(),
  construction_in_progress: z.number().nullable().optional(),
  leases: z.number().nullable().optional(),
  accumulated_depreciation: z.number().nullable().optional(),
  goodwill: z.number().nullable().optional(),
  investment_properties: z.number().nullable().optional(),
  financial_assets: z.number().nullable().optional(),
  intangible_assets: z.number().nullable().optional(),
  investments_and_advances: z.number().nullable().optional(),
  other_non_current_assets: z.number().nullable().optional(),
  total_non_current_assets: z.number().nullable().optional(),

  // Total Assets
  total_assets: z.number().nullable().optional(),

  // Current Liabilities
  accounts_payable: z.number().nullable().optional(),
  accrued_expenses: z.number().nullable().optional(),
  short_term_debt: z.number().nullable().optional(),
  deferred_revenue: z.number().nullable().optional(),
  tax_payable: z.number().nullable().optional(),
  pensions: z.number().nullable().optional(),
  other_current_liabilities: z.number().nullable().optional(),
  total_current_liabilities: z.number().nullable().optional(),

  // Non-current Liabilities
  long_term_provisions: z.number().nullable().optional(),
  long_term_debt: z.number().nullable().optional(),
  provision_for_risks_and_charges: z.number().nullable().optional(),
  deferred_liabilities: z.number().nullable().optional(),
  derivative_product_liabilities: z.number().nullable().optional(),
  other_non_current_liabilities: z.number().nullable().optional(),
  total_non_current_liabilities: z.number().nullable().optional(),

  // Total Liabilities
  total_liabilities: z.number().nullable().optional(),

  // Shareholders Equity
  common_stock: z.number().nullable().optional(),
  retained_earnings: z.number().nullable().optional(),
  other_shareholders_equity: z.number().nullable().optional(),
  total_shareholders_equity: z.number().nullable().optional(),
  additional_paid_in_capital: z.number().nullable().optional(),
  treasury_stock: z.number().nullable().optional(),
  minority_interest: z.number().nullable().optional(),
});

/**
 * Schema for updating a balance sheet (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class BalanceSheetUpdate(BaseModel)
 */
export const UpdateBalanceSheetSchema = z.object({
  entity_id: z.number().nullable().optional(),

  // Time Dimensions
  year: z.number().nullable().optional(),
  quarter: z.string().nullable().optional(),
  semester: z.string().nullable().optional(),
  month: z.string().nullable().optional(),
  full_year: z.boolean().nullable().optional(),
  scenario: z.string().nullable().optional(),
  date: z.string().nullable().optional(),

  // Current Assets
  cash: z.number().nullable().optional(),
  cash_equivalents: z.number().nullable().optional(),
  cash_and_cash_equivalents: z.number().nullable().optional(),
  other_short_term_investments: z.number().nullable().optional(),
  accounts_receivable: z.number().nullable().optional(),
  other_receivables: z.number().nullable().optional(),
  inventory: z.number().nullable().optional(),
  prepaid_assets: z.number().nullable().optional(),
  restricted_cash: z.number().nullable().optional(),
  assets_held_for_sale: z.number().nullable().optional(),
  hedging_assets: z.number().nullable().optional(),
  other_current_assets: z.number().nullable().optional(),
  total_current_assets: z.number().nullable().optional(),

  // Non-current Assets
  properties: z.number().nullable().optional(),
  land_and_improvements: z.number().nullable().optional(),
  machinery_furniture_equipment: z.number().nullable().optional(),
  construction_in_progress: z.number().nullable().optional(),
  leases: z.number().nullable().optional(),
  accumulated_depreciation: z.number().nullable().optional(),
  goodwill: z.number().nullable().optional(),
  investment_properties: z.number().nullable().optional(),
  financial_assets: z.number().nullable().optional(),
  intangible_assets: z.number().nullable().optional(),
  investments_and_advances: z.number().nullable().optional(),
  other_non_current_assets: z.number().nullable().optional(),
  total_non_current_assets: z.number().nullable().optional(),

  // Total Assets
  total_assets: z.number().nullable().optional(),

  // Current Liabilities
  accounts_payable: z.number().nullable().optional(),
  accrued_expenses: z.number().nullable().optional(),
  short_term_debt: z.number().nullable().optional(),
  deferred_revenue: z.number().nullable().optional(),
  tax_payable: z.number().nullable().optional(),
  pensions: z.number().nullable().optional(),
  other_current_liabilities: z.number().nullable().optional(),
  total_current_liabilities: z.number().nullable().optional(),

  // Non-current Liabilities
  long_term_provisions: z.number().nullable().optional(),
  long_term_debt: z.number().nullable().optional(),
  provision_for_risks_and_charges: z.number().nullable().optional(),
  deferred_liabilities: z.number().nullable().optional(),
  derivative_product_liabilities: z.number().nullable().optional(),
  other_non_current_liabilities: z.number().nullable().optional(),
  total_non_current_liabilities: z.number().nullable().optional(),

  // Total Liabilities
  total_liabilities: z.number().nullable().optional(),

  // Shareholders Equity
  common_stock: z.number().nullable().optional(),
  retained_earnings: z.number().nullable().optional(),
  other_shareholders_equity: z.number().nullable().optional(),
  total_shareholders_equity: z.number().nullable().optional(),
  additional_paid_in_capital: z.number().nullable().optional(),
  treasury_stock: z.number().nullable().optional(),
  minority_interest: z.number().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type BalanceSheet = z.infer<typeof BalanceSheetSchema>;
export type CreateBalanceSheet = z.infer<typeof CreateBalanceSheetSchema>;
export type UpdateBalanceSheet = z.infer<typeof UpdateBalanceSheetSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single balance sheet
 * Backend equivalent: class BalanceSheetResponse(BaseModel)
 */
export type BalanceSheetResponse = {
  success: boolean;
  data?: BalanceSheet;
  error?: string;
};

/**
 * Response containing multiple balance sheets
 * Backend equivalent: class BalanceSheetsResponse(BaseModel)
 */
export type BalanceSheetsResponse = {
  success: boolean;
  data?: BalanceSheet[];
  error?: string;
};
