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
// Revenue Metrics Schemas
// ==========================================

export const RevenueMetricsSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  year: z.number(),
  semester: semesterEnum.nullable(),
  quarter: quarterEnum.nullable(),
  month: monthEnum.nullable(),
  scenario: financialScenarioEnum.default('Actual'),
  fullYear: z.boolean().default(false),
  date: z.string().nullable(), // ISO date string
  
  // Core revenue metrics
  recurringRevenue: z.number().nullable(),
  nonRecurringRevenue: z.number().nullable(),
  revenueGrowthRate: z.number().nullable(),
  
  // Revenue breakdown
  existingCustomerExistingSeatsRevenue: z.number().nullable(),
  existingCustomerAdditionalSeatsRevenue: z.number().nullable(),
  newCustomerNewSeatsRevenue: z.number().nullable(),
  discountsAndRefunds: z.number().nullable(),
  
  // SaaS-specific metrics
  arr: z.number().nullable(),
  mrr: z.number().nullable(),
  
  // Per customer metrics
  averageRevenuePerCustomer: z.number().nullable(),
  averageContractValue: z.number().nullable(),
  
  // Retention metrics
  revenueChurnRate: z.number().nullable(),
  netRevenueRetention: z.number().nullable(),
  grossRevenueRetention: z.number().nullable(),
  
  // Cohort growth rates
  growthRateCohort1: z.number().nullable(),
  growthRateCohort2: z.number().nullable(),
  growthRateCohort3: z.number().nullable(),
  
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateRevenueMetricsSchema = z.object({
  companyId: z.number().min(1, 'Company is required'),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid'),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  scenario: financialScenarioEnum.optional().default('Actual'),
  fullYear: z.boolean().optional().default(false),
  date: z.string().optional().nullable(),
  
  // Core revenue metrics
  recurringRevenue: z.number().optional().nullable(),
  nonRecurringRevenue: z.number().optional().nullable(),
  revenueGrowthRate: z.number().optional().nullable(),
  
  // Revenue breakdown
  existingCustomerExistingSeatsRevenue: z.number().optional().nullable(),
  existingCustomerAdditionalSeatsRevenue: z.number().optional().nullable(),
  newCustomerNewSeatsRevenue: z.number().optional().nullable(),
  discountsAndRefunds: z.number().optional().nullable(),
  
  // SaaS-specific metrics
  arr: z.number().optional().nullable(),
  mrr: z.number().optional().nullable(),
  
  // Per customer metrics
  averageRevenuePerCustomer: z.number().optional().nullable(),
  averageContractValue: z.number().optional().nullable(),
  
  // Retention metrics
  revenueChurnRate: z.number().optional().nullable(),
  netRevenueRetention: z.number().optional().nullable(),
  grossRevenueRetention: z.number().optional().nullable(),
  
  // Cohort growth rates
  growthRateCohort1: z.number().optional().nullable(),
  growthRateCohort2: z.number().optional().nullable(),
  growthRateCohort3: z.number().optional().nullable(),
  
  notes: z.string().optional().nullable(),
});

export const UpdateRevenueMetricsSchema = z.object({
  companyId: z.number().min(1, 'Company is required').optional(),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid').optional(),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  scenario: financialScenarioEnum.optional(),
  fullYear: z.boolean().optional(),
  date: z.string().optional().nullable(),
  
  // Core revenue metrics - all optional for updates
  recurringRevenue: z.number().optional().nullable(),
  nonRecurringRevenue: z.number().optional().nullable(),
  revenueGrowthRate: z.number().optional().nullable(),
  
  // Revenue breakdown
  existingCustomerExistingSeatsRevenue: z.number().optional().nullable(),
  existingCustomerAdditionalSeatsRevenue: z.number().optional().nullable(),
  newCustomerNewSeatsRevenue: z.number().optional().nullable(),
  discountsAndRefunds: z.number().optional().nullable(),
  
  // SaaS-specific metrics
  arr: z.number().optional().nullable(),
  mrr: z.number().optional().nullable(),
  
  // Per customer metrics
  averageRevenuePerCustomer: z.number().optional().nullable(),
  averageContractValue: z.number().optional().nullable(),
  
  // Retention metrics
  revenueChurnRate: z.number().optional().nullable(),
  netRevenueRetention: z.number().optional().nullable(),
  grossRevenueRetention: z.number().optional().nullable(),
  
  // Cohort growth rates
  growthRateCohort1: z.number().optional().nullable(),
  growthRateCohort2: z.number().optional().nullable(),
  growthRateCohort3: z.number().optional().nullable(),
  
  notes: z.string().optional().nullable(),
});

// ==========================================
// Type Exports
// ==========================================

export type RevenueMetrics = z.infer<typeof RevenueMetricsSchema>;
export type CreateRevenueMetricsInput = z.infer<typeof CreateRevenueMetricsSchema>;
export type UpdateRevenueMetricsInput = z.infer<typeof UpdateRevenueMetricsSchema>;

// Provider-expected type aliases
export type CreateRevenueMetricsData = CreateRevenueMetricsInput;
export type UpdateRevenueMetricsData = UpdateRevenueMetricsInput;

// ==========================================
// Response Types
// ==========================================

export type RevenueMetricsResponse = {
  success: boolean;
  data?: RevenueMetrics;
  error?: string;
};

export type RevenueMetricsListResponse = {
  success: boolean;
  data?: RevenueMetrics[];
  error?: string;
};

// ==========================================
// Extended Types (with relations)
// ==========================================

export interface RevenueMetricsWithRelations extends RevenueMetrics {
  company?: {
    id: number;
    name: string;
  };
}