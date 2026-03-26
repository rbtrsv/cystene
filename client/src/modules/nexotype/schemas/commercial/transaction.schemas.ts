import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const TransactionTypeEnum = z.enum(['Acquisition', 'Licensing', 'Divestiture']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** Transaction.transaction_type */
export const TRANSACTION_TYPE_OPTIONS = [
  { label: 'Acquisition', value: 'Acquisition' },
  { label: 'Licensing', value: 'Licensing' },
  { label: 'Divestiture', value: 'Divestiture' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const TransactionSchema = z.object({
  id: z.number(),
  buyer_id: z.number().int(),
  seller_id: z.number().int().nullable().optional(),
  asset_id: z.number().int().nullable().optional(),
  patent_id: z.number().int().nullable().optional(),
  transaction_type: TransactionTypeEnum,
  value_usd: z.number().nullable().optional(),
  announced_date: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateTransactionSchema = z.object({
  buyer_id: z.number().int(),
  seller_id: z.number().int().nullable().optional(),
  asset_id: z.number().int().nullable().optional(),
  patent_id: z.number().int().nullable().optional(),
  transaction_type: TransactionTypeEnum,
  value_usd: z.number().nullable().optional(),
  announced_date: z.string().min(1),
});

export const UpdateTransactionSchema = z.object({
  buyer_id: z.number().int().optional(),
  seller_id: z.number().int().nullable().optional(),
  asset_id: z.number().int().nullable().optional(),
  patent_id: z.number().int().nullable().optional(),
  transaction_type: TransactionTypeEnum.optional(),
  value_usd: z.number().nullable().optional(),
  announced_date: z.string().min(1).optional(),
});

// ==========================================
// Types
// ==========================================

export type Transaction = z.infer<typeof TransactionSchema>;
export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransaction = z.infer<typeof UpdateTransactionSchema>;
export type TransactionType = z.infer<typeof TransactionTypeEnum>;

// ==========================================
// Response Types
// ==========================================

export type TransactionResponse = {
  success: boolean;
  data?: Transaction;
  error?: string;
};

export type TransactionsResponse = {
  success: boolean;
  data?: Transaction[];
  count?: number;
  error?: string;
};
