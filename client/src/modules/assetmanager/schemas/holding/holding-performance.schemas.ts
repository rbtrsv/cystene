/**
 * Holding Performance Schemas
 *
 * Zod validation schemas for HoldingPerformance model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/holding_models.py
 * - Schema: /server/apps/assetmanager/schemas/holding_schemas/holding_performance_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/holding_subrouters/holding_performance_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// HoldingPerformance Schema (Full Representation)
// ==========================================

/**
 * HoldingPerformance schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class HoldingPerformance(BaseModel)
 */
export const HoldingPerformanceSchema = z.object({
  id: z.number(),
  entity_id: z.number(),
  funding_round_id: z.number().nullable(),
  report_date: z.string(),

  // Performance Metrics
  total_invested_amount: z.number().nullable(),
  fair_value: z.number().nullable(),
  cash_realized: z.number().nullable(),
  tvpi: z.number().nullable(),
  dpi: z.number().nullable(),
  rvpi: z.number().nullable(),
  irr: z.number().nullable(),
  multiple_to_cost: z.number().nullable(),

  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(), // ISO datetime string from backend
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new holding performance record (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class HoldingPerformanceCreate(BaseModel)
 */
export const CreateHoldingPerformanceSchema = z.object({
  entity_id: z.number(),
  funding_round_id: z.number().nullable().optional(),
  report_date: z.string().nullable().optional(),

  // Performance Metrics
  total_invested_amount: z.number().nullable().optional(),
  fair_value: z.number().nullable().optional(),
  cash_realized: z.number().nullable().optional(),
  tvpi: z.number().nullable().optional(),
  dpi: z.number().nullable().optional(),
  rvpi: z.number().nullable().optional(),
  irr: z.number().nullable().optional(),
  multiple_to_cost: z.number().nullable().optional(),
});

/**
 * Schema for updating a holding performance record (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class HoldingPerformanceUpdate(BaseModel)
 */
export const UpdateHoldingPerformanceSchema = z.object({
  entity_id: z.number().nullable().optional(),
  funding_round_id: z.number().nullable().optional(),
  report_date: z.string().nullable().optional(),

  // Performance Metrics
  total_invested_amount: z.number().nullable().optional(),
  fair_value: z.number().nullable().optional(),
  cash_realized: z.number().nullable().optional(),
  tvpi: z.number().nullable().optional(),
  dpi: z.number().nullable().optional(),
  rvpi: z.number().nullable().optional(),
  irr: z.number().nullable().optional(),
  multiple_to_cost: z.number().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type HoldingPerformance = z.infer<typeof HoldingPerformanceSchema>;
export type CreateHoldingPerformance = z.infer<typeof CreateHoldingPerformanceSchema>;
export type UpdateHoldingPerformance = z.infer<typeof UpdateHoldingPerformanceSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single holding performance record
 * Backend equivalent: class HoldingPerformanceResponse(BaseModel)
 */
export type HoldingPerformanceResponse = {
  success: boolean;
  data?: HoldingPerformance;
  error?: string;
};

/**
 * Response containing multiple holding performance records
 * Backend equivalent: class HoldingPerformancesResponse(BaseModel)
 */
export type HoldingPerformancesResponse = {
  success: boolean;
  data?: HoldingPerformance[];
  error?: string;
};
