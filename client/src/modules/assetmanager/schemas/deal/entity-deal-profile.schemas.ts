/**
 * Entity Deal Profile Schemas
 *
 * Zod validation schemas for EntityDealProfile model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/deal_models.py
 * - Schema: /server/apps/assetmanager/schemas/deal_schemas/entity_deal_profile_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/deal_subrouters/entity_deal_profile_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Entity deal profile type options - matches backend EntityDealType enum
 * Backend: class EntityDealType(str, Enum)
 */
export const EntityProfileTypeEnum = z.enum([
  'company',
  'fund',
  'target',
  'individual',
]);

// ==========================================
// EntityDealProfile Schema (Full Representation)
// ==========================================

/**
 * EntityDealProfile schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class EntityDealProfile(BaseModel)
 */
export const EntityDealProfileSchema = z.object({
  id: z.number(),
  entity_id: z.number(),
  entity_type: EntityProfileTypeEnum,

  // Basic Info
  industry: z.string(),
  location: z.string(),
  website: z.string().nullable(),
  year_founded: z.number().nullable(),

  // Financial Overview
  current_valuation: z.number().nullable(),
  latest_raise_amount: z.number().nullable(),
  total_raised: z.number().nullable(),

  // Company-specific fields
  stage: z.string().nullable(),
  short_description: z.string(),
  problem_description: z.string(),
  solution_description: z.string(),
  how_it_works: z.string(),
  market_size: z.number().nullable(),
  competitors: z.string().nullable(),
  competitive_advantage: z.string().nullable(),
  growth_metrics: z.string().nullable(),

  // Fund-specific fields
  investment_strategy: z.string().nullable(),
  fund_size: z.number().nullable(),
  fund_terms: z.string().nullable(),
  track_record: z.string().nullable(),
  fund_type: z.string().nullable(),
  investment_focus: z.string().nullable(),
  fund_lifecycle: z.string().nullable(),
  vintage_year: z.number().nullable(),

  // M&A-specific fields
  synergy_potential: z.string().nullable(),
  key_assets: z.string().nullable(),
  market_position: z.string().nullable(),
  integration_plan: z.string().nullable(),
  acquisition_rationale: z.string().nullable(),
  financial_metrics: z.string().nullable(),
  risk_factors: z.string().nullable(),
  deal_readiness: z.string().nullable(),

  // Team & Relationships (JSON)
  team_members: z.any().nullable(),
  relationships: z.any().nullable(),

  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(), // ISO datetime string from backend
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new entity deal profile (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class EntityDealProfileCreate(BaseModel)
 */
export const CreateEntityDealProfileSchema = z.object({
  entity_id: z.number(),
  entity_type: EntityProfileTypeEnum.default('company'),

  // Basic Info (required)
  industry: z.string().min(1, 'Industry is required').max(100),
  location: z.string().min(1, 'Location is required').max(2),
  website: z.string().max(255).nullable().optional(),
  year_founded: z.number().nullable().optional(),

  // Financial Overview
  current_valuation: z.number().nullable().optional(),
  latest_raise_amount: z.number().nullable().optional(),
  total_raised: z.number().nullable().optional(),

  // Company-specific fields (required)
  stage: z.string().max(50).nullable().optional(),
  short_description: z.string().min(1, 'Short description is required'),
  problem_description: z.string().min(1, 'Problem description is required'),
  solution_description: z.string().min(1, 'Solution description is required'),
  how_it_works: z.string().min(1, 'How it works is required'),
  market_size: z.number().nullable().optional(),
  competitors: z.string().nullable().optional(),
  competitive_advantage: z.string().nullable().optional(),
  growth_metrics: z.string().nullable().optional(),

  // Fund-specific fields
  investment_strategy: z.string().nullable().optional(),
  fund_size: z.number().nullable().optional(),
  fund_terms: z.string().nullable().optional(),
  track_record: z.string().nullable().optional(),
  fund_type: z.string().max(50).nullable().optional(),
  investment_focus: z.string().nullable().optional(),
  fund_lifecycle: z.string().max(50).nullable().optional(),
  vintage_year: z.number().nullable().optional(),

  // M&A-specific fields
  synergy_potential: z.string().nullable().optional(),
  key_assets: z.string().nullable().optional(),
  market_position: z.string().nullable().optional(),
  integration_plan: z.string().nullable().optional(),
  acquisition_rationale: z.string().nullable().optional(),
  financial_metrics: z.string().nullable().optional(),
  risk_factors: z.string().nullable().optional(),
  deal_readiness: z.string().max(50).nullable().optional(),

  // Team & Relationships (JSON)
  team_members: z.any().nullable().optional(),
  relationships: z.any().nullable().optional(),
});

/**
 * Schema for updating an entity deal profile (PUT)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class EntityDealProfileUpdate(BaseModel)
 */
export const UpdateEntityDealProfileSchema = z.object({
  entity_id: z.number().optional(),
  entity_type: EntityProfileTypeEnum.optional(),

  // Basic Info
  industry: z.string().max(100).optional(),
  location: z.string().max(2).optional(),
  website: z.string().max(255).nullable().optional(),
  year_founded: z.number().nullable().optional(),

  // Financial Overview
  current_valuation: z.number().nullable().optional(),
  latest_raise_amount: z.number().nullable().optional(),
  total_raised: z.number().nullable().optional(),

  // Company-specific fields
  stage: z.string().max(50).nullable().optional(),
  short_description: z.string().optional(),
  problem_description: z.string().optional(),
  solution_description: z.string().optional(),
  how_it_works: z.string().optional(),
  market_size: z.number().nullable().optional(),
  competitors: z.string().nullable().optional(),
  competitive_advantage: z.string().nullable().optional(),
  growth_metrics: z.string().nullable().optional(),

  // Fund-specific fields
  investment_strategy: z.string().nullable().optional(),
  fund_size: z.number().nullable().optional(),
  fund_terms: z.string().nullable().optional(),
  track_record: z.string().nullable().optional(),
  fund_type: z.string().max(50).nullable().optional(),
  investment_focus: z.string().nullable().optional(),
  fund_lifecycle: z.string().max(50).nullable().optional(),
  vintage_year: z.number().nullable().optional(),

  // M&A-specific fields
  synergy_potential: z.string().nullable().optional(),
  key_assets: z.string().nullable().optional(),
  market_position: z.string().nullable().optional(),
  integration_plan: z.string().nullable().optional(),
  acquisition_rationale: z.string().nullable().optional(),
  financial_metrics: z.string().nullable().optional(),
  risk_factors: z.string().nullable().optional(),
  deal_readiness: z.string().max(50).nullable().optional(),

  // Team & Relationships (JSON)
  team_members: z.any().nullable().optional(),
  relationships: z.any().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type EntityProfileType = z.infer<typeof EntityProfileTypeEnum>;
export type EntityDealProfile = z.infer<typeof EntityDealProfileSchema>;
export type CreateEntityDealProfile = z.infer<typeof CreateEntityDealProfileSchema>;
export type UpdateEntityDealProfile = z.infer<typeof UpdateEntityDealProfileSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single entity deal profile
 * Backend equivalent: class EntityDealProfileResponse(BaseModel)
 */
export type EntityDealProfileResponse = {
  success: boolean;
  data?: EntityDealProfile;
  error?: string;
};

/**
 * Response containing multiple entity deal profiles
 * Backend equivalent: class EntityDealProfilesResponse(BaseModel)
 */
export type EntityDealProfilesResponse = {
  success: boolean;
  data?: EntityDealProfile[];
  error?: string;
};
