/**
 * Commitment Schemas
 *
 * Zod validation schemas for Commitment model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/captable_models.py
 * - Schema: /server/apps/assetmanager/schemas/captable_schemas/commitment_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/captable_subrouters/commitment_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Commitment status options — tracks the full lifecycle flow
 * Backend: class CommitmentStatus(str, Enum)
 */
export const CommitmentStatusEnum = z.enum([
  'invited',
  'committed',
  'passed',
  'approved',
  'rejected',
]);

/**
 * Commitment type options — set when stakeholder responds
 * Backend: class CommitmentType(str, Enum)
 */
export const CommitmentTypeEnum = z.enum([
  'full_pro_rata',
  'partial',
  'over_subscription',
]);

// ==========================================
// Commitment Schema (Full Representation)
// ==========================================

/**
 * Commitment schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class Commitment(BaseModel)
 */
export const CommitmentSchema = z.object({
  id: z.number(),

  // Core references
  entity_id: z.number(),
  funding_round_id: z.number(),
  security_id: z.number(),
  stakeholder_id: z.number(),

  // Status & Type
  status: CommitmentStatusEnum,
  commitment_type: CommitmentTypeEnum.nullable(),

  // Pro-rata calculation (snapshot at invitation time — frozen, later cap table changes don't affect)
  pro_rata_percentage: z.number(),
  pro_rata_amount: z.number(),

  // Committed amount (NULL when invited/passed, set when stakeholder commits)
  committed_amount: z.number().nullable(),

  // Transaction link (populated when admin generates ISSUANCE transaction from approved commitment)
  transaction_id: z.number().nullable(),

  // Notes
  notes: z.string().nullable(),

  // Invitation tracking
  invited_by: z.number().nullable(),
  invited_at: z.string(), // ISO datetime string from backend

  // Response tracking
  responded_at: z.string().nullable(),

  // Review tracking
  reviewed_at: z.string().nullable(),
  reviewed_by: z.number().nullable(),

  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(),
});

// ==========================================
// Enriched Output Schema (mirrors backend CommitmentDetail)
// ==========================================

/**
 * CommitmentDetail — commitment with resolved names from JOINed tables.
 * Returned by list/get endpoints. Frontend displays these directly
 * instead of doing local lookups that fail for cross-entity data.
 *
 * Backend equivalent: class CommitmentDetail(Commitment)
 */
export const CommitmentDetailSchema = CommitmentSchema.extend({
  funding_round_name: z.string(), // From FundingRound.name
  security_name: z.string(),      // From Security.security_name
  entity_name: z.string(),        // From Entity.name (cap table owner)
  stakeholder_name: z.string(),   // From Stakeholder.source_entity_id → Entity.name (investor)
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for inviting a stakeholder to a funding round (POST).
 * One commitment per request — mirrors model columns only.
 * raise_amount is NOT here because it's a calculation input, not a persisted field.
 * It's sent as a query parameter on the endpoint instead.
 *
 * Backend equivalent: class CommitmentCreate(BaseModel)
 */
export const CreateCommitmentSchema = z.object({
  entity_id: z.number(),
  funding_round_id: z.number(),
  security_id: z.number(),
  stakeholder_id: z.number(),
});

/**
 * Schema for stakeholder responding to an invitation (PUT /respond)
 * Committed or passed
 *
 * Backend equivalent: class CommitmentRespond(BaseModel)
 */
export const RespondCommitmentSchema = z.object({
  status: z.enum(['committed', 'passed']),
  commitment_type: CommitmentTypeEnum.nullable().optional(),
  committed_amount: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

/**
 * Schema for admin reviewing a committed commitment (PUT /review)
 * Approved or rejected
 *
 * Backend equivalent: class CommitmentReview(BaseModel)
 */
export const ReviewCommitmentSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

// ==========================================
// Type Exports
// ==========================================

export type CommitmentStatus = z.infer<typeof CommitmentStatusEnum>;
export type CommitmentType = z.infer<typeof CommitmentTypeEnum>;
export type Commitment = z.infer<typeof CommitmentSchema>;
export type CommitmentDetail = z.infer<typeof CommitmentDetailSchema>;
export type CreateCommitment = z.infer<typeof CreateCommitmentSchema>;
export type RespondCommitment = z.infer<typeof RespondCommitmentSchema>;
export type ReviewCommitment = z.infer<typeof ReviewCommitmentSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single commitment (enriched with JOINed names)
 * Backend equivalent: class CommitmentResponse(BaseModel)
 */
export type CommitmentResponse = {
  success: boolean;
  data?: CommitmentDetail;
  error?: string;
};

/**
 * Response containing multiple commitments (enriched with JOINed names)
 * Backend equivalent: class CommitmentsResponse(BaseModel)
 */
export type CommitmentsResponse = {
  success: boolean;
  data?: CommitmentDetail[];
  error?: string;
};

// ==========================================
// Helper Functions
// ==========================================

/**
 * Human-readable labels for commitment statuses
 */
export const COMMITMENT_STATUS_LABELS: Record<CommitmentStatus, string> = {
  invited: 'Invited',
  committed: 'Committed',
  passed: 'Passed',
  approved: 'Approved',
  rejected: 'Rejected',
};

/**
 * Human-readable labels for commitment types
 */
export const COMMITMENT_TYPE_LABELS: Record<CommitmentType, string> = {
  full_pro_rata: 'Full Pro-Rata',
  partial: 'Partial',
  over_subscription: 'Over-Subscription',
};

/**
 * Check if commitment is pending response (still invited)
 * @param commitment Commitment object
 * @returns True if stakeholder hasn't responded yet
 */
export const isPendingResponse = (commitment: Commitment): boolean => {
  return commitment.status === 'invited';
};

/**
 * Check if commitment is approved
 * @param commitment Commitment object
 * @returns True if commitment is approved
 */
export const isApproved = (commitment: Commitment): boolean => {
  return commitment.status === 'approved';
};

/**
 * Check if commitment is pending review (committed but not yet reviewed)
 * @param commitment Commitment object
 * @returns True if commitment is awaiting admin review
 */
export const isPendingReview = (commitment: Commitment): boolean => {
  return commitment.status === 'committed';
};

/**
 * Check if commitment was passed by stakeholder
 * @param commitment Commitment object
 * @returns True if stakeholder passed
 */
export const isPassed = (commitment: Commitment): boolean => {
  return commitment.status === 'passed';
};

/**
 * Check if commitment was rejected by admin
 * @param commitment Commitment object
 * @returns True if commitment was rejected
 */
export const isRejected = (commitment: Commitment): boolean => {
  return commitment.status === 'rejected';
};

/**
 * Calculate pro-rata amount for a given ownership percentage and target amount
 * @param ownershipPct Ownership percentage (0-100)
 * @param targetAmount Funding round target amount
 * @returns Pro-rata amount rounded to 2 decimals
 */
export const calculateProRataAmount = (ownershipPct: number, targetAmount: number): number => {
  return Math.round((ownershipPct / 100) * targetAmount * 100) / 100;
};
