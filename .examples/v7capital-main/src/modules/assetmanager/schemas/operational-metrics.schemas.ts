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
// Operational Metrics Schemas
// ==========================================

export const OperationalMetricsSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  year: z.number(),
  semester: semesterEnum.nullable(),
  quarter: quarterEnum.nullable(),
  month: monthEnum.nullable(),
  scenario: financialScenarioEnum.default('Actual'),
  fullYear: z.boolean().default(false),
  date: z.string().nullable(), // ISO date string
  
  // Cash metrics
  burnRate: z.number().nullable(),
  runwayMonths: z.number().nullable(),
  runwayGross: z.number().nullable(),
  runwayNet: z.number().nullable(),
  
  // Efficiency metrics
  burnMultiple: z.number().nullable(),
  ruleOf40: z.number().nullable(),
  
  // Unit economics
  grossMargin: z.number().nullable(),
  contributionMargin: z.number().nullable(),
  
  // Productivity metrics
  revenuePerEmployee: z.number().nullable(),
  profitPerEmployee: z.number().nullable(),
  
  // Investment metrics
  capitalEfficiency: z.number().nullable(),
  cashConversionCycle: z.number().nullable(),
  
  // Capex / Operating metrics
  capex: z.number().nullable(),
  ebitda: z.number().nullable(),
  totalCosts: z.number().nullable(),
  
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateOperationalMetricsSchema = z.object({
  companyId: z.number().min(1, 'Company is required'),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid'),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  scenario: financialScenarioEnum.optional().default('Actual'),
  fullYear: z.boolean().optional().default(false),
  date: z.string().optional().nullable(),
  
  // Cash metrics
  burnRate: z.number().optional().nullable(),
  runwayMonths: z.number().optional().nullable(),
  runwayGross: z.number().optional().nullable(),
  runwayNet: z.number().optional().nullable(),
  
  // Efficiency metrics
  burnMultiple: z.number().optional().nullable(),
  ruleOf40: z.number().optional().nullable(),
  
  // Unit economics
  grossMargin: z.number().optional().nullable(),
  contributionMargin: z.number().optional().nullable(),
  
  // Productivity metrics
  revenuePerEmployee: z.number().optional().nullable(),
  profitPerEmployee: z.number().optional().nullable(),
  
  // Investment metrics
  capitalEfficiency: z.number().optional().nullable(),
  cashConversionCycle: z.number().optional().nullable(),
  
  // Capex / Operating metrics
  capex: z.number().optional().nullable(),
  ebitda: z.number().optional().nullable(),
  totalCosts: z.number().optional().nullable(),
  
  notes: z.string().optional().nullable(),
});

export const UpdateOperationalMetricsSchema = z.object({
  companyId: z.number().min(1, 'Company is required').optional(),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid').optional(),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  scenario: financialScenarioEnum.optional(),
  fullYear: z.boolean().optional(),
  date: z.string().optional().nullable(),
  
  // Cash metrics - all optional for updates
  burnRate: z.number().optional().nullable(),
  runwayMonths: z.number().optional().nullable(),
  runwayGross: z.number().optional().nullable(),
  runwayNet: z.number().optional().nullable(),
  
  // Efficiency metrics
  burnMultiple: z.number().optional().nullable(),
  ruleOf40: z.number().optional().nullable(),
  
  // Unit economics
  grossMargin: z.number().optional().nullable(),
  contributionMargin: z.number().optional().nullable(),
  
  // Productivity metrics
  revenuePerEmployee: z.number().optional().nullable(),
  profitPerEmployee: z.number().optional().nullable(),
  
  // Investment metrics
  capitalEfficiency: z.number().optional().nullable(),
  cashConversionCycle: z.number().optional().nullable(),
  
  // Capex / Operating metrics
  capex: z.number().optional().nullable(),
  ebitda: z.number().optional().nullable(),
  totalCosts: z.number().optional().nullable(),
  
  notes: z.string().optional().nullable(),
});

// ==========================================
// Type Exports
// ==========================================

export type OperationalMetrics = z.infer<typeof OperationalMetricsSchema>;
export type CreateOperationalMetricsInput = z.infer<typeof CreateOperationalMetricsSchema>;
export type UpdateOperationalMetricsInput = z.infer<typeof UpdateOperationalMetricsSchema>;

// Provider-expected type aliases
export type CreateOperationalMetricsData = CreateOperationalMetricsInput;
export type UpdateOperationalMetricsData = UpdateOperationalMetricsInput;

// ==========================================
// Response Types
// ==========================================

export type OperationalMetricsResponse = {
  success: boolean;
  data?: OperationalMetrics;
  error?: string;
};

export type OperationalMetricsListResponse = {
  success: boolean;
  data?: OperationalMetrics[];
  error?: string;
};

// ==========================================
// Extended Types (with relations)
// ==========================================

export interface OperationalMetricsWithRelations extends OperationalMetrics {
  company?: {
    id: number;
    name: string;
  };
}