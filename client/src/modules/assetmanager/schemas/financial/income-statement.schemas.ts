/**
 * Income Statement Schemas
 *
 * Zod validation schemas for IncomeStatement model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/financial_models.py
 * - Schema: /server/apps/assetmanager/schemas/financial_schemas/income_statement_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/financial_subrouters/income_statement_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// IncomeStatement Schema (Full Representation)
// ==========================================

/**
 * IncomeStatement schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class IncomeStatement(BaseModel)
 */
export const IncomeStatementSchema = z.object({
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

  // Revenue
  revenue: z.number().nullable(),
  cost_of_goods: z.number().nullable(),
  gross_profit: z.number().nullable(),

  // Operating Expenses
  research_and_development: z.number().nullable(),
  selling_general_and_administrative: z.number().nullable(),
  other_operating_expenses: z.number().nullable(),

  // Results
  operating_income: z.number().nullable(),
  non_operating_interest_income: z.number().nullable(),
  non_operating_interest_expense: z.number().nullable(),
  other_income_expense: z.number().nullable(),
  pretax_income: z.number().nullable(),
  income_tax: z.number().nullable(),
  net_income: z.number().nullable(),

  // Additional
  eps_basic: z.number().nullable(),
  eps_diluted: z.number().nullable(),
  basic_shares_outstanding: z.number().nullable(),
  diluted_shares_outstanding: z.number().nullable(),
  ebitda: z.number().nullable(),
  net_income_continuous_operations: z.number().nullable(),
  minority_interests: z.number().nullable(),
  preferred_stock_dividends: z.number().nullable(),

  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(), // ISO datetime string from backend
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new income statement (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class IncomeStatementCreate(BaseModel)
 */
export const CreateIncomeStatementSchema = z.object({
  entity_id: z.number(),
  year: z.number(),
  full_year: z.boolean().optional(),
  scenario: z.string().optional(),
  quarter: z.string().nullable().optional(),
  semester: z.string().nullable().optional(),
  month: z.string().nullable().optional(),
  period_start: z.string().nullable().optional(),
  period_end: z.string().nullable().optional(),

  // Revenue
  revenue: z.number().nullable().optional(),
  cost_of_goods: z.number().nullable().optional(),
  gross_profit: z.number().nullable().optional(),

  // Operating Expenses
  research_and_development: z.number().nullable().optional(),
  selling_general_and_administrative: z.number().nullable().optional(),
  other_operating_expenses: z.number().nullable().optional(),

  // Results
  operating_income: z.number().nullable().optional(),
  non_operating_interest_income: z.number().nullable().optional(),
  non_operating_interest_expense: z.number().nullable().optional(),
  other_income_expense: z.number().nullable().optional(),
  pretax_income: z.number().nullable().optional(),
  income_tax: z.number().nullable().optional(),
  net_income: z.number().nullable().optional(),

  // Additional
  eps_basic: z.number().nullable().optional(),
  eps_diluted: z.number().nullable().optional(),
  basic_shares_outstanding: z.number().nullable().optional(),
  diluted_shares_outstanding: z.number().nullable().optional(),
  ebitda: z.number().nullable().optional(),
  net_income_continuous_operations: z.number().nullable().optional(),
  minority_interests: z.number().nullable().optional(),
  preferred_stock_dividends: z.number().nullable().optional(),
});

/**
 * Schema for updating an income statement (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class IncomeStatementUpdate(BaseModel)
 */
export const UpdateIncomeStatementSchema = z.object({
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

  // Revenue
  revenue: z.number().nullable().optional(),
  cost_of_goods: z.number().nullable().optional(),
  gross_profit: z.number().nullable().optional(),

  // Operating Expenses
  research_and_development: z.number().nullable().optional(),
  selling_general_and_administrative: z.number().nullable().optional(),
  other_operating_expenses: z.number().nullable().optional(),

  // Results
  operating_income: z.number().nullable().optional(),
  non_operating_interest_income: z.number().nullable().optional(),
  non_operating_interest_expense: z.number().nullable().optional(),
  other_income_expense: z.number().nullable().optional(),
  pretax_income: z.number().nullable().optional(),
  income_tax: z.number().nullable().optional(),
  net_income: z.number().nullable().optional(),

  // Additional
  eps_basic: z.number().nullable().optional(),
  eps_diluted: z.number().nullable().optional(),
  basic_shares_outstanding: z.number().nullable().optional(),
  diluted_shares_outstanding: z.number().nullable().optional(),
  ebitda: z.number().nullable().optional(),
  net_income_continuous_operations: z.number().nullable().optional(),
  minority_interests: z.number().nullable().optional(),
  preferred_stock_dividends: z.number().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type IncomeStatement = z.infer<typeof IncomeStatementSchema>;
export type CreateIncomeStatement = z.infer<typeof CreateIncomeStatementSchema>;
export type UpdateIncomeStatement = z.infer<typeof UpdateIncomeStatementSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single income statement
 * Backend equivalent: class IncomeStatementResponse(BaseModel)
 */
export type IncomeStatementResponse = {
  success: boolean;
  data?: IncomeStatement;
  error?: string;
};

/**
 * Response containing multiple income statements
 * Backend equivalent: class IncomeStatementsResponse(BaseModel)
 */
export type IncomeStatementsResponse = {
  success: boolean;
  data?: IncomeStatement[];
  error?: string;
};
