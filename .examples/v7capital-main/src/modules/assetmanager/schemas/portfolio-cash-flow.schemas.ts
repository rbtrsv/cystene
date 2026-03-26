import { z } from 'zod';

// ==========================================
// Enums & Types
// ==========================================
export const cashFlowScenarioEnum = z.enum(['Actual', 'Forecast']);
export const cashFlowTypeEnum = z.enum([
  'Investment',
  'Follow-on',
  'Dividend',
  'Interest',
  'Sale Proceeds',
  'Exit Proceeds',
  'Distribution',
  'Management Fee',
  'Performance Fee'
]);
export const currencyEnum = z.enum([
  'USD', 'EUR', 'GBP', 'RON', 'CHF', 'JPY', 
  'CNY', 'AUD', 'CAD', 'SGD', 'HKD'
]);

export type CashFlowScenario = z.infer<typeof cashFlowScenarioEnum>;
export type CashFlowType = z.infer<typeof cashFlowTypeEnum>;
export type Currency = z.infer<typeof currencyEnum>;

// ==========================================
// Entity Schemas
// ==========================================
export const PortfolioCashFlowSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  fundId: z.number(),
  roundId: z.number(),
  date: z.date(),
  
  // Debit/Credit amounts from FUND perspective (fund's balance sheet)
  // Debit = fund inflow (exits, dividends, distributions)
  // Credit = fund outflow (investments, follow-ons, fees)
  amountDebit: z.number(),
  amountCredit: z.number(),
  
  currency: currencyEnum.default('EUR'),
  cashFlowType: cashFlowTypeEnum,
  scenario: cashFlowScenarioEnum,
  transactionReference: z.string().nullable(),
  description: z.string().nullable(),
  includeInIrr: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ==========================================
// Input Schemas
// ==========================================
export const CreatePortfolioCashFlowSchema = z.object({
  companyId: z.number().min(1, 'Company is required'),
  fundId: z.number().min(1, 'Fund is required'),
  roundId: z.number().min(1, 'Round is required'),
  date: z.date().or(z.string()),
  
  // Debit/Credit amounts - one must be provided and > 0
  // From FUND perspective: Debit = money IN (exits, dividends), Credit = money OUT (investments, fees)
  amountDebit: z.number().optional(),
  amountCredit: z.number().optional(),
  
  currency: currencyEnum.default('EUR'),
  cashFlowType: cashFlowTypeEnum,
  scenario: cashFlowScenarioEnum.default('Actual'),
  transactionReference: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  includeInIrr: z.boolean().default(true),
}).refine((data) => {
  // Ensure either debit or credit has a value > 0, but not both
  const debit = data.amountDebit || 0;
  const credit = data.amountCredit || 0;
  return (debit > 0 && credit === 0) || (credit > 0 && debit === 0);
}, {
  message: 'Either debit amount or credit amount must be provided (but not both)',
});

export const UpdatePortfolioCashFlowSchema = z.object({
  companyId: z.number().min(1, 'Company is required').optional(),
  fundId: z.number().min(1, 'Fund is required').optional(),
  roundId: z.number().min(1, 'Round is required').optional(),
  date: z.date().or(z.string()).optional(),
  
  // Debit/Credit amounts - validation applies only if provided
  // From FUND perspective: Debit = money IN (exits, dividends), Credit = money OUT (investments, fees)
  amountDebit: z.number().optional(),
  amountCredit: z.number().optional(),
  
  currency: currencyEnum.optional(),
  cashFlowType: cashFlowTypeEnum.optional(),
  scenario: cashFlowScenarioEnum.optional(),
  transactionReference: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  includeInIrr: z.boolean().optional(),
}).refine((data) => {
  // If either amount is provided, ensure only one has a value > 0
  if (data.amountDebit || data.amountCredit) {
    const debit = data.amountDebit || 0;
    const credit = data.amountCredit || 0;
    return (debit > 0 && credit === 0) || (credit > 0 && debit === 0);
  }
  return true;
}, {
  message: 'Either debit amount or credit amount must be provided (but not both)',
});

// ==========================================
// Type Exports
// ==========================================
export type PortfolioCashFlow = z.infer<typeof PortfolioCashFlowSchema>;
export type CreatePortfolioCashFlowInput = z.infer<typeof CreatePortfolioCashFlowSchema>;
export type UpdatePortfolioCashFlowInput = z.infer<typeof UpdatePortfolioCashFlowSchema>;

// ==========================================
// Response Types
// ==========================================
export type PortfolioCashFlowResponse = {
  success: boolean;
  data?: PortfolioCashFlow;
  error?: string;
};

export type PortfolioCashFlowsResponse = {
  success: boolean;
  data?: PortfolioCashFlow[];
  error?: string;
};

export type PortfolioCashFlowDeleteResponse = {
  success: boolean;
  error?: string;
};

// ==========================================
// Extended Types (with relations)
// ==========================================
export interface PortfolioCashFlowWithRelations extends PortfolioCashFlow {
  company?: {
    id: number;
    name: string;
  };
  fund?: {
    id: number;
    name: string;
  };
  round?: {
    id: number;
    name: string;
  };
}

export type PortfolioCashFlowsWithRelationsResponse = {
  success: boolean;
  data?: PortfolioCashFlowWithRelations[];
  error?: string;
};
