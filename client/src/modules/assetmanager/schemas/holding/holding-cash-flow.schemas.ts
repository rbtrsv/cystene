/**
 * Holding Cash Flow Schemas
 *
 * Zod validation schemas for HoldingCashFlow model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/holding_models.py
 * - Schema: /server/apps/assetmanager/schemas/holding_schemas/holding_cash_flow_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/holding_subrouters/holding_cash_flow_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Cash flow type options - matches backend CashFlowType enum
 * Backend: class CashFlowType(str, Enum)
 */
export const CashFlowTypeEnum = z.enum([
  'investment',
  'distribution',
  'dividend',
  'fee',
  'other',
]);

/**
 * Cash flow category options - matches backend CashFlowCategory enum
 * Backend: class CashFlowCategory(str, Enum)
 */
export const CashFlowCategoryEnum = z.enum([
  'actual',
  'projected',
]);

/**
 * Cash flow scenario options - matches backend CashFlowScenario enum
 * Backend: class CashFlowScenario(str, Enum)
 */
export const CashFlowScenarioEnum = z.enum([
  'actual',
  'budget',
  'forecast',
]);

// ==========================================
// HoldingCashFlow Schema (Full Representation)
// ==========================================

/**
 * HoldingCashFlow schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class HoldingCashFlow(BaseModel)
 */
export const HoldingCashFlowSchema = z.object({
  id: z.number(),
  holding_id: z.number(),
  entity_id: z.number(),
  target_entity_id: z.number().nullable(),
  funding_round_id: z.number().nullable(),

  // Cash Flow Details
  date: z.string(),
  amount_debit: z.number(),
  amount_credit: z.number(),
  currency: z.string(),
  cash_flow_type: z.string(),
  category: z.string(),
  scenario: z.string(),

  // Transaction Reference
  cash_transaction_id: z.number().nullable(),

  // Additional Info
  transaction_reference: z.string().nullable(),
  description: z.string().nullable(),
  include_in_irr: z.boolean(),

  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(), // ISO datetime string from backend
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new holding cash flow (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class HoldingCashFlowCreate(BaseModel)
 */
export const CreateHoldingCashFlowSchema = z.object({
  holding_id: z.number(),
  entity_id: z.number(),
  date: z.string(),
  cash_flow_type: CashFlowTypeEnum,
  amount_debit: z.number().optional(),
  amount_credit: z.number().optional(),
  currency: z.string().optional(),
  category: CashFlowCategoryEnum.default('actual'),
  scenario: CashFlowScenarioEnum.default('actual'),
  include_in_irr: z.boolean().optional(),
  target_entity_id: z.number().nullable().optional(),
  funding_round_id: z.number().nullable().optional(),
  cash_transaction_id: z.number().nullable().optional(),
  transaction_reference: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

/**
 * Schema for updating a holding cash flow (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class HoldingCashFlowUpdate(BaseModel)
 */
export const UpdateHoldingCashFlowSchema = z.object({
  holding_id: z.number().nullable().optional(),
  entity_id: z.number().nullable().optional(),
  target_entity_id: z.number().nullable().optional(),
  funding_round_id: z.number().nullable().optional(),

  // Cash Flow Details
  date: z.string().nullable().optional(),
  amount_debit: z.number().nullable().optional(),
  amount_credit: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  cash_flow_type: CashFlowTypeEnum.nullable().optional(),
  category: CashFlowCategoryEnum.nullable().optional(),
  scenario: CashFlowScenarioEnum.nullable().optional(),

  // Transaction Reference
  cash_transaction_id: z.number().nullable().optional(),

  // Additional Info
  transaction_reference: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  include_in_irr: z.boolean().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type CashFlowType = z.infer<typeof CashFlowTypeEnum>;
export type CashFlowCategory = z.infer<typeof CashFlowCategoryEnum>;
export type CashFlowScenario = z.infer<typeof CashFlowScenarioEnum>;
export type HoldingCashFlow = z.infer<typeof HoldingCashFlowSchema>;
export type CreateHoldingCashFlow = z.infer<typeof CreateHoldingCashFlowSchema>;
export type UpdateHoldingCashFlow = z.infer<typeof UpdateHoldingCashFlowSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single holding cash flow
 * Backend equivalent: class HoldingCashFlowResponse(BaseModel)
 */
export type HoldingCashFlowResponse = {
  success: boolean;
  data?: HoldingCashFlow;
  error?: string;
};

/**
 * Response containing multiple holding cash flows
 * Backend equivalent: class HoldingCashFlowsResponse(BaseModel)
 */
export type HoldingCashFlowsResponse = {
  success: boolean;
  data?: HoldingCashFlow[];
  error?: string;
};
