import { z } from 'zod';

// ==========================================
// Core Performance Types
// ==========================================

export const PerformanceMetricSchema = z.object({
  irr: z.number().nullable(),
  irrPercentage: z.number().nullable(),
  tvpi: z.number().nullable(),
  dpi: z.number().nullable(),
  rvpi: z.number().nullable(),
  totalInvested: z.number(),
  totalReturned: z.number(),
  fairValue: z.number(),
  netCashFlow: z.number(),
  totalFees: z.number().optional(),
  feesBreakdown: z.array(z.object({
    name: z.string(),
    type: z.string(),
    amount: z.number(),
    date: z.string(),
    frequency: z.string()
  })).optional(),
  calculatedAt: z.date(),
  isValid: z.boolean()
});

// ==========================================
// Fund Performance Schemas
// ==========================================

export const FundPerformanceParamsSchema = z.object({
  fundId: z.number().positive(),
  endDate: z.date().optional()
});

export const FundPerformanceSchema = PerformanceMetricSchema.extend({
  fundId: z.number(),
  fundName: z.string()
});

export const FundPerformanceResponseSchema = z.object({
  success: z.boolean(),
  data: FundPerformanceSchema.optional(),
  error: z.string().optional()
});

export const FundsPerformanceResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(FundPerformanceSchema).optional(),
  error: z.string().optional()
});

// ==========================================
// Round Performance Schemas
// ==========================================

export const RoundPerformanceParamsSchema = z.object({
  fundId: z.number().positive(),
  roundId: z.number().positive(),
  endDate: z.date().optional()
});

export const RoundPerformanceSchema = PerformanceMetricSchema.extend({
  fundId: z.number(),
  fundName: z.string(),
  roundId: z.number(),
  roundName: z.string()
});

export const RoundPerformanceResponseSchema = z.object({
  success: z.boolean(),
  data: RoundPerformanceSchema.optional(),
  error: z.string().optional()
});

// ==========================================
// Company Performance Schemas
// ==========================================

export const CompanyPerformanceParamsSchema = z.object({
  companyId: z.number().positive(),
  endDate: z.date().optional()
});

export const CompanyPerformanceSchema = PerformanceMetricSchema.extend({
  companyId: z.number(),
  companyName: z.string(),
  cashFlowCount: z.number()
});

export const CompanyPerformanceResponseSchema = z.object({
  success: z.boolean(),
  data: CompanyPerformanceSchema.optional(),
  error: z.string().optional()
});

export const CompaniesPerformanceResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(CompanyPerformanceSchema).optional(),
  error: z.string().optional()
});

// ==========================================
// Stakeholder Performance Schemas
// ==========================================

export const StakeholderPerformanceParamsSchema = z.object({
  stakeholderId: z.number().positive(),
  fundId: z.number().positive(),
  endDate: z.date().optional()
});

export const StakeholderPerformanceSchema = PerformanceMetricSchema.extend({
  stakeholderId: z.number(),
  stakeholderName: z.string(),
  fundId: z.number(),
  fundName: z.string().optional(),
  ownershipPercentage: z.number(),
  firstInvestmentDate: z.date()
});

export const StakeholderPerformanceResponseSchema = z.object({
  success: z.boolean(),
  data: StakeholderPerformanceSchema.optional(),
  error: z.string().optional()
});

export const StakeholdersPerformanceResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(StakeholderPerformanceSchema).optional(),
  error: z.string().optional()
});

// ==========================================
// Validation Functions
// ==========================================

export function validateFundPerformanceParams(params: unknown) {
  try {
    const data = FundPerformanceParamsSchema.parse(params);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function validateRoundPerformanceParams(params: unknown) {
  try {
    const data = RoundPerformanceParamsSchema.parse(params);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function validateCompanyPerformanceParams(params: unknown) {
  try {
    const data = CompanyPerformanceParamsSchema.parse(params);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function validateStakeholderPerformanceParams(params: unknown) {
  try {
    const data = StakeholderPerformanceParamsSchema.parse(params);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// TypeScript Types (inferred from schemas)
// ==========================================

export type PerformanceMetric = z.infer<typeof PerformanceMetricSchema>;

export type FundPerformanceParams = z.infer<typeof FundPerformanceParamsSchema>;
export type FundPerformance = z.infer<typeof FundPerformanceSchema>;
export type FundPerformanceResponse = z.infer<typeof FundPerformanceResponseSchema>;
export type FundsPerformanceResponse = z.infer<typeof FundsPerformanceResponseSchema>;

export type RoundPerformanceParams = z.infer<typeof RoundPerformanceParamsSchema>;
export type RoundPerformance = z.infer<typeof RoundPerformanceSchema>;
export type RoundPerformanceResponse = z.infer<typeof RoundPerformanceResponseSchema>;

export type CompanyPerformanceParams = z.infer<typeof CompanyPerformanceParamsSchema>;
export type CompanyPerformance = z.infer<typeof CompanyPerformanceSchema>;
export type CompanyPerformanceResponse = z.infer<typeof CompanyPerformanceResponseSchema>;
export type CompaniesPerformanceResponse = z.infer<typeof CompaniesPerformanceResponseSchema>;

export type StakeholderPerformanceParams = z.infer<typeof StakeholderPerformanceParamsSchema>;
export type StakeholderPerformance = z.infer<typeof StakeholderPerformanceSchema>;
export type StakeholderPerformanceResponse = z.infer<typeof StakeholderPerformanceResponseSchema>;
export type StakeholdersPerformanceResponse = z.infer<typeof StakeholdersPerformanceResponseSchema>;