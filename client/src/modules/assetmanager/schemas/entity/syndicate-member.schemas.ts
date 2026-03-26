/**
 * SyndicateMember Schemas
 *
 * Zod validation schemas for SyndicateMember model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/entity_models.py
 * - Schema: /server/apps/assetmanager/schemas/entity_schemas/syndicate_member_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/entity_subrouters/syndicate_member_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// SyndicateMember Schema (Full Representation)
// ==========================================

/**
 * SyndicateMember schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class SyndicateMember(BaseModel)
 */
export const SyndicateMemberSchema = z.object({
  id: z.number(),
  syndicate_id: z.number(),
  member_entity_id: z.number(),
  ownership_percentage: z.number(),
  investment_amount: z.number().nullable(),
  joined_date: z.string(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new syndicate member (POST)
 * Excludes: id, joined_date (auto-generated)
 *
 * Backend equivalent: class CreateSyndicateMember(BaseModel)
 */
export const CreateSyndicateMemberSchema = z.object({
  syndicate_id: z.number(),
  member_entity_id: z.number(),
  ownership_percentage: z.number(),
  investment_amount: z.number().nullable().optional(),
});

/**
 * Schema for updating a syndicate member (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class UpdateSyndicateMember(BaseModel)
 */
export const UpdateSyndicateMemberSchema = z.object({
  syndicate_id: z.number().optional(),
  member_entity_id: z.number().optional(),
  ownership_percentage: z.number().optional(),
  investment_amount: z.number().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type SyndicateMember = z.infer<typeof SyndicateMemberSchema>;
export type CreateSyndicateMember = z.infer<typeof CreateSyndicateMemberSchema>;
export type UpdateSyndicateMember = z.infer<typeof UpdateSyndicateMemberSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single syndicate member
 * Backend equivalent: class SyndicateMemberResponse(BaseModel)
 */
export type SyndicateMemberResponse = {
  success: boolean;
  data?: SyndicateMember;
  error?: string;
};

/**
 * Response containing multiple syndicate members
 * Backend equivalent: class SyndicateMembersResponse(BaseModel)
 */
export type SyndicateMembersResponse = {
  success: boolean;
  data?: SyndicateMember[];
  error?: string;
};
