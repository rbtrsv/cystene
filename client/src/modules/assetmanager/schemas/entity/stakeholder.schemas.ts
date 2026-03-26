/**
 * Stakeholder Schemas
 *
 * Zod validation schemas for Stakeholder model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/entity_models.py
 * - Schema: /server/apps/assetmanager/schemas/entity_schemas/stakeholder_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/entity_subrouters/stakeholder_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Stakeholder type options - matches backend StakeholderType enum
 * Backend: class StakeholderType(str, Enum)
 */
export const StakeholderTypeEnum = z.enum([
  'general_partner',
  'limited_partner',
  'employee',
  'advisor',
  'board_member',
  'investor',
]);

// ==========================================
// Stakeholder Schema (Full Representation)
// ==========================================

/**
 * Stakeholder schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class Stakeholder(BaseModel)
 */
export const StakeholderSchema = z.object({
  id: z.number(),
  // Core fields
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  type: StakeholderTypeEnum,
  entity_id: z.number().nullable(),
  source_syndicate_id: z.number().nullable(),
  // Investment Rights
  carried_interest_percentage: z.number().nullable(),
  preferred_return_rate: z.number().nullable(),
  distribution_tier: z.number().default(1),
  // Governance Rights
  board_seats: z.number().default(0),
  voting_rights: z.boolean().default(true),
  pro_rata_rights: z.boolean().default(false),
  drag_along: z.boolean().default(false),
  tag_along: z.boolean().default(false),
  observer_rights: z.boolean().default(false),
  // Investment Terms
  minimum_investment: z.number().nullable(),
  maximum_investment: z.number().nullable(),
  // Timestamps
  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new stakeholder (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class CreateStakeholder(BaseModel)
 */
export const CreateStakeholderSchema = z.object({
  // Core fields
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  type: StakeholderTypeEnum,
  entity_id: z.number().nullable().optional(),
  source_syndicate_id: z.number().nullable().optional(),
  // Investment Rights
  carried_interest_percentage: z.number().nullable().optional(),
  preferred_return_rate: z.number().nullable().optional(),
  distribution_tier: z.number().default(1).optional(),
  // Governance Rights
  board_seats: z.number().default(0).optional(),
  voting_rights: z.boolean().default(true).optional(),
  pro_rata_rights: z.boolean().default(false).optional(),
  drag_along: z.boolean().default(false).optional(),
  tag_along: z.boolean().default(false).optional(),
  observer_rights: z.boolean().default(false).optional(),
  // Investment Terms
  minimum_investment: z.number().nullable().optional(),
  maximum_investment: z.number().nullable().optional(),
});

/**
 * Schema for updating a stakeholder (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class UpdateStakeholder(BaseModel)
 */
export const UpdateStakeholderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters').optional(),
  type: StakeholderTypeEnum.optional(),
  entity_id: z.number().nullable().optional(),
  source_syndicate_id: z.number().nullable().optional(),
  carried_interest_percentage: z.number().nullable().optional(),
  preferred_return_rate: z.number().nullable().optional(),
  distribution_tier: z.number().optional(),
  board_seats: z.number().optional(),
  voting_rights: z.boolean().optional(),
  pro_rata_rights: z.boolean().optional(),
  drag_along: z.boolean().optional(),
  tag_along: z.boolean().optional(),
  observer_rights: z.boolean().optional(),
  minimum_investment: z.number().nullable().optional(),
  maximum_investment: z.number().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type StakeholderType = z.infer<typeof StakeholderTypeEnum>;
export type Stakeholder = z.infer<typeof StakeholderSchema>;
export type CreateStakeholder = z.infer<typeof CreateStakeholderSchema>;
export type UpdateStakeholder = z.infer<typeof UpdateStakeholderSchema>;

// ==========================================
// Label Helpers
// ==========================================

/** Human-readable labels for stakeholder types */
export const STAKEHOLDER_TYPE_LABELS: Record<StakeholderType, string> = {
  general_partner: 'General Partner',
  limited_partner: 'Limited Partner',
  employee: 'Employee',
  advisor: 'Advisor',
  board_member: 'Board Member',
  investor: 'Investor',
};

/**
 * Get human-readable label for a stakeholder type
 * @param type Stakeholder type enum value
 * @returns Display label string
 */
export const getStakeholderTypeLabel = (type: string): string => {
  return STAKEHOLDER_TYPE_LABELS[type as StakeholderType] || type;
};

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single stakeholder
 * Backend equivalent: class StakeholderResponse(BaseModel)
 */
export type StakeholderResponse = {
  success: boolean;
  data?: Stakeholder;
  error?: string;
};

/**
 * Response containing multiple stakeholders
 * Backend equivalent: class StakeholdersResponse(BaseModel)
 */
export type StakeholdersResponse = {
  success: boolean;
  data?: Stakeholder[];
  error?: string;
};
