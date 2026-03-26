/**
 * Cash Flow Statement Schemas
 *
 * Zod validation schemas for CashFlowStatement model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/financial_models.py
 * - Schema: /server/apps/assetmanager/schemas/financial_schemas/cash_flow_statement_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/financial_subrouters/cash_flow_statement_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// CashFlowStatement Schema (Full Representation)
// ==========================================

/**
 * CashFlowStatement schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class CashFlowStatement(BaseModel)
 */
export const CashFlowStatementSchema = z.object({
  id: z.number(),
  entity_id: z.number(),

  // Time Dimensions
  year: z.number(),
  quarter: z.string().nullable(),
  semester: z.string().nullable(),
  month: z.string().nullable(),
  full_year: z.boolean(),
  scenario: z.string(),
  period_start: z.string().nullable(),
  period_end: z.string().nullable(),

  // Operating Activities
  net_income: z.number().nullable(),
  depreciation: z.number().nullable(),
  deferred_taxes: z.number().nullable(),
  stock_based_compensation: z.number().nullable(),
  other_non_cash_items: z.number().nullable(),
  accounts_receivable: z.number().nullable(),
  accounts_payable: z.number().nullable(),
  other_assets_liabilities: z.number().nullable(),
  operating_cash_flow: z.number().nullable(),

  // Investing Activities
  capital_expenditures: z.number().nullable(),
  net_intangibles: z.number().nullable(),
  net_acquisitions: z.number().nullable(),
  purchase_of_investments: z.number().nullable(),
  sale_of_investments: z.number().nullable(),
  other_investing_activity: z.number().nullable(),
  investing_cash_flow: z.number().nullable(),

  // Financing Activities
  long_term_debt_issuance: z.number().nullable(),
  long_term_debt_payments: z.number().nullable(),
  short_term_debt_issuance: z.number().nullable(),
  common_stock_issuance: z.number().nullable(),
  common_stock_repurchase: z.number().nullable(),
  common_dividends: z.number().nullable(),
  other_financing_charges: z.number().nullable(),
  financing_cash_flow: z.number().nullable(),

  // Summary
  end_cash_position: z.number().nullable(),
  income_tax_paid: z.number().nullable(),
  interest_paid: z.number().nullable(),
  free_cash_flow: z.number().nullable(),

  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(), // ISO datetime string from backend
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new cash flow statement (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class CashFlowStatementCreate(BaseModel)
 */
export const CreateCashFlowStatementSchema = z.object({
  entity_id: z.number(),
  year: z.number(),
  full_year: z.boolean().optional(),
  scenario: z.string().optional(),
  quarter: z.string().nullable().optional(),
  semester: z.string().nullable().optional(),
  month: z.string().nullable().optional(),
  period_start: z.string().nullable().optional(),
  period_end: z.string().nullable().optional(),

  // Operating Activities
  net_income: z.number().nullable().optional(),
  depreciation: z.number().nullable().optional(),
  deferred_taxes: z.number().nullable().optional(),
  stock_based_compensation: z.number().nullable().optional(),
  other_non_cash_items: z.number().nullable().optional(),
  accounts_receivable: z.number().nullable().optional(),
  accounts_payable: z.number().nullable().optional(),
  other_assets_liabilities: z.number().nullable().optional(),
  operating_cash_flow: z.number().nullable().optional(),

  // Investing Activities
  capital_expenditures: z.number().nullable().optional(),
  net_intangibles: z.number().nullable().optional(),
  net_acquisitions: z.number().nullable().optional(),
  purchase_of_investments: z.number().nullable().optional(),
  sale_of_investments: z.number().nullable().optional(),
  other_investing_activity: z.number().nullable().optional(),
  investing_cash_flow: z.number().nullable().optional(),

  // Financing Activities
  long_term_debt_issuance: z.number().nullable().optional(),
  long_term_debt_payments: z.number().nullable().optional(),
  short_term_debt_issuance: z.number().nullable().optional(),
  common_stock_issuance: z.number().nullable().optional(),
  common_stock_repurchase: z.number().nullable().optional(),
  common_dividends: z.number().nullable().optional(),
  other_financing_charges: z.number().nullable().optional(),
  financing_cash_flow: z.number().nullable().optional(),

  // Summary
  end_cash_position: z.number().nullable().optional(),
  income_tax_paid: z.number().nullable().optional(),
  interest_paid: z.number().nullable().optional(),
  free_cash_flow: z.number().nullable().optional(),
});

/**
 * Schema for updating a cash flow statement (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class CashFlowStatementUpdate(BaseModel)
 */
export const UpdateCashFlowStatementSchema = z.object({
  entity_id: z.number().nullable().optional(),

  // Time Dimensions
  year: z.number().nullable().optional(),
  quarter: z.string().nullable().optional(),
  semester: z.string().nullable().optional(),
  month: z.string().nullable().optional(),
  full_year: z.boolean().nullable().optional(),
  scenario: z.string().nullable().optional(),
  period_start: z.string().nullable().optional(),
  period_end: z.string().nullable().optional(),

  // Operating Activities
  net_income: z.number().nullable().optional(),
  depreciation: z.number().nullable().optional(),
  deferred_taxes: z.number().nullable().optional(),
  stock_based_compensation: z.number().nullable().optional(),
  other_non_cash_items: z.number().nullable().optional(),
  accounts_receivable: z.number().nullable().optional(),
  accounts_payable: z.number().nullable().optional(),
  other_assets_liabilities: z.number().nullable().optional(),
  operating_cash_flow: z.number().nullable().optional(),

  // Investing Activities
  capital_expenditures: z.number().nullable().optional(),
  net_intangibles: z.number().nullable().optional(),
  net_acquisitions: z.number().nullable().optional(),
  purchase_of_investments: z.number().nullable().optional(),
  sale_of_investments: z.number().nullable().optional(),
  other_investing_activity: z.number().nullable().optional(),
  investing_cash_flow: z.number().nullable().optional(),

  // Financing Activities
  long_term_debt_issuance: z.number().nullable().optional(),
  long_term_debt_payments: z.number().nullable().optional(),
  short_term_debt_issuance: z.number().nullable().optional(),
  common_stock_issuance: z.number().nullable().optional(),
  common_stock_repurchase: z.number().nullable().optional(),
  common_dividends: z.number().nullable().optional(),
  other_financing_charges: z.number().nullable().optional(),
  financing_cash_flow: z.number().nullable().optional(),

  // Summary
  end_cash_position: z.number().nullable().optional(),
  income_tax_paid: z.number().nullable().optional(),
  interest_paid: z.number().nullable().optional(),
  free_cash_flow: z.number().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type CashFlowStatement = z.infer<typeof CashFlowStatementSchema>;
export type CreateCashFlowStatement = z.infer<typeof CreateCashFlowStatementSchema>;
export type UpdateCashFlowStatement = z.infer<typeof UpdateCashFlowStatementSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single cash flow statement
 * Backend equivalent: class CashFlowStatementResponse(BaseModel)
 */
export type CashFlowStatementResponse = {
  success: boolean;
  data?: CashFlowStatement;
  error?: string;
};

/**
 * Response containing multiple cash flow statements
 * Backend equivalent: class CashFlowStatementsResponse(BaseModel)
 */
export type CashFlowStatementsResponse = {
  success: boolean;
  data?: CashFlowStatement[];
  error?: string;
};
