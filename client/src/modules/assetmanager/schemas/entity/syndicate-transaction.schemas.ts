/**
 * SyndicateTransaction Schemas
 *
 * Zod validation schemas for SyndicateTransaction model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/entity_models.py
 * - Schema: /server/apps/assetmanager/schemas/entity_schemas/syndicate_transaction_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/entity_subrouters/syndicate_transaction_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// SyndicateTransaction Schema (Full Representation)
// ==========================================

/**
 * SyndicateTransaction schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class SyndicateTransaction(BaseModel)
 */
export const SyndicateTransactionSchema = z.object({
  id: z.number(),
  syndicate_id: z.number(),
  // Transaction type — 'transfer' (member sells to another), 'allocation_change' (manager adjusts)
  transaction_type: z.string(),
  // Parties
  seller_entity_id: z.number(),
  buyer_entity_id: z.number(),
  // Transfer details
  ownership_percentage: z.number(),
  amount: z.number().nullable(),
  // Status flow: pending_buyer → pending_manager → completed (or rejected at any step)
  status: z.string(),
  notes: z.string().nullable(),
  // Timestamps
  requested_at: z.string(), // ISO datetime string from backend
  completed_at: z.string().nullable(),
  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new syndicate transaction (POST)
 * Excludes: id, requested_at, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class CreateSyndicateTransaction(BaseModel)
 */
export const CreateSyndicateTransactionSchema = z.object({
  syndicate_id: z.number(),
  transaction_type: z.string(),
  seller_entity_id: z.number(),
  buyer_entity_id: z.number(),
  ownership_percentage: z.number(),
  amount: z.number().nullable().optional(),
  status: z.string().default('pending_buyer').optional(),
  notes: z.string().nullable().optional(),
});

/**
 * Schema for updating a syndicate transaction (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class UpdateSyndicateTransaction(BaseModel)
 */
export const UpdateSyndicateTransactionSchema = z.object({
  transaction_type: z.string().optional(),
  seller_entity_id: z.number().optional(),
  buyer_entity_id: z.number().optional(),
  ownership_percentage: z.number().optional(),
  amount: z.number().nullable().optional(),
  status: z.string().optional(),
  notes: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type SyndicateTransaction = z.infer<typeof SyndicateTransactionSchema>;
export type CreateSyndicateTransaction = z.infer<typeof CreateSyndicateTransactionSchema>;
export type UpdateSyndicateTransaction = z.infer<typeof UpdateSyndicateTransactionSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single syndicate transaction
 * Backend equivalent: class SyndicateTransactionResponse(BaseModel)
 */
export type SyndicateTransactionResponse = {
  success: boolean;
  data?: SyndicateTransaction;
  error?: string;
};

/**
 * Response containing multiple syndicate transactions
 * Backend equivalent: class SyndicateTransactionsResponse(BaseModel)
 */
export type SyndicateTransactionsResponse = {
  success: boolean;
  data?: SyndicateTransaction[];
  error?: string;
};
