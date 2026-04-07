/**
 * Deal Commitment Schemas
 *
 * Zod validation schemas for DealCommitment model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/deal_models.py
 * - Schema: /server/apps/assetmanager/schemas/deal_schemas/deal_commitment_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/deal_subrouters/deal_commitment_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Commitment type options - matches backend CommitmentType enum
 * Backend: class CommitmentType(str, Enum)
 */
export const CommitmentTypeEnum = z.enum([
  'soft',
  'firm',
]);

// ==========================================
// DealCommitment Schema (Full Representation)
// ==========================================

/**
 * DealCommitment schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class DealCommitment(BaseModel)
 */
export const DealCommitmentSchema = z.object({
  id: z.number(),
  deal_id: z.number(),
  entity_id: z.number(),
  commitment_type: CommitmentTypeEnum,
  amount: z.number(),
  notes: z.string().nullable(),

  // Why transaction_id: Shows whether this commitment has been converted
  // to a SecurityTransaction during deal execution (non-null = executed).
  transaction_id: z.number().nullable(),

  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(), // ISO datetime string from backend
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new deal commitment (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class DealCommitmentCreate(BaseModel)
 */
export const CreateDealCommitmentSchema = z.object({
  deal_id: z.number(),
  entity_id: z.number(),
  commitment_type: CommitmentTypeEnum.default('soft'),
  amount: z.number().gt(0),
  notes: z.string().nullable().optional(),
});

/**
 * Schema for updating a deal commitment (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class DealCommitmentUpdate(BaseModel)
 */
export const UpdateDealCommitmentSchema = z.object({
  deal_id: z.number().optional(),
  entity_id: z.number().optional(),
  commitment_type: CommitmentTypeEnum.optional(),
  amount: z.number().gt(0).optional(),
  notes: z.string().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type CommitmentType = z.infer<typeof CommitmentTypeEnum>;
export type DealCommitment = z.infer<typeof DealCommitmentSchema>;
export type CreateDealCommitment = z.infer<typeof CreateDealCommitmentSchema>;
export type UpdateDealCommitment = z.infer<typeof UpdateDealCommitmentSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single deal commitment
 * Backend equivalent: class DealCommitmentResponse(BaseModel)
 */
export type DealCommitmentResponse = {
  success: boolean;
  data?: DealCommitment;
  error?: string;
};

/**
 * Response containing multiple deal commitments
 * Backend equivalent: class DealCommitmentsResponse(BaseModel)
 */
export type DealCommitmentsResponse = {
  success: boolean;
  data?: DealCommitment[];
  error?: string;
};
