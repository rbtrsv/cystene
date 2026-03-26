/**
 * KPI Schemas
 *
 * Zod validation schemas for KPI model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/financial_models.py
 * - Schema: /server/apps/assetmanager/schemas/financial_schemas/kpi_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/financial_subrouters/kpi_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// KPI Schema (Full Representation)
// ==========================================

/**
 * KPI schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class KPI(BaseModel)
 */
export const KPISchema = z.object({
  id: z.number(),
  entity_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  data_type: z.string(),
  is_calculated: z.boolean(),
  formula: z.string().nullable(),
  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(), // ISO datetime string from backend
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new KPI (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class KPICreate(BaseModel)
 */
export const CreateKPISchema = z.object({
  entity_id: z.number(),
  name: z.string(),
  data_type: z.string().optional(),
  is_calculated: z.boolean().optional(),
  description: z.string().nullable().optional(),
  formula: z.string().nullable().optional(),
});

/**
 * Schema for updating a KPI (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class KPIUpdate(BaseModel)
 */
export const UpdateKPISchema = z.object({
  entity_id: z.number().nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  data_type: z.string().nullable().optional(),
  is_calculated: z.boolean().nullable().optional(),
  formula: z.string().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type KPI = z.infer<typeof KPISchema>;
export type CreateKPI = z.infer<typeof CreateKPISchema>;
export type UpdateKPI = z.infer<typeof UpdateKPISchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single KPI
 * Backend equivalent: class KPIResponse(BaseModel)
 */
export type KPIResponse = {
  success: boolean;
  data?: KPI;
  error?: string;
};

/**
 * Response containing multiple KPIs
 * Backend equivalent: class KPIsResponse(BaseModel)
 */
export type KPIsResponse = {
  success: boolean;
  data?: KPI[];
  error?: string;
};
