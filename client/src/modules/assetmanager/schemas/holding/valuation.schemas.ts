/**
 * Valuation Schemas
 *
 * Zod validation schemas for Valuation model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/holding_models.py
 * - Schema: /server/apps/assetmanager/schemas/holding_schemas/valuation_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/holding_subrouters/valuation_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Valuation Schema (Full Representation)
// ==========================================

/**
 * Valuation schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class Valuation(BaseModel)
 */
export const ValuationSchema = z.object({
  id: z.number(),
  entity_id: z.number(),
  funding_round_id: z.number().nullable(),
  date: z.string(),
  valuation_value: z.number(),

  // Fund-specific fields (nullable — only fund-type entities use these)
  total_fund_units: z.number().nullable(),
  nav_per_share: z.number().nullable(),

  notes: z.string().nullable(),
  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(), // ISO datetime string from backend
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new valuation (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class ValuationCreate(BaseModel)
 */
export const CreateValuationSchema = z.object({
  entity_id: z.number(),
  valuation_value: z.number(),
  funding_round_id: z.number().nullable().optional(),
  date: z.string().nullable().optional(),

  // Fund-specific fields (nullable — only fund-type entities use these)
  total_fund_units: z.number().nullable().optional(),
  nav_per_share: z.number().nullable().optional(),

  notes: z.string().nullable().optional(),
});

/**
 * Schema for updating a valuation (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class ValuationUpdate(BaseModel)
 */
export const UpdateValuationSchema = z.object({
  entity_id: z.number().nullable().optional(),
  funding_round_id: z.number().nullable().optional(),
  date: z.string().nullable().optional(),
  valuation_value: z.number().nullable().optional(),

  // Fund-specific fields (nullable — only fund-type entities use these)
  total_fund_units: z.number().nullable().optional(),
  nav_per_share: z.number().nullable().optional(),

  notes: z.string().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type Valuation = z.infer<typeof ValuationSchema>;
export type CreateValuation = z.infer<typeof CreateValuationSchema>;
export type UpdateValuation = z.infer<typeof UpdateValuationSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single valuation
 * Backend equivalent: class ValuationResponse(BaseModel)
 */
export type ValuationResponse = {
  success: boolean;
  data?: Valuation;
  error?: string;
};

/**
 * Response containing multiple valuations
 * Backend equivalent: class ValuationsResponse(BaseModel)
 */
export type ValuationsResponse = {
  success: boolean;
  data?: Valuation[];
  error?: string;
};
