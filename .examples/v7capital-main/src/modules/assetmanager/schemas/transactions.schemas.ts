import { z } from 'zod';

// ==========================================
// Enums & Types
// ==========================================
export const transactionTypeEnum = z.enum([
  // Entity Perspective: Primary transaction types
  'ISSUANCE',           // Fund receives cash (amountDebit), issues units to stakeholder (unitsCredit)
  'DISTRIBUTION',       // Fund pays cash to stakeholder (amountCredit)
  'REDEMPTION',         // Fund buys back units (unitsDebit), pays cash (amountCredit)

  // Transfer transactions (stakeholder-to-stakeholder)
  'TRANSFER_IN',        // Stakeholder receives units (unitsCredit)
  'TRANSFER_OUT',       // Stakeholder loses units (unitsDebit)

  // Legacy/Other cash transactions
  'CASH_IN',
  'CASH_OUT',
  'COUPON_IN',
  'COUPON_OUT',

  // Share related transactions
  'CONVERSION_IN',
  'CONVERSION_OUT',
  'SPLIT',
  'CONSOLIDATION',

  // Option related transactions
  'GRANT',
  'VEST',
  'EXERCISE',
  'EXPIRE',
  'FORFEIT',
  'CANCEL',

  // Financial transactions
  'DIVIDEND',
  'INTEREST',
  'ADJUSTMENT'
]);
export type TransactionType = z.infer<typeof transactionTypeEnum>;

// ==========================================
// Schema Definitions
// ==========================================
export const TransactionSchema = z.object({
  id: z.number(),
  transactionDate: z.date(),
  transactionReference: z.string().min(1, "Transaction reference is required").max(100, "Transaction reference too long"),
  transactionType: transactionTypeEnum,
  stakeholderId: z.number(),
  securityId: z.number(),
  fundId: z.number(),
  roundId: z.number(),
  amountDebit: z.number().default(0),
  amountCredit: z.number().default(0),
  unitsDebit: z.number().default(0),
  unitsCredit: z.number().default(0),
  relatedTransactionId: z.number().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// ==========================================
// Input Schemas
// ==========================================
export const CreateTransactionSchema = z.object({
  transactionReference: z.string().min(1, "Transaction reference is required").max(100, "Transaction reference too long"),
  transactionType: transactionTypeEnum,
  stakeholderId: z.number(),
  securityId: z.number(),
  fundId: z.number(),
  roundId: z.number(),
  transactionDate: z.date().or(z.string()), // Allow string input for dates
  amountDebit: z.number().default(0),
  amountCredit: z.number().default(0),
  unitsDebit: z.number().default(0),
  unitsCredit: z.number().default(0),
  relatedTransactionId: z.number().nullable().optional(),
  notes: z.string().nullable().optional()
});

export const UpdateTransactionSchema = z.object({
  transactionReference: z.string().optional(),
  transactionType: transactionTypeEnum.optional(),
  stakeholderId: z.number().optional(),
  securityId: z.number().optional(),
  fundId: z.number().optional(),
  roundId: z.number().optional(),
  transactionDate: z.date().or(z.string()).optional(),
  amountDebit: z.number().optional(),
  amountCredit: z.number().optional(),
  unitsDebit: z.number().optional(),
  unitsCredit: z.number().optional(),
  relatedTransactionId: z.number().nullable().optional(),
  notes: z.string().nullable().optional()
});

// ==========================================
// Type Exports
// ==========================================
export type Transaction = z.infer<typeof TransactionSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;

// ==========================================
// Response Types
// ==========================================
export interface TransactionResponse {
  success: boolean;
  data?: Transaction;
  error?: string;
}

export interface TransactionsResponse {
  success: boolean;
  data?: Transaction[];
  error?: string;
}

// ==========================================
// Extended Types (with relations)
// ==========================================
export interface TransactionWithDetails extends Transaction {
  stakeholder?: {
    id: number;
    stakeholderName: string;
    type: string;
  };
  security?: {
    id: number;
    securityName: string;
    securityType: string;
  };
  fund?: {
    id: number;
    name: string;
  };
  round?: {
    id: number;
    roundName: string;
  };
}

// ==========================================
// Helper functions
// ==========================================
// Entity Perspective: Direction from stakeholder's viewpoint
// - 'in' = stakeholder receives units (unitsCredit > 0) or cash (amountCredit > 0)
// - 'out' = stakeholder loses units (unitsDebit > 0) or pays cash (amountDebit > 0)
export function getTransactionDirection(transaction: Transaction): 'in' | 'out' | 'neutral' {
  const inTypes = ['ISSUANCE', 'TRANSFER_IN', 'CONVERSION_IN', 'GRANT', 'VEST', 'DISTRIBUTION'];
  const outTypes = ['REDEMPTION', 'TRANSFER_OUT', 'CONVERSION_OUT', 'EXPIRE', 'FORFEIT', 'CANCEL'];

  if (inTypes.includes(transaction.transactionType)) {
    return 'in';
  } else if (outTypes.includes(transaction.transactionType)) {
    return 'out';
  } else {
    return 'neutral';
  }
}

export function getTransactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    // Entity Perspective: Primary transaction types
    'ISSUANCE': 'Issuance',
    'DISTRIBUTION': 'Distribution',
    'REDEMPTION': 'Redemption',
    // Transfer transactions
    'TRANSFER_IN': 'Transfer In',
    'TRANSFER_OUT': 'Transfer Out',
    // Legacy/Other cash transactions
    'CASH_IN': 'Cash In',
    'CASH_OUT': 'Cash Out',
    'COUPON_IN': 'Coupon In',
    'COUPON_OUT': 'Coupon Out',
    // Share related transactions
    'CONVERSION_IN': 'Conversion In',
    'CONVERSION_OUT': 'Conversion Out',
    'SPLIT': 'Split',
    'CONSOLIDATION': 'Consolidation',
    // Option related transactions
    'GRANT': 'Grant',
    'VEST': 'Vest',
    'EXERCISE': 'Exercise',
    'EXPIRE': 'Expire',
    'FORFEIT': 'Forfeit',
    'CANCEL': 'Cancel',
    // Financial transactions
    'DIVIDEND': 'Dividend',
    'INTEREST': 'Interest',
    'ADJUSTMENT': 'Adjustment'
  };

  return labels[type] || type;
}

export function calculateNetAmount(transaction: Transaction): number {
  return transaction.amountDebit - transaction.amountCredit;
}

// Entity Perspective: stakeholder balance = unitsCredit - unitsDebit
// - unitsCredit = Fund issues units TO stakeholder (stakeholder receives)
// - unitsDebit = Fund redeems units FROM stakeholder (stakeholder loses)
export function calculateNetUnits(transaction: Transaction): number {
  return transaction.unitsCredit - transaction.unitsDebit;
}

export function getTransactionsByStakeholder(transactions: Transaction[], stakeholderId: number): Transaction[] {
  return transactions.filter(transaction => transaction.stakeholderId === stakeholderId);
}

export function getTransactionsBySecurity(transactions: Transaction[], securityId: number): Transaction[] {
  return transactions.filter(transaction => transaction.securityId === securityId);
}
