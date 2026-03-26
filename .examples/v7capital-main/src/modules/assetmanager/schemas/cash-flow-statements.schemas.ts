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
// Cash Flow Statement Schemas
// ==========================================

export const CashFlowStatementSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  year: z.number(),
  semester: semesterEnum.nullable(),
  quarter: quarterEnum.nullable(),
  month: monthEnum.nullable(),
  scenario: financialScenarioEnum.default('Actual'),
  periodStart: z.string().nullable(),
  periodEnd: z.string().nullable(),
  
  // Operating activities
  netIncome: z.number().nullable(),
  depreciation: z.number().nullable(),
  deferredTaxes: z.number().nullable(),
  stockBasedCompensation: z.number().nullable(),
  otherNonCashItems: z.number().nullable(),
  accountsReceivable: z.number().nullable(),
  accountsPayable: z.number().nullable(),
  otherAssetsLiabilities: z.number().nullable(),
  operatingCashFlow: z.number().nullable(),
  
  // Investing activities
  capitalExpenditures: z.number().nullable(),
  netIntangibles: z.number().nullable(),
  netAcquisitions: z.number().nullable(),
  purchaseOfInvestments: z.number().nullable(),
  saleOfInvestments: z.number().nullable(),
  otherInvestingActivity: z.number().nullable(),
  investingCashFlow: z.number().nullable(),
  
  // Financing activities
  longTermDebtIssuance: z.number().nullable(),
  longTermDebtPayments: z.number().nullable(),
  shortTermDebtIssuance: z.number().nullable(),
  commonStockIssuance: z.number().nullable(),
  commonStockRepurchase: z.number().nullable(),
  commonDividends: z.number().nullable(),
  otherFinancingCharges: z.number().nullable(),
  financingCashFlow: z.number().nullable(),
  
  // Summary
  endCashPosition: z.number().nullable(),
  incomeTaxPaid: z.number().nullable(),
  interestPaid: z.number().nullable(),
  freeCashFlow: z.number().nullable(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateCashFlowStatementSchema = z.object({
  companyId: z.number().min(1, 'Company is required'),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid'),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  scenario: financialScenarioEnum.optional().default('Actual'),
  periodStart: z.string().optional().nullable(),
  periodEnd: z.string().optional().nullable(),
  
  // Operating activities
  netIncome: z.number().optional().nullable(),
  depreciation: z.number().optional().nullable(),
  deferredTaxes: z.number().optional().nullable(),
  stockBasedCompensation: z.number().optional().nullable(),
  otherNonCashItems: z.number().optional().nullable(),
  accountsReceivable: z.number().optional().nullable(),
  accountsPayable: z.number().optional().nullable(),
  otherAssetsLiabilities: z.number().optional().nullable(),
  operatingCashFlow: z.number().optional().nullable(),
  
  // Investing activities
  capitalExpenditures: z.number().optional().nullable(),
  netIntangibles: z.number().optional().nullable(),
  netAcquisitions: z.number().optional().nullable(),
  purchaseOfInvestments: z.number().optional().nullable(),
  saleOfInvestments: z.number().optional().nullable(),
  otherInvestingActivity: z.number().optional().nullable(),
  investingCashFlow: z.number().optional().nullable(),
  
  // Financing activities
  longTermDebtIssuance: z.number().optional().nullable(),
  longTermDebtPayments: z.number().optional().nullable(),
  shortTermDebtIssuance: z.number().optional().nullable(),
  commonStockIssuance: z.number().optional().nullable(),
  commonStockRepurchase: z.number().optional().nullable(),
  commonDividends: z.number().optional().nullable(),
  otherFinancingCharges: z.number().optional().nullable(),
  financingCashFlow: z.number().optional().nullable(),
  
  // Summary
  endCashPosition: z.number().optional().nullable(),
  incomeTaxPaid: z.number().optional().nullable(),
  interestPaid: z.number().optional().nullable(),
  freeCashFlow: z.number().optional().nullable(),
});

export const UpdateCashFlowStatementSchema = z.object({
  companyId: z.number().min(1, 'Company is required').optional(),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid').optional(),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  scenario: financialScenarioEnum.optional(),
  periodStart: z.string().optional().nullable(),
  periodEnd: z.string().optional().nullable(),
  
  // Operating activities - all optional for updates
  netIncome: z.number().optional().nullable(),
  depreciation: z.number().optional().nullable(),
  deferredTaxes: z.number().optional().nullable(),
  stockBasedCompensation: z.number().optional().nullable(),
  otherNonCashItems: z.number().optional().nullable(),
  accountsReceivable: z.number().optional().nullable(),
  accountsPayable: z.number().optional().nullable(),
  otherAssetsLiabilities: z.number().optional().nullable(),
  operatingCashFlow: z.number().optional().nullable(),
  
  // Investing activities
  capitalExpenditures: z.number().optional().nullable(),
  netIntangibles: z.number().optional().nullable(),
  netAcquisitions: z.number().optional().nullable(),
  purchaseOfInvestments: z.number().optional().nullable(),
  saleOfInvestments: z.number().optional().nullable(),
  otherInvestingActivity: z.number().optional().nullable(),
  investingCashFlow: z.number().optional().nullable(),
  
  // Financing activities
  longTermDebtIssuance: z.number().optional().nullable(),
  longTermDebtPayments: z.number().optional().nullable(),
  shortTermDebtIssuance: z.number().optional().nullable(),
  commonStockIssuance: z.number().optional().nullable(),
  commonStockRepurchase: z.number().optional().nullable(),
  commonDividends: z.number().optional().nullable(),
  otherFinancingCharges: z.number().optional().nullable(),
  financingCashFlow: z.number().optional().nullable(),
  
  // Summary
  endCashPosition: z.number().optional().nullable(),
  incomeTaxPaid: z.number().optional().nullable(),
  interestPaid: z.number().optional().nullable(),
  freeCashFlow: z.number().optional().nullable(),
});

// ==========================================
// Type Exports
// ==========================================

export type CashFlowStatement = z.infer<typeof CashFlowStatementSchema>;
export type CreateCashFlowStatementInput = z.infer<typeof CreateCashFlowStatementSchema>;
export type UpdateCashFlowStatementInput = z.infer<typeof UpdateCashFlowStatementSchema>;

// Provider-expected type aliases
export type CreateCashFlowStatementData = CreateCashFlowStatementInput;
export type UpdateCashFlowStatementData = UpdateCashFlowStatementInput;

// ==========================================
// Response Types
// ==========================================

export type CashFlowStatementResponse = {
  success: boolean;
  data?: CashFlowStatement;
  error?: string;
};

export type CashFlowStatementsResponse = {
  success: boolean;
  data?: CashFlowStatement[];
  error?: string;
};

// ==========================================
// Extended Types (with relations)
// ==========================================

export interface CashFlowStatementWithRelations extends CashFlowStatement {
  company?: {
    id: number;
    name: string;
  };
}