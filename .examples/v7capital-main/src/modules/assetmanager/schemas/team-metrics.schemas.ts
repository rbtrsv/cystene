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
// Team Metrics Schemas
// ==========================================

export const TeamMetricsSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  year: z.number(),
  semester: semesterEnum.nullable(),
  quarter: quarterEnum.nullable(),
  month: monthEnum.nullable(),
  scenario: financialScenarioEnum.default('Actual'),
  fullYear: z.boolean().default(false),
  date: z.string().nullable(), // ISO date string
  
  // Headcount
  totalEmployees: z.number().nullable(),
  fullTimeEmployees: z.number().nullable(),
  partTimeEmployees: z.number().nullable(),
  contractors: z.number().nullable(),
  
  // Department breakdown
  numberOfManagement: z.number().nullable(),
  numberOfSalesMarketingStaff: z.number().nullable(),
  numberOfResearchDevelopmentStaff: z.number().nullable(),
  numberOfCustomerServiceSupportStaff: z.number().nullable(),
  numberOfGeneralStaff: z.number().nullable(),
  
  // Growth and efficiency
  employeeGrowthRate: z.number().nullable(),
  
  // Retention and satisfaction
  employeeTurnoverRate: z.number().nullable(),
  averageTenureMonths: z.number().nullable(),
  
  // Staff costs
  managementCosts: z.number().nullable(),
  salesMarketingStaffCosts: z.number().nullable(),
  researchDevelopmentStaffCosts: z.number().nullable(),
  customerServiceSupportStaffCosts: z.number().nullable(),
  generalStaffCosts: z.number().nullable(),
  staffCostsTotal: z.number().nullable(),
  
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateTeamMetricsSchema = z.object({
  companyId: z.number().min(1, 'Company is required'),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid'),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  scenario: financialScenarioEnum.optional().default('Actual'),
  fullYear: z.boolean().optional().default(false),
  date: z.string().optional().nullable(),
  
  // Headcount
  totalEmployees: z.number().optional().nullable(),
  fullTimeEmployees: z.number().optional().nullable(),
  partTimeEmployees: z.number().optional().nullable(),
  contractors: z.number().optional().nullable(),
  
  // Department breakdown
  numberOfManagement: z.number().optional().nullable(),
  numberOfSalesMarketingStaff: z.number().optional().nullable(),
  numberOfResearchDevelopmentStaff: z.number().optional().nullable(),
  numberOfCustomerServiceSupportStaff: z.number().optional().nullable(),
  numberOfGeneralStaff: z.number().optional().nullable(),
  
  // Growth and efficiency
  employeeGrowthRate: z.number().optional().nullable(),
  
  // Retention and satisfaction
  employeeTurnoverRate: z.number().optional().nullable(),
  averageTenureMonths: z.number().optional().nullable(),
  
  // Staff costs
  managementCosts: z.number().optional().nullable(),
  salesMarketingStaffCosts: z.number().optional().nullable(),
  researchDevelopmentStaffCosts: z.number().optional().nullable(),
  customerServiceSupportStaffCosts: z.number().optional().nullable(),
  generalStaffCosts: z.number().optional().nullable(),
  staffCostsTotal: z.number().optional().nullable(),
  
  notes: z.string().optional().nullable(),
});

export const UpdateTeamMetricsSchema = z.object({
  companyId: z.number().min(1, 'Company is required').optional(),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid').optional(),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  scenario: financialScenarioEnum.optional(),
  fullYear: z.boolean().optional(),
  date: z.string().optional().nullable(),
  
  // Headcount - all optional for updates
  totalEmployees: z.number().optional().nullable(),
  fullTimeEmployees: z.number().optional().nullable(),
  partTimeEmployees: z.number().optional().nullable(),
  contractors: z.number().optional().nullable(),
  
  // Department breakdown
  numberOfManagement: z.number().optional().nullable(),
  numberOfSalesMarketingStaff: z.number().optional().nullable(),
  numberOfResearchDevelopmentStaff: z.number().optional().nullable(),
  numberOfCustomerServiceSupportStaff: z.number().optional().nullable(),
  numberOfGeneralStaff: z.number().optional().nullable(),
  
  // Growth and efficiency
  employeeGrowthRate: z.number().optional().nullable(),
  
  // Retention and satisfaction
  employeeTurnoverRate: z.number().optional().nullable(),
  averageTenureMonths: z.number().optional().nullable(),
  
  // Staff costs
  managementCosts: z.number().optional().nullable(),
  salesMarketingStaffCosts: z.number().optional().nullable(),
  researchDevelopmentStaffCosts: z.number().optional().nullable(),
  customerServiceSupportStaffCosts: z.number().optional().nullable(),
  generalStaffCosts: z.number().optional().nullable(),
  staffCostsTotal: z.number().optional().nullable(),
  
  notes: z.string().optional().nullable(),
});

// ==========================================
// Type Exports
// ==========================================

export type TeamMetrics = z.infer<typeof TeamMetricsSchema>;
export type CreateTeamMetricsInput = z.infer<typeof CreateTeamMetricsSchema>;
export type UpdateTeamMetricsInput = z.infer<typeof UpdateTeamMetricsSchema>;

// Provider-expected type aliases
export type CreateTeamMetricsData = CreateTeamMetricsInput;
export type UpdateTeamMetricsData = UpdateTeamMetricsInput;

// ==========================================
// Response Types
// ==========================================

export type TeamMetricsResponse = {
  success: boolean;
  data?: TeamMetrics;
  error?: string;
};

export type TeamMetricsListResponse = {
  success: boolean;
  data?: TeamMetrics[];
  error?: string;
};

// ==========================================
// Extended Types (with relations)
// ==========================================

export interface TeamMetricsWithRelations extends TeamMetrics {
  company?: {
    id: number;
    name: string;
  };
}