/**
 * Syndicate Schemas
 *
 * Zod validation schemas for Syndicate model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/entity_models.py
 * - Schema: /server/apps/assetmanager/schemas/entity_schemas/syndicate_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/entity_subrouters/syndicate_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Syndicate Schema (Full Representation)
// ==========================================

/**
 * Syndicate schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class Syndicate(BaseModel)
 */
export const SyndicateSchema = z.object({
  id: z.number(),
  entity_id: z.number(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  carried_interest_percentage: z.number().nullable(),
  minimum_investment: z.number().nullable(),
  maximum_investment: z.number().nullable(),
  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new syndicate (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class CreateSyndicate(BaseModel)
 */
export const CreateSyndicateSchema = z.object({
  entity_id: z.number(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  carried_interest_percentage: z.number().nullable().optional(),
  minimum_investment: z.number().nullable().optional(),
  maximum_investment: z.number().nullable().optional(),
});

/**
 * Schema for updating a syndicate (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class UpdateSyndicate(BaseModel)
 */
export const UpdateSyndicateSchema = z.object({
  entity_id: z.number().nullable().optional(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters').optional(),
  carried_interest_percentage: z.number().nullable().optional(),
  minimum_investment: z.number().nullable().optional(),
  maximum_investment: z.number().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type Syndicate = z.infer<typeof SyndicateSchema>;
export type CreateSyndicate = z.infer<typeof CreateSyndicateSchema>;
export type UpdateSyndicate = z.infer<typeof UpdateSyndicateSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single syndicate
 * Backend equivalent: class SyndicateResponse(BaseModel)
 */
export type SyndicateResponse = {
  success: boolean;
  data?: Syndicate;
  error?: string;
};

/**
 * Response containing multiple syndicates
 * Backend equivalent: class SyndicatesResponse(BaseModel)
 */
export type SyndicatesResponse = {
  success: boolean;
  data?: Syndicate[];
  error?: string;
};
