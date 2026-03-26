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
// Financial Ratios Schemas
// ==========================================

export const FinancialRatiosSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  year: z.number(),
  semester: semesterEnum.nullable(),
  quarter: quarterEnum.nullable(),
  month: monthEnum.nullable(),
  scenario: financialScenarioEnum.default('Actual'),
  fullYear: z.boolean().default(false),
  date: z.string().nullable(), // ISO date string
  
  // Liquidity ratios
  currentRatio: z.number().nullable(),
  quickRatio: z.number().nullable(),
  cashRatio: z.number().nullable(),
  operatingCashFlowRatio: z.number().nullable(),
  
  // Solvency ratios
  debtToEquityRatio: z.number().nullable(),
  debtToAssetsRatio: z.number().nullable(),
  interestCoverageRatio: z.number().nullable(),
  debtServiceCoverageRatio: z.number().nullable(),
  
  // Profitability ratios
  grossProfitMargin: z.number().nullable(),
  operatingProfitMargin: z.number().nullable(),
  netProfitMargin: z.number().nullable(),
  ebitdaMargin: z.number().nullable(),
  returnOnAssets: z.number().nullable(),
  returnOnEquity: z.number().nullable(),
  returnOnInvestedCapital: z.number().nullable(),
  
  // Efficiency ratios
  assetTurnoverRatio: z.number().nullable(),
  inventoryTurnoverRatio: z.number().nullable(),
  receivablesTurnoverRatio: z.number().nullable(),
  daysSalesOutstanding: z.number().nullable(),
  daysInventoryOutstanding: z.number().nullable(),
  daysPayablesOutstanding: z.number().nullable(),
  
  // Investment ratios
  earningsPerShare: z.number().nullable(),
  priceEarningsRatio: z.number().nullable(),
  dividendYield: z.number().nullable(),
  dividendPayoutRatio: z.number().nullable(),
  bookValuePerShare: z.number().nullable(),
  
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateFinancialRatiosSchema = z.object({
  companyId: z.number().min(1, 'Company is required'),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid'),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  scenario: financialScenarioEnum.optional().default('Actual'),
  fullYear: z.boolean().optional().default(false),
  date: z.string().optional().nullable(),
  
  // Liquidity ratios
  currentRatio: z.number().optional().nullable(),
  quickRatio: z.number().optional().nullable(),
  cashRatio: z.number().optional().nullable(),
  operatingCashFlowRatio: z.number().optional().nullable(),
  
  // Solvency ratios
  debtToEquityRatio: z.number().optional().nullable(),
  debtToAssetsRatio: z.number().optional().nullable(),
  interestCoverageRatio: z.number().optional().nullable(),
  debtServiceCoverageRatio: z.number().optional().nullable(),
  
  // Profitability ratios
  grossProfitMargin: z.number().optional().nullable(),
  operatingProfitMargin: z.number().optional().nullable(),
  netProfitMargin: z.number().optional().nullable(),
  ebitdaMargin: z.number().optional().nullable(),
  returnOnAssets: z.number().optional().nullable(),
  returnOnEquity: z.number().optional().nullable(),
  returnOnInvestedCapital: z.number().optional().nullable(),
  
  // Efficiency ratios
  assetTurnoverRatio: z.number().optional().nullable(),
  inventoryTurnoverRatio: z.number().optional().nullable(),
  receivablesTurnoverRatio: z.number().optional().nullable(),
  daysSalesOutstanding: z.number().optional().nullable(),
  daysInventoryOutstanding: z.number().optional().nullable(),
  daysPayablesOutstanding: z.number().optional().nullable(),
  
  // Investment ratios
  earningsPerShare: z.number().optional().nullable(),
  priceEarningsRatio: z.number().optional().nullable(),
  dividendYield: z.number().optional().nullable(),
  dividendPayoutRatio: z.number().optional().nullable(),
  bookValuePerShare: z.number().optional().nullable(),
  
  notes: z.string().optional().nullable(),
});

export const UpdateFinancialRatiosSchema = z.object({
  companyId: z.number().min(1, 'Company is required').optional(),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid').optional(),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  scenario: financialScenarioEnum.optional(),
  fullYear: z.boolean().optional(),
  date: z.string().optional().nullable(),
  
  // Liquidity ratios - all optional for updates
  currentRatio: z.number().optional().nullable(),
  quickRatio: z.number().optional().nullable(),
  cashRatio: z.number().optional().nullable(),
  operatingCashFlowRatio: z.number().optional().nullable(),
  
  // Solvency ratios
  debtToEquityRatio: z.number().optional().nullable(),
  debtToAssetsRatio: z.number().optional().nullable(),
  interestCoverageRatio: z.number().optional().nullable(),
  debtServiceCoverageRatio: z.number().optional().nullable(),
  
  // Profitability ratios
  grossProfitMargin: z.number().optional().nullable(),
  operatingProfitMargin: z.number().optional().nullable(),
  netProfitMargin: z.number().optional().nullable(),
  ebitdaMargin: z.number().optional().nullable(),
  returnOnAssets: z.number().optional().nullable(),
  returnOnEquity: z.number().optional().nullable(),
  returnOnInvestedCapital: z.number().optional().nullable(),
  
  // Efficiency ratios
  assetTurnoverRatio: z.number().optional().nullable(),
  inventoryTurnoverRatio: z.number().optional().nullable(),
  receivablesTurnoverRatio: z.number().optional().nullable(),
  daysSalesOutstanding: z.number().optional().nullable(),
  daysInventoryOutstanding: z.number().optional().nullable(),
  daysPayablesOutstanding: z.number().optional().nullable(),
  
  // Investment ratios
  earningsPerShare: z.number().optional().nullable(),
  priceEarningsRatio: z.number().optional().nullable(),
  dividendYield: z.number().optional().nullable(),
  dividendPayoutRatio: z.number().optional().nullable(),
  bookValuePerShare: z.number().optional().nullable(),
  
  notes: z.string().optional().nullable(),
});

