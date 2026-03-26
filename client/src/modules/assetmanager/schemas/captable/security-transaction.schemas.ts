/**
 * Security Transaction Schemas
 *
 * Zod validation schemas for SecurityTransaction model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/captable_models.py
 * - Schema: /server/apps/assetmanager/schemas/captable_schemas/security_transaction_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/captable_subrouters/security_transaction_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Transaction type options - matches backend TransactionType enum
 * Backend: class TransactionType(str, Enum)
 */
export const TransactionTypeEnum = z.enum([
  'issuance',
  'transfer',
  'conversion',
  'redemption',
  'exercise',
  'cancellation',
  'split',
  'merger',
]);

// ==========================================
// SecurityTransaction Schema (Full Representation)
// ==========================================

/**
 * SecurityTransaction schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class SecurityTransaction(BaseModel)
 */
export const SecurityTransactionSchema = z.object({
  id: z.number(),
  entity_id: z.number(),
  stakeholder_id: z.number(),
  funding_round_id: z.number(),
  security_id: z.number().nullable(),
  transaction_reference: z.string().max(50, 'Transaction reference must be less than 50 characters'),
  transaction_type: TransactionTypeEnum,
  units_debit: z.number(),
  units_credit: z.number(),
  amount_debit: z.number(),
  amount_credit: z.number(),
  transaction_date: z.string(), // ISO date string from backend
  notes: z.string().nullable(),
  related_transaction_id: z.number().nullable(),
  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new security transaction (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class SecurityTransactionCreate(BaseModel)
 */
export const CreateSecurityTransactionSchema = z.object({
  // Required fields
  entity_id: z.number(),
  stakeholder_id: z.number(),
  funding_round_id: z.number(),
  transaction_reference: z.string().min(1, 'Transaction reference is required').max(50, 'Transaction reference must be less than 50 characters'),
  transaction_type: TransactionTypeEnum,
  transaction_date: z.string().min(1, 'Transaction date is required'),

  // Optional fields
  security_id: z.number().nullable().optional(),
  units_debit: z.number().optional().default(0),
  units_credit: z.number().optional().default(0),
  amount_debit: z.number().optional().default(0),
  amount_credit: z.number().optional().default(0),
  notes: z.string().nullable().optional(),
  related_transaction_id: z.number().nullable().optional(),
});

/**
 * Schema for updating a security transaction (PUT)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class SecurityTransactionUpdate(BaseModel)
 */
export const UpdateSecurityTransactionSchema = z.object({
  entity_id: z.number().optional(),
  stakeholder_id: z.number().optional(),
  funding_round_id: z.number().optional(),
  security_id: z.number().nullable().optional(),
  transaction_reference: z.string().max(50, 'Transaction reference must be less than 50 characters').optional(),
  transaction_type: TransactionTypeEnum.optional(),
  units_debit: z.number().optional(),
  units_credit: z.number().optional(),
  amount_debit: z.number().optional(),
  amount_credit: z.number().optional(),
  transaction_date: z.string().optional(),
  notes: z.string().nullable().optional(),
  related_transaction_id: z.number().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type TransactionType = z.infer<typeof TransactionTypeEnum>;
export type SecurityTransaction = z.infer<typeof SecurityTransactionSchema>;
export type CreateSecurityTransaction = z.infer<typeof CreateSecurityTransactionSchema>;
export type UpdateSecurityTransaction = z.infer<typeof UpdateSecurityTransactionSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single security transaction
 * Backend equivalent: class SecurityTransactionResponse(BaseModel)
 */
export type SecurityTransactionResponse = {
  success: boolean;
  data?: SecurityTransaction;
  error?: string;
};

/**
 * Response containing multiple security transactions
 * Backend equivalent: class SecurityTransactionsResponse(BaseModel)
 */
export type SecurityTransactionsResponse = {
  success: boolean;
  data?: SecurityTransaction[];
  error?: string;
};

// ==========================================
// Helper Functions (adapted from v7capital)
// ==========================================

/**
 * Human-readable labels for transaction types
 */
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  issuance: 'Issuance',
  transfer: 'Transfer',
  conversion: 'Conversion',
  redemption: 'Redemption',
  exercise: 'Exercise',
  cancellation: 'Cancellation',
  split: 'Split',
  merger: 'Merger',
};

/**
 * Get human-readable label for a transaction type
 * @param type Transaction type enum value
 * @returns Display label string
 */
export const getTransactionTypeLabel = (type: TransactionType): string => {
  return TRANSACTION_TYPE_LABELS[type] || type;
};

/**
 * Calculate net amount for a transaction (credit minus debit)
 * Positive = inflow, Negative = outflow
 * @param transaction Security transaction
 * @returns Net amount
 */
export const calculateNetAmount = (transaction: SecurityTransaction): number => {
  return transaction.amount_credit - transaction.amount_debit;
};

/**
 * Calculate net units for a transaction (credit minus debit)
 * Positive = units received, Negative = units sent
 * @param transaction Security transaction
 * @returns Net units
 */
export const calculateNetUnits = (transaction: SecurityTransaction): number => {
  return transaction.units_credit - transaction.units_debit;
};
