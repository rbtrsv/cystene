/**
 * KPI Value Schemas
 *
 * Zod validation schemas for KPIValue model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/financial_models.py
 * - Schema: /server/apps/assetmanager/schemas/financial_schemas/kpi_value_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/financial_subrouters/kpi_value_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// KPIValue Schema (Full Representation)
// ==========================================

/**
 * KPIValue schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class KPIValue(BaseModel)
 */
export const KPIValueSchema = z.object({
  id: z.number(),
  kpi_id: z.number(),

  // Time Dimensions
  year: z.number(),
  quarter: z.string().nullable(),
  semester: z.string().nullable(),
  month: z.string().nullable(),
  full_year: z.boolean(),
  scenario: z.string(),
  date: z.string().nullable(),

  // Value
  value: z.number().nullable(),
  notes: z.string().nullable(),

  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(), // ISO datetime string from backend
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new KPI value (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class KPIValueCreate(BaseModel)
 */
export const CreateKPIValueSchema = z.object({
  kpi_id: z.number(),
  year: z.number(),
  full_year: z.boolean().optional(),
  scenario: z.string().optional(),
  quarter: z.string().nullable().optional(),
  semester: z.string().nullable().optional(),
  month: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  value: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

/**
 * Schema for updating a KPI value (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class KPIValueUpdate(BaseModel)
 */
export const UpdateKPIValueSchema = z.object({
  kpi_id: z.number().nullable().optional(),

  // Time Dimensions
  year: z.number().nullable().optional(),
  quarter: z.string().nullable().optional(),
  semester: z.string().nullable().optional(),
  month: z.string().nullable().optional(),
  full_year: z.boolean().nullable().optional(),
  scenario: z.string().nullable().optional(),
  date: z.string().nullable().optional(),

  // Value
  value: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type KPIValue = z.infer<typeof KPIValueSchema>;
export type CreateKPIValue = z.infer<typeof CreateKPIValueSchema>;
export type UpdateKPIValue = z.infer<typeof UpdateKPIValueSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single KPI value
 * Backend equivalent: class KPIValueResponse(BaseModel)
 */
export type KPIValueResponse = {
  success: boolean;
  data?: KPIValue;
  error?: string;
};

/**
 * Response containing multiple KPI values
 * Backend equivalent: class KPIValuesResponse(BaseModel)
 */
export type KPIValuesResponse = {
  success: boolean;
  data?: KPIValue[];
  error?: string;
};
