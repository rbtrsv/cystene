/**
 * FundingRound Schemas
 *
 * Zod validation schemas for FundingRound model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/captable_models.py
 * - Schema: /server/apps/assetmanager/schemas/captable_schemas/funding_round_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/captable_subrouters/funding_round_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Funding round type options - matches backend RoundType enum
 * Backend: class RoundType(str, Enum)
 */
export const RoundTypeEnum = z.enum([
  'seed',
  'pre_series_a',
  'series_a',
  'series_b',
  'series_c',
  'series_d',
  'debt',
  'convertible',
  'safe',
  'bridge',
  'secondary',
  'other',
]);

// ==========================================
// FundingRound Schema (Full Representation)
// ==========================================

/**
 * FundingRound schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class FundingRound(BaseModel)
 */
export const FundingRoundSchema = z.object({
  id: z.number(),
  entity_id: z.number(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  round_type: RoundTypeEnum,
  date: z.string(), // ISO date string from backend
  target_amount: z.number(),
  raised_amount: z.number().default(0),
  pre_money_valuation: z.number().nullable(),
  post_money_valuation: z.number().nullable(),
  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new funding round (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class FundingRoundCreate(BaseModel)
 */
export const CreateFundingRoundSchema = z.object({
  entity_id: z.number(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  round_type: RoundTypeEnum,
  date: z.string().min(1, 'Date is required'), // ISO date string
  target_amount: z.number().min(0, 'Target amount must be positive'),
  raised_amount: z.number().min(0, 'Raised amount must be positive').default(0),
  pre_money_valuation: z.number().nullable().optional(),
  post_money_valuation: z.number().nullable().optional(),
});

/**
 * Schema for updating a funding round (PUT)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class FundingRoundUpdate(BaseModel)
 */
export const UpdateFundingRoundSchema = z.object({
  entity_id: z.number().optional(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters').optional(),
  round_type: RoundTypeEnum.optional(),
  date: z.string().optional(),
  target_amount: z.number().min(0, 'Target amount must be positive').optional(),
  raised_amount: z.number().min(0, 'Raised amount must be positive').optional(),
  pre_money_valuation: z.number().nullable().optional(),
  post_money_valuation: z.number().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type RoundType = z.infer<typeof RoundTypeEnum>;
export type FundingRound = z.infer<typeof FundingRoundSchema>;
export type CreateFundingRound = z.infer<typeof CreateFundingRoundSchema>;
export type UpdateFundingRound = z.infer<typeof UpdateFundingRoundSchema>;

// ==========================================
// Label Helpers
// ==========================================

/** Human-readable labels for round types */
export const ROUND_TYPE_LABELS: Record<RoundType, string> = {
  seed: 'Seed',
  pre_series_a: 'Pre-Series A',
  series_a: 'Series A',
  series_b: 'Series B',
  series_c: 'Series C',
  series_d: 'Series D',
  debt: 'Debt',
  convertible: 'Convertible',
  safe: 'SAFE',
  bridge: 'Bridge',
  secondary: 'Secondary',
  other: 'Other',
};

/**
 * Get human-readable label for a round type
 * @param type Round type enum value
 * @returns Display label string
 */
export const getRoundTypeLabel = (type: string): string => {
  return ROUND_TYPE_LABELS[type as RoundType] || type;
};

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single funding round
 * Backend equivalent: class FundingRoundResponse(BaseModel)
 */
export type FundingRoundResponse = {
  success: boolean;
  data?: FundingRound;
  error?: string;
};

/**
 * Response containing multiple funding rounds
 * Backend equivalent: class FundingRoundsResponse(BaseModel)
 */
export type FundingRoundsResponse = {
  success: boolean;
  data?: FundingRound[];
  error?: string;
};
