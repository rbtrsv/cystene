import { z } from 'zod';

// ==========================================
// Enums & Types
// ==========================================

// Time period enums
export const quarterEnum = z.enum(['Q1', 'Q2', 'Q3', 'Q4']);
export const semesterEnum = z.enum(['H1', 'H2']);
export const monthEnum = z.enum([
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]);

// Financial scenario enum
export const financialScenarioEnum = z.enum(['Actual', 'Forecast', 'Budget']);

// Type exports for enums
export type Quarter = z.infer<typeof quarterEnum>;
export type Semester = z.infer<typeof semesterEnum>;
export type Month = z.infer<typeof monthEnum>;
export type FinancialScenario = z.infer<typeof financialScenarioEnum>;

// ==========================================
// Balance Sheet Schemas
// ==========================================

export const BalanceSheetSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  year: z.number(),
  semester: semesterEnum.nullable(),
  quarter: quarterEnum.nullable(),
  month: monthEnum.nullable(),
  scenario: financialScenarioEnum.default('Actual'),
  date: z.string().nullable(), // ISO date string
  
  // Current Assets
  cash: z.number().nullable(),
  cashEquivalents: z.number().nullable(),
  cashAndCashEquivalents: z.number().nullable(),
  otherShortTermInvestments: z.number().nullable(),
  accountsReceivable: z.number().nullable(),
  otherReceivables: z.number().nullable(),
  inventory: z.number().nullable(),
  prepaidAssets: z.number().nullable(),
  restrictedCash: z.number().nullable(),
  assetsHeldForSale: z.number().nullable(),
  hedgingAssets: z.number().nullable(),
  otherCurrentAssets: z.number().nullable(),
  totalCurrentAssets: z.number().nullable(),
  
  // Non-current Assets
  properties: z.number().nullable(),
  landAndImprovements: z.number().nullable(),
  machineryFurnitureEquipment: z.number().nullable(),
  constructionInProgress: z.number().nullable(),
  leases: z.number().nullable(),
  accumulatedDepreciation: z.number().nullable(),
  goodwill: z.number().nullable(),
  investmentProperties: z.number().nullable(),
  financialAssets: z.number().nullable(),
  intangibleAssets: z.number().nullable(),
  investmentsAndAdvances: z.number().nullable(),
  otherNonCurrentAssets: z.number().nullable(),
  totalNonCurrentAssets: z.number().nullable(),
  
  // Total Assets
  totalAssets: z.number().nullable(),
  
  // Current Liabilities
  accountsPayable: z.number().nullable(),
  accruedExpenses: z.number().nullable(),
  shortTermDebt: z.number().nullable(),
  deferredRevenue: z.number().nullable(),
  taxPayable: z.number().nullable(),
  pensions: z.number().nullable(),
  otherCurrentLiabilities: z.number().nullable(),
  totalCurrentLiabilities: z.number().nullable(),
  
  // Non-current Liabilities
  longTermProvisions: z.number().nullable(),
  longTermDebt: z.number().nullable(),
  provisionForRisksAndCharges: z.number().nullable(),
  deferredLiabilities: z.number().nullable(),
  derivativeProductLiabilities: z.number().nullable(),
  otherNonCurrentLiabilities: z.number().nullable(),
  totalNonCurrentLiabilities: z.number().nullable(),
  
  // Total Liabilities
  totalLiabilities: z.number().nullable(),
  
  // Shareholders' Equity
  commonStock: z.number().nullable(),
  retainedEarnings: z.number().nullable(),
  otherStakeholdersEquity: z.number().nullable(),
  totalStakeholdersEquity: z.number().nullable(),
  additionalPaidInCapital: z.number().nullable(),
  treasuryStock: z.number().nullable(),
  minorityInterest: z.number().nullable(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateBalanceSheetSchema = z.object({
  companyId: z.number().min(1, 'Company is required'),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid'),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  scenario: financialScenarioEnum.optional().default('Actual'),
  date: z.string().optional().nullable(),
  
  // Current Assets
  cash: z.number().optional().nullable(),
  cashEquivalents: z.number().optional().nullable(),
  cashAndCashEquivalents: z.number().optional().nullable(),
  otherShortTermInvestments: z.number().optional().nullable(),
  accountsReceivable: z.number().optional().nullable(),
  otherReceivables: z.number().optional().nullable(),
  inventory: z.number().optional().nullable(),
  prepaidAssets: z.number().optional().nullable(),
  restrictedCash: z.number().optional().nullable(),
  assetsHeldForSale: z.number().optional().nullable(),
  hedgingAssets: z.number().optional().nullable(),
  otherCurrentAssets: z.number().optional().nullable(),
  totalCurrentAssets: z.number().optional().nullable(),
  
  // Non-current Assets
  properties: z.number().optional().nullable(),
  landAndImprovements: z.number().optional().nullable(),
  machineryFurnitureEquipment: z.number().optional().nullable(),
  constructionInProgress: z.number().optional().nullable(),
  leases: z.number().optional().nullable(),
  accumulatedDepreciation: z.number().optional().nullable(),
  goodwill: z.number().optional().nullable(),
  investmentProperties: z.number().optional().nullable(),
  financialAssets: z.number().optional().nullable(),
  intangibleAssets: z.number().optional().nullable(),
  investmentsAndAdvances: z.number().optional().nullable(),
  otherNonCurrentAssets: z.number().optional().nullable(),
  totalNonCurrentAssets: z.number().optional().nullable(),
  
  // Total Assets
  totalAssets: z.number().optional().nullable(),
  
  // Current Liabilities
  accountsPayable: z.number().optional().nullable(),
  accruedExpenses: z.number().optional().nullable(),
  shortTermDebt: z.number().optional().nullable(),
  deferredRevenue: z.number().optional().nullable(),
  taxPayable: z.number().optional().nullable(),
  pensions: z.number().optional().nullable(),
  otherCurrentLiabilities: z.number().optional().nullable(),
  totalCurrentLiabilities: z.number().optional().nullable(),
  
  // Non-current Liabilities
  longTermProvisions: z.number().optional().nullable(),
  longTermDebt: z.number().optional().nullable(),
  provisionForRisksAndCharges: z.number().optional().nullable(),
  deferredLiabilities: z.number().optional().nullable(),
  derivativeProductLiabilities: z.number().optional().nullable(),
  otherNonCurrentLiabilities: z.number().optional().nullable(),
  totalNonCurrentLiabilities: z.number().optional().nullable(),
  
  // Total Liabilities
  totalLiabilities: z.number().optional().nullable(),
  
  // Shareholders' Equity
  commonStock: z.number().optional().nullable(),
  retainedEarnings: z.number().optional().nullable(),
  otherStakeholdersEquity: z.number().optional().nullable(),
  totalStakeholdersEquity: z.number().optional().nullable(),
  additionalPaidInCapital: z.number().optional().nullable(),
  treasuryStock: z.number().optional().nullable(),
  minorityInterest: z.number().optional().nullable(),
});

export const UpdateBalanceSheetSchema = z.object({
  companyId: z.number().min(1, 'Company is required').optional(),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid').optional(),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  scenario: financialScenarioEnum.optional(),
  date: z.string().optional().nullable(),
  
  // Current Assets - all optional for updates
  cash: z.number().optional().nullable(),
  cashEquivalents: z.number().optional().nullable(),
  cashAndCashEquivalents: z.number().optional().nullable(),
  otherShortTermInvestments: z.number().optional().nullable(),
  accountsReceivable: z.number().optional().nullable(),
  otherReceivables: z.number().optional().nullable(),
  inventory: z.number().optional().nullable(),
  prepaidAssets: z.number().optional().nullable(),
  restrictedCash: z.number().optional().nullable(),
  assetsHeldForSale: z.number().optional().nullable(),
  hedgingAssets: z.number().optional().nullable(),
  otherCurrentAssets: z.number().optional().nullable(),
  totalCurrentAssets: z.number().optional().nullable(),
  
  // Non-current Assets
  properties: z.number().optional().nullable(),
  landAndImprovements: z.number().optional().nullable(),
  machineryFurnitureEquipment: z.number().optional().nullable(),
  constructionInProgress: z.number().optional().nullable(),
  leases: z.number().optional().nullable(),
  accumulatedDepreciation: z.number().optional().nullable(),
  goodwill: z.number().optional().nullable(),
  investmentProperties: z.number().optional().nullable(),
  financialAssets: z.number().optional().nullable(),
  intangibleAssets: z.number().optional().nullable(),
  investmentsAndAdvances: z.number().optional().nullable(),
  otherNonCurrentAssets: z.number().optional().nullable(),
  totalNonCurrentAssets: z.number().optional().nullable(),
  
  // Total Assets
  totalAssets: z.number().optional().nullable(),
  
  // Current Liabilities
  accountsPayable: z.number().optional().nullable(),
  accruedExpenses: z.number().optional().nullable(),
  shortTermDebt: z.number().optional().nullable(),
  deferredRevenue: z.number().optional().nullable(),
  taxPayable: z.number().optional().nullable(),
  pensions: z.number().optional().nullable(),
  otherCurrentLiabilities: z.number().optional().nullable(),
  totalCurrentLiabilities: z.number().optional().nullable(),
  
  // Non-current Liabilities
  longTermProvisions: z.number().optional().nullable(),
  longTermDebt: z.number().optional().nullable(),
  provisionForRisksAndCharges: z.number().optional().nullable(),
  deferredLiabilities: z.number().optional().nullable(),
  derivativeProductLiabilities: z.number().optional().nullable(),
  otherNonCurrentLiabilities: z.number().optional().nullable(),
  totalNonCurrentLiabilities: z.number().optional().nullable(),
  
  // Total Liabilities
  totalLiabilities: z.number().optional().nullable(),
  
  // Shareholders' Equity
  commonStock: z.number().optional().nullable(),
  retainedEarnings: z.number().optional().nullable(),
  otherStakeholdersEquity: z.number().optional().nullable(),
  totalStakeholdersEquity: z.number().optional().nullable(),
  additionalPaidInCapital: z.number().optional().nullable(),
  treasuryStock: z.number().optional().nullable(),
  minorityInterest: z.number().optional().nullable(),
});

// ==========================================
// Type Exports
// ==========================================

export type BalanceSheet = z.infer<typeof BalanceSheetSchema>;
export type CreateBalanceSheetInput = z.infer<typeof CreateBalanceSheetSchema>;
export type UpdateBalanceSheetInput = z.infer<typeof UpdateBalanceSheetSchema>;

// Provider-expected type aliases
export type CreateBalanceSheetData = CreateBalanceSheetInput;
export type UpdateBalanceSheetData = UpdateBalanceSheetInput;

// ==========================================
// Response Types
// ==========================================

export type BalanceSheetResponse = {
  success: boolean;
  data?: BalanceSheet;
  error?: string;
};

export type BalanceSheetsResponse = {
  success: boolean;
  data?: BalanceSheet[];
  error?: string;
};

// ==========================================
// Extended Types (with relations)
// ==========================================

export interface BalanceSheetWithRelations extends BalanceSheet {
  company?: {
    id: number;
    name: string;
  };
}