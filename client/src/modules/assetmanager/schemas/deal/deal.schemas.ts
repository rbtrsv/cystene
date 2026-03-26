/**
 * Deal Schemas
 *
 * Zod validation schemas for Deal model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/deal_models.py
 * - Schema: /server/apps/assetmanager/schemas/deal_schemas/deal_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/deal_subrouters/deal_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Deal type options - matches backend DealType enum
 * Backend: class DealType(str, Enum)
 */
export const DealTypeEnum = z.enum([
  'fundraising',
  'acquisition',
  'secondary',
  'debt',
]);

// ==========================================
// Deal Schema (Full Representation)
// ==========================================

/**
 * Deal schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class Deal(BaseModel)
 */
export const DealSchema = z.object({
  id: z.number(),
  entity_id: z.number(),
  name: z.string(),
  deal_type: DealTypeEnum,

  // Financial Terms
  pre_money_valuation: z.number().nullable(),
  post_money_valuation: z.number().nullable(),
  target_amount: z.number().nullable(),
  minimum_investment: z.number().nullable(),
  share_price: z.number().nullable(),
  share_allocation: z.number().nullable(),
  dilution: z.number().nullable(),

  // Rights & Governance
  liquidation_preference: z.number().nullable(),
  dividend_rights: z.string().nullable(),
  anti_dilution: z.string().nullable(),
  pro_rata_rights: z.boolean(),
  board_seats: z.number(),
  veto_rights: z.string().nullable(),

  // Dates
  start_date: z.string(),
  end_date: z.string(),
  expected_close_date: z.string().nullable(),

  // Status & Progress
  soft_commitments: z.number(),
  firm_commitments: z.number(),
  profile_views: z.number(),
  due_diligence_status: z.string().nullable(),

  // Documents
  pitch_deck: z.string().nullable(),
  financial_model: z.string().nullable(),
  data_room_link: z.string().nullable(),
  term_sheet: z.string().nullable(),
  shareholders_agreement: z.string().nullable(),

  // Additional Info
  investment_highlights: z.string().nullable(),
  use_of_funds: z.string().nullable(),

  // Secondary Details
  seller_id: z.number().nullable(),
  shares_offered: z.number().nullable(),

  // Debt Details
  interest_rate: z.number().nullable(),
  term_length: z.number().nullable(),
  collateral: z.string().nullable(),

  // M&A Details
  acquisition_price: z.number().nullable(),
  payment_structure: z.string().nullable(),
  deal_structure: z.string().nullable(),

  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(), // ISO datetime string from backend
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new deal (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class DealCreate(BaseModel)
 */
export const CreateDealSchema = z.object({
  entity_id: z.number(),
  name: z.string().min(1).max(255),
  deal_type: DealTypeEnum.default('fundraising'),

  // Financial Terms
  pre_money_valuation: z.number().nullable().optional(),
  post_money_valuation: z.number().nullable().optional(),
  target_amount: z.number().nullable().optional(),
  minimum_investment: z.number().nullable().optional(),
  share_price: z.number().nullable().optional(),
  share_allocation: z.number().nullable().optional(),
  dilution: z.number().nullable().optional(),

  // Rights & Governance
  liquidation_preference: z.number().nullable().optional(),
  dividend_rights: z.string().max(100).nullable().optional(),
  anti_dilution: z.string().max(100).nullable().optional(),
  pro_rata_rights: z.boolean().default(false),
  board_seats: z.number().default(0),
  veto_rights: z.string().nullable().optional(),

  // Dates
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  expected_close_date: z.string().nullable().optional(),

  // Status & Progress
  soft_commitments: z.number().default(0),
  firm_commitments: z.number().default(0),
  profile_views: z.number().default(0),
  due_diligence_status: z.string().max(50).nullable().optional(),

  // Documents
  pitch_deck: z.string().max(255).nullable().optional(),
  financial_model: z.string().max(255).nullable().optional(),
  data_room_link: z.string().max(255).nullable().optional(),
  term_sheet: z.string().max(255).nullable().optional(),
  shareholders_agreement: z.string().max(255).nullable().optional(),

  // Additional Info
  investment_highlights: z.string().nullable().optional(),
  use_of_funds: z.string().nullable().optional(),

  // Secondary Details
  seller_id: z.number().nullable().optional(),
  shares_offered: z.number().nullable().optional(),

  // Debt Details
  interest_rate: z.number().nullable().optional(),
  term_length: z.number().nullable().optional(),
  collateral: z.string().nullable().optional(),

  // M&A Details
  acquisition_price: z.number().nullable().optional(),
  payment_structure: z.string().nullable().optional(),
  deal_structure: z.string().nullable().optional(),
});

/**
 * Schema for updating a deal (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class DealUpdate(BaseModel)
 */
export const UpdateDealSchema = z.object({
  entity_id: z.number().optional(),
  name: z.string().min(1).max(255).optional(),
  deal_type: DealTypeEnum.optional(),

  // Financial Terms
  pre_money_valuation: z.number().nullable().optional(),
  post_money_valuation: z.number().nullable().optional(),
  target_amount: z.number().nullable().optional(),
  minimum_investment: z.number().nullable().optional(),
  share_price: z.number().nullable().optional(),
  share_allocation: z.number().nullable().optional(),
  dilution: z.number().nullable().optional(),

  // Rights & Governance
  liquidation_preference: z.number().nullable().optional(),
  dividend_rights: z.string().max(100).nullable().optional(),
  anti_dilution: z.string().max(100).nullable().optional(),
  pro_rata_rights: z.boolean().optional(),
  board_seats: z.number().optional(),
  veto_rights: z.string().nullable().optional(),

  // Dates
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  expected_close_date: z.string().nullable().optional(),

  // Status & Progress
  soft_commitments: z.number().optional(),
  firm_commitments: z.number().optional(),
  profile_views: z.number().optional(),
  due_diligence_status: z.string().max(50).nullable().optional(),

  // Documents
  pitch_deck: z.string().max(255).nullable().optional(),
  financial_model: z.string().max(255).nullable().optional(),
  data_room_link: z.string().max(255).nullable().optional(),
  term_sheet: z.string().max(255).nullable().optional(),
  shareholders_agreement: z.string().max(255).nullable().optional(),

  // Additional Info
  investment_highlights: z.string().nullable().optional(),
  use_of_funds: z.string().nullable().optional(),

  // Secondary Details
  seller_id: z.number().nullable().optional(),
  shares_offered: z.number().nullable().optional(),

  // Debt Details
  interest_rate: z.number().nullable().optional(),
  term_length: z.number().nullable().optional(),
  collateral: z.string().nullable().optional(),

  // M&A Details
  acquisition_price: z.number().nullable().optional(),
  payment_structure: z.string().nullable().optional(),
  deal_structure: z.string().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type DealType = z.infer<typeof DealTypeEnum>;
export type Deal = z.infer<typeof DealSchema>;
export type CreateDeal = z.infer<typeof CreateDealSchema>;
export type UpdateDeal = z.infer<typeof UpdateDealSchema>;

// ==========================================
// Label Helpers
// ==========================================

/** Human-readable labels for deal types */
export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  fundraising: 'Fundraising',
  acquisition: 'Acquisition',
  secondary: 'Secondary',
  debt: 'Debt',
};

/**
 * Get human-readable label for a deal type
 * @param type Deal type enum value
 * @returns Display label string
 */
export const getDealTypeLabel = (type: string): string => {
  return DEAL_TYPE_LABELS[type as DealType] || type;
};

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single deal
 * Backend equivalent: class DealResponse(BaseModel)
 */
export type DealResponse = {
  success: boolean;
  data?: Deal;
  error?: string;
};

/**
 * Response containing multiple deals
 * Backend equivalent: class DealsResponse(BaseModel)
 */
export type DealsResponse = {
  success: boolean;
  data?: Deal[];
  error?: string;
};