// ==========================================
// Type Exports
// ==========================================

export type FinancialRatios = z.infer<typeof FinancialRatiosSchema>;
export type CreateFinancialRatiosInput = z.infer<typeof CreateFinancialRatiosSchema>;
export type UpdateFinancialRatiosInput = z.infer<typeof UpdateFinancialRatiosSchema>;

// Provider-expected type aliases
export type CreateFinancialRatiosData = CreateFinancialRatiosInput;
export type UpdateFinancialRatiosData = UpdateFinancialRatiosInput;

// ==========================================
// Response Types
// ==========================================

export type FinancialRatiosResponse = {
  success: boolean;
  data?: FinancialRatios;
  error?: string;
};

export type FinancialRatiosListResponse = {
  success: boolean;
  data?: FinancialRatios[];
  error?: string;
};

// ==========================================
// Extended Types (with relations)
// ==========================================

export interface FinancialRatiosWithRelations extends FinancialRatios {
  company?: {
    id: number;
    name: string;
  };
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Helper function to calculate ratio categories completeness
 */
export function getRatioCompleteness(ratios: FinancialRatios): {
  liquidity: number;
  solvency: number;
  profitability: number;
  efficiency: number;
  investment: number;
  overall: number;
} {
  const liquidityRatios = [ratios.currentRatio, ratios.quickRatio, ratios.cashRatio, ratios.operatingCashFlowRatio];
  const solvencyRatios = [ratios.debtToEquityRatio, ratios.debtToAssetsRatio, ratios.interestCoverageRatio, ratios.debtServiceCoverageRatio];
  const profitabilityRatios = [ratios.grossProfitMargin, ratios.operatingProfitMargin, ratios.netProfitMargin, ratios.ebitdaMargin, ratios.returnOnAssets, ratios.returnOnEquity, ratios.returnOnInvestedCapital];
  const efficiencyRatios = [ratios.assetTurnoverRatio, ratios.inventoryTurnoverRatio, ratios.receivablesTurnoverRatio, ratios.daysSalesOutstanding, ratios.daysInventoryOutstanding, ratios.daysPayablesOutstanding];
  const investmentRatios = [ratios.earningsPerShare, ratios.priceEarningsRatio, ratios.dividendYield, ratios.dividendPayoutRatio, ratios.bookValuePerShare];

  const calculateCompleteness = (ratioArray: (number | null)[]): number => {
    const nonNullCount = ratioArray.filter(ratio => ratio !== null && ratio !== undefined).length;
    return Math.round((nonNullCount / ratioArray.length) * 100);
  };

  const liquidity = calculateCompleteness(liquidityRatios);
  const solvency = calculateCompleteness(solvencyRatios);
  const profitability = calculateCompleteness(profitabilityRatios);
  const efficiency = calculateCompleteness(efficiencyRatios);
  const investment = calculateCompleteness(investmentRatios);

  const allRatios = [...liquidityRatios, ...solvencyRatios, ...profitabilityRatios, ...efficiencyRatios, ...investmentRatios];
  const overall = calculateCompleteness(allRatios);

  return {
    liquidity,
    solvency,
    profitability,
    efficiency,
    investment,
    overall
  };
}

/**
 * Helper function to get ratio category labels
 */
export function getRatioCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'liquidity': 'Liquidity Ratios',
    'solvency': 'Solvency Ratios',
    'profitability': 'Profitability Ratios',
    'efficiency': 'Efficiency Ratios',
    'investment': 'Investment Ratios'
  };
  
  return labels[category] || category;
}

/**
 * Helper function to format ratio values with appropriate decimal places
 */
export function formatRatioValue(value: number | null, type: 'ratio' | 'percentage' | 'days' = 'ratio'): string {
  if (value === null || value === undefined) return 'N/A';
  
  switch (type) {
    case 'percentage':
      return `${value.toFixed(2)}%`;
    case 'days':
      return `${value.toFixed(0)} days`;
    case 'ratio':
    default:
      return value.toFixed(4);
  }
}

/**
 * Helper function to get financial ratios by company
 */
export function getFinancialRatiosByCompany(ratios: FinancialRatios[], companyId: number): FinancialRatios[] {
  return ratios.filter(ratio => ratio.companyId === companyId);
}

/**
 * Helper function to get financial ratios by year
 */
export function getFinancialRatiosByYear(ratios: FinancialRatios[], year: number): FinancialRatios[] {
  return ratios.filter(ratio => ratio.year === year);
}

/**
 * Helper function to get financial ratios by scenario
 */
export function getFinancialRatiosByScenario(ratios: FinancialRatios[], scenario: FinancialScenario): FinancialRatios[] {
  return ratios.filter(ratio => ratio.scenario === scenario);
}