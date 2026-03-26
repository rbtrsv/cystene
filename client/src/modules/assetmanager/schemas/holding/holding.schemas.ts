/**
 * Holding Schemas
 *
 * Zod validation schemas for Holding model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/holding_models.py
 * - Schema: /server/apps/assetmanager/schemas/holding_schemas/holding_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/holding_subrouters/holding_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Investment status options - matches backend InvestmentStatus enum
 * Backend: class InvestmentStatus(str, Enum)
 */
export const InvestmentStatusEnum = z.enum([
  'active',
  'exited',
  'written_off',
]);

/**
 * Listing status options - matches backend ListingStatus enum
 * Backend: class ListingStatus(str, Enum)
 */
export const ListingStatusEnum = z.enum([
  'private',
  'public',
]);

// ==========================================
// Holding Schema (Full Representation)
// ==========================================

/**
 * Holding schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class Holding(BaseModel)
 */
export const HoldingSchema = z.object({
  id: z.number(),
  entity_id: z.number(),
  target_entity_id: z.number().nullable(),
  company_name: z.string().nullable(),
  funding_round_id: z.number().nullable(),

  // Investment Details
  investment_name: z.string(),
  entity_type: z.string(),
  investment_type: z.string(),
  investment_round: z.string().nullable(),
  investment_status: z.string(),
  sector: z.string(),
  listing_status: z.string(),
  original_investment_date: z.string().nullable(),

  // Financial Details
  total_investment_amount: z.number().nullable(),
  ownership_percentage: z.number().nullable(),
  invested_as_percent_capital: z.number().nullable(),

  // Share Details
  number_of_shares: z.number().nullable(),
  average_cost_per_share: z.number().nullable(),
  current_share_price: z.number().nullable(),
  share_price_updated_at: z.string().nullable(), // ISO datetime string from backend

  // Exchange Details
  stock_ticker: z.string().nullable(),
  exchange: z.string().nullable(),

  // Valuation & Performance
  current_fair_value: z.number().nullable(),
  moic: z.number().nullable(),
  irr: z.number().nullable(),

  // Export
  export_functionality: z.boolean(),

  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(), // ISO datetime string from backend
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new holding (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class HoldingCreate(BaseModel)
 */
export const CreateHoldingSchema = z.object({
  entity_id: z.number(),
  investment_name: z.string(),
  entity_type: z.string(),
  investment_type: z.string(),
  sector: z.string(),
  investment_status: InvestmentStatusEnum.default('active'),
  listing_status: ListingStatusEnum.default('private'),
  export_functionality: z.boolean().optional(),
  target_entity_id: z.number().nullable().optional(),
  company_name: z.string().nullable().optional(),
  funding_round_id: z.number().nullable().optional(),
  investment_round: z.string().nullable().optional(),
  original_investment_date: z.string().nullable().optional(),

  // Financial Details
  total_investment_amount: z.number().nullable().optional(),
  ownership_percentage: z.number().nullable().optional(),
  invested_as_percent_capital: z.number().nullable().optional(),

  // Share Details
  number_of_shares: z.number().nullable().optional(),
  average_cost_per_share: z.number().nullable().optional(),
  current_share_price: z.number().nullable().optional(),
  share_price_updated_at: z.string().nullable().optional(),

  // Exchange Details
  stock_ticker: z.string().nullable().optional(),
  exchange: z.string().nullable().optional(),

  // Valuation & Performance
  current_fair_value: z.number().nullable().optional(),
  moic: z.number().nullable().optional(),
  irr: z.number().nullable().optional(),
});

/**
 * Schema for updating a holding (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class HoldingUpdate(BaseModel)
 */
export const UpdateHoldingSchema = z.object({
  entity_id: z.number().nullable().optional(),
  target_entity_id: z.number().nullable().optional(),
  company_name: z.string().nullable().optional(),
  funding_round_id: z.number().nullable().optional(),

  // Investment Details
  investment_name: z.string().nullable().optional(),
  entity_type: z.string().nullable().optional(),
  investment_type: z.string().nullable().optional(),
  investment_round: z.string().nullable().optional(),
  investment_status: InvestmentStatusEnum.nullable().optional(),
  sector: z.string().nullable().optional(),
  listing_status: ListingStatusEnum.nullable().optional(),
  original_investment_date: z.string().nullable().optional(),

  // Financial Details
  total_investment_amount: z.number().nullable().optional(),
  ownership_percentage: z.number().nullable().optional(),
  invested_as_percent_capital: z.number().nullable().optional(),

  // Share Details
  number_of_shares: z.number().nullable().optional(),
  average_cost_per_share: z.number().nullable().optional(),
  current_share_price: z.number().nullable().optional(),
  share_price_updated_at: z.string().nullable().optional(),

  // Exchange Details
  stock_ticker: z.string().nullable().optional(),
  exchange: z.string().nullable().optional(),

  // Valuation & Performance
  current_fair_value: z.number().nullable().optional(),
  moic: z.number().nullable().optional(),
  irr: z.number().nullable().optional(),

  // Export
  export_functionality: z.boolean().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type InvestmentStatus = z.infer<typeof InvestmentStatusEnum>;
export type ListingStatus = z.infer<typeof ListingStatusEnum>;
export type Holding = z.infer<typeof HoldingSchema>;
export type CreateHolding = z.infer<typeof CreateHoldingSchema>;
export type UpdateHolding = z.infer<typeof UpdateHoldingSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single holding
 * Backend equivalent: class HoldingResponse(BaseModel)
 */
export type HoldingResponse = {
  success: boolean;
  data?: Holding;
  error?: string;
};

/**
 * Response containing multiple holdings
 * Backend equivalent: class HoldingsResponse(BaseModel)
 */
export type HoldingsResponse = {
  success: boolean;
  data?: Holding[];
  error?: string;
};
