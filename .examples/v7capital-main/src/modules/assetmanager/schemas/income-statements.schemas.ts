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
// Income Statement Schemas
// ==========================================

export const IncomeStatementSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  year: z.number(),
  semester: semesterEnum.nullable(),
  quarter: quarterEnum.nullable(),
  month: monthEnum.nullable(),
  scenario: financialScenarioEnum.default('Actual'),
  periodStart: z.string().nullable(), // ISO date string
  periodEnd: z.string().nullable(),   // ISO date string
  
  // Revenue section
  revenue: z.number().nullable(),
  costOfGoods: z.number().nullable(),
  grossProfit: z.number().nullable(),
  
  // Operating expenses
  researchAndDevelopment: z.number().nullable(),
  sellingGeneralAndAdministrative: z.number().nullable(),
  otherOperatingExpenses: z.number().nullable(),
  
  // Results
  operatingIncome: z.number().nullable(),
  nonOperatingInterestIncome: z.number().nullable(),
  nonOperatingInterestExpense: z.number().nullable(),
  otherIncomeExpense: z.number().nullable(),
  pretaxIncome: z.number().nullable(),
  incomeTax: z.number().nullable(),
  netIncome: z.number().nullable(),
  
  // Additional metrics
  epsBasic: z.number().nullable(),
  epsDiluted: z.number().nullable(),
  basicSharesOutstanding: z.number().nullable(),
  dilutedSharesOutstanding: z.number().nullable(),
  ebitda: z.number().nullable(),
  netIncomeContinuousOperations: z.number().nullable(),
  minorityInterests: z.number().nullable(),
  preferredStockDividends: z.number().nullable(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateIncomeStatementSchema = z.object({
  companyId: z.number().min(1, 'Company is required'),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid'),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  scenario: financialScenarioEnum.optional().default('Actual'),
  periodStart: z.string().optional().nullable(),
  periodEnd: z.string().optional().nullable(),
  
  // Revenue section
  revenue: z.number().optional().nullable(),
  costOfGoods: z.number().optional().nullable(),
  grossProfit: z.number().optional().nullable(),
  
  // Operating expenses
  researchAndDevelopment: z.number().optional().nullable(),
  sellingGeneralAndAdministrative: z.number().optional().nullable(),
  otherOperatingExpenses: z.number().optional().nullable(),
  
  // Results
  operatingIncome: z.number().optional().nullable(),
  nonOperatingInterestIncome: z.number().optional().nullable(),
  nonOperatingInterestExpense: z.number().optional().nullable(),
  otherIncomeExpense: z.number().optional().nullable(),
  pretaxIncome: z.number().optional().nullable(),
  incomeTax: z.number().optional().nullable(),
  netIncome: z.number().optional().nullable(),
  
  // Additional metrics
  epsBasic: z.number().optional().nullable(),
  epsDiluted: z.number().optional().nullable(),
  basicSharesOutstanding: z.number().optional().nullable(),
  dilutedSharesOutstanding: z.number().optional().nullable(),
  ebitda: z.number().optional().nullable(),
  netIncomeContinuousOperations: z.number().optional().nullable(),
  minorityInterests: z.number().optional().nullable(),
  preferredStockDividends: z.number().optional().nullable(),
});

export const UpdateIncomeStatementSchema = z.object({
  companyId: z.number().min(1, 'Company is required').optional(),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid').optional(),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  scenario: financialScenarioEnum.optional(),
  periodStart: z.string().optional().nullable(),
  periodEnd: z.string().optional().nullable(),
  
  // Revenue section - all optional for updates
  revenue: z.number().optional().nullable(),
  costOfGoods: z.number().optional().nullable(),
  grossProfit: z.number().optional().nullable(),
  
  // Operating expenses
  researchAndDevelopment: z.number().optional().nullable(),
  sellingGeneralAndAdministrative: z.number().optional().nullable(),
  otherOperatingExpenses: z.number().optional().nullable(),
  
  // Results
  operatingIncome: z.number().optional().nullable(),
  nonOperatingInterestIncome: z.number().optional().nullable(),
  nonOperatingInterestExpense: z.number().optional().nullable(),
  otherIncomeExpense: z.number().optional().nullable(),
  pretaxIncome: z.number().optional().nullable(),
  incomeTax: z.number().optional().nullable(),
  netIncome: z.number().optional().nullable(),
  
  // Additional metrics
  epsBasic: z.number().optional().nullable(),
  epsDiluted: z.number().optional().nullable(),
  basicSharesOutstanding: z.number().optional().nullable(),
  dilutedSharesOutstanding: z.number().optional().nullable(),
  ebitda: z.number().optional().nullable(),
  netIncomeContinuousOperations: z.number().optional().nullable(),
  minorityInterests: z.number().optional().nullable(),
  preferredStockDividends: z.number().optional().nullable(),
});

// ==========================================
// Type Exports
// ==========================================

export type IncomeStatement = z.infer<typeof IncomeStatementSchema>;
export type CreateIncomeStatementInput = z.infer<typeof CreateIncomeStatementSchema>;
export type UpdateIncomeStatementInput = z.infer<typeof UpdateIncomeStatementSchema>;

// Provider-expected type aliases
export type CreateIncomeStatementData = CreateIncomeStatementInput;
export type UpdateIncomeStatementData = UpdateIncomeStatementInput;

// ==========================================
// Response Types
// ==========================================

export type IncomeStatementResponse = {
  success: boolean;
  data?: IncomeStatement;
  error?: string;
};

export type IncomeStatementsResponse = {
  success: boolean;
  data?: IncomeStatement[];
  error?: string;
};

// ==========================================
// Extended Types (with relations)
// ==========================================

export interface IncomeStatementWithRelations extends IncomeStatement {
  company?: {
    id: number;
    name: string;
  };
}