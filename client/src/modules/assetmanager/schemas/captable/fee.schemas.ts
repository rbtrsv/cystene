/**
 * Fee Schemas
 *
 * Zod validation schemas for Fee model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/captable_models.py
 * - Schema: /server/apps/assetmanager/schemas/captable_schemas/fee_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/captable_subrouters/fee_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Fee type options - matches backend FeeType enum
 * Backend: class FeeType(str, Enum)
 */
export const FeeTypeEnum = z.enum([
  'management',
  'performance',
  'setup',
  'administrative',
  'other',
]);

/**
 * Frequency options - matches backend Frequency enum
 * Backend: class Frequency(str, Enum)
 */
export const FrequencyEnum = z.enum([
  'one_time',
  'monthly',
  'quarterly',
  'annual',
]);

/**
 * Scenario options - matches backend Scenario enum
 * Backend: class Scenario(str, Enum)
 */
export const ScenarioEnum = z.enum([
  'actual',
  'forecast',
  'budget',
]);

/**
 * Quarter options - matches backend Quarter enum
 * Backend: class Quarter(str, Enum)
 */
export const QuarterEnum = z.enum([
  'Q1',
  'Q2',
  'Q3',
  'Q4',
]);

/**
 * Semester options - matches backend Semester enum
 * Backend: class Semester(str, Enum)
 */
export const SemesterEnum = z.enum([
  'S1',
  'S2',
]);

// ==========================================
// Fee Schema (Full Representation)
// ==========================================

/**
 * Fee schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class Fee(BaseModel)
 */
export const FeeSchema = z.object({
  id: z.number(),
  entity_id: z.number(),
  funding_round_id: z.number().nullable(),

  // Time dimensions
  year: z.number(),
  quarter: QuarterEnum.nullable(),
  semester: SemesterEnum.nullable(),
  month: z.string().nullable(),
  full_year: z.boolean(),
  scenario: ScenarioEnum,

  // Period dimension
  date: z.string().nullable(), // ISO date string from backend

  // Fee details
  fee_type: FeeTypeEnum,
  fee_cost_name: z.string().nullable(),
  frequency: FrequencyEnum,
  amount: z.number().nullable(),
  percentage: z.number().nullable(),
  description: z.string().nullable(),
  transaction_reference: z.string().nullable(),

  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new fee (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class FeeCreate(BaseModel)
 */
export const CreateFeeSchema = z.object({
  entity_id: z.number(),
  funding_round_id: z.number().nullable().optional(),

  // Time dimensions
  year: z.number().min(1900, 'Year must be valid'),
  quarter: QuarterEnum.nullable().optional(),
  semester: SemesterEnum.nullable().optional(),
  month: z.string().nullable().optional(),
  full_year: z.boolean().default(false),
  scenario: ScenarioEnum.default('actual'),

  // Period dimension
  date: z.string().nullable().optional(), // ISO date string

  // Fee details
  fee_type: FeeTypeEnum,
  fee_cost_name: z.string().nullable().optional(),
  frequency: FrequencyEnum.default('one_time'),
  amount: z.number().nullable().optional(),
  percentage: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  transaction_reference: z.string().nullable().optional(),
});

/**
 * Schema for updating a fee (PUT)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class FeeUpdate(BaseModel)
 */
export const UpdateFeeSchema = z.object({
  entity_id: z.number().optional(),
  funding_round_id: z.number().nullable().optional(),

  // Time dimensions
  year: z.number().min(1900, 'Year must be valid').optional(),
  quarter: QuarterEnum.nullable().optional(),
  semester: SemesterEnum.nullable().optional(),
  month: z.string().nullable().optional(),
  full_year: z.boolean().optional(),
  scenario: ScenarioEnum.optional(),

  // Period dimension
  date: z.string().nullable().optional(),

  // Fee details
  fee_type: FeeTypeEnum.optional(),
  fee_cost_name: z.string().nullable().optional(),
  frequency: FrequencyEnum.optional(),
  amount: z.number().nullable().optional(),
  percentage: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  transaction_reference: z.string().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type FeeType = z.infer<typeof FeeTypeEnum>;
export type Frequency = z.infer<typeof FrequencyEnum>;
export type Scenario = z.infer<typeof ScenarioEnum>;
export type Quarter = z.infer<typeof QuarterEnum>;
export type Semester = z.infer<typeof SemesterEnum>;
export type Fee = z.infer<typeof FeeSchema>;
export type CreateFee = z.infer<typeof CreateFeeSchema>;
export type UpdateFee = z.infer<typeof UpdateFeeSchema>;

// ==========================================
// Label Helpers
// ==========================================

/** Human-readable labels for fee types */
export const FEE_TYPE_LABELS: Record<FeeType, string> = {
  management: 'Management',
  performance: 'Performance',
  setup: 'Setup',
  administrative: 'Administrative',
  other: 'Other',
};

/**
 * Get human-readable label for a fee type
 * @param type Fee type enum value
 * @returns Display label string
 */
export const getFeeTypeLabel = (type: string): string => {
  return FEE_TYPE_LABELS[type as FeeType] || type;
};

/** Human-readable labels for fee frequencies */
export const FREQUENCY_LABELS: Record<Frequency, string> = {
  one_time: 'One-time',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
};

/**
 * Get human-readable label for a frequency
 * @param frequency Frequency enum value
 * @returns Display label string
 */
export const getFrequencyLabel = (frequency: string): string => {
  return FREQUENCY_LABELS[frequency as Frequency] || frequency;
};

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single fee
 * Backend equivalent: class FeeResponse(BaseModel)
 */
export type FeeResponse = {
  success: boolean;
  data?: Fee;
  error?: string;
};

/**
 * Response containing multiple fees
 * Backend equivalent: class FeesResponse(BaseModel)
 */
export type FeesResponse = {
  success: boolean;
  data?: Fee[];
  error?: string;
};
