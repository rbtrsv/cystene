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
// Customer Metrics Schemas
// ==========================================

export const CustomerMetricsSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  year: z.number(),
  semester: semesterEnum.nullable(),
  quarter: quarterEnum.nullable(),
  month: monthEnum.nullable(),
  scenario: financialScenarioEnum.default('Actual'),
  fullYear: z.boolean().default(false),
  date: z.string().nullable(), // ISO date string
  
  // Customer counts
  totalCustomers: z.number().nullable(),
  newCustomers: z.number().nullable(),
  churnedCustomers: z.number().nullable(),
  
  // User metrics
  totalUsers: z.number().nullable(),
  activeUsers: z.number().nullable(),
  totalMonthlyActiveClientUsers: z.number().nullable(),
  
  // User breakdown
  existingCustomerExistingSeatsUsers: z.number().nullable(),
  existingCustomerAdditionalSeatsUsers: z.number().nullable(),
  newCustomerNewSeatsUsers: z.number().nullable(),
  userGrowthRate: z.number().nullable(),
  
  // Addressable market metrics
  newCustomerTotalAddressableSeats: z.number().nullable(),
  newCustomerNewSeatsPercentSigned: z.number().nullable(),
  newCustomerTotalAddressableSeatsRemaining: z.number().nullable(),
  
  // Customer segments
  existingCustomerCount: z.number().nullable(),
  existingCustomerExpansionCount: z.number().nullable(),
  newCustomerCount: z.number().nullable(),
  
  // Growth metrics
  customerGrowthRate: z.number().nullable(),
  
  // Customer acquisition
  cac: z.number().nullable(),
  ltv: z.number().nullable(),
  ltvCacRatio: z.number().nullable(),
  paybackPeriod: z.number().nullable(),
  
  // Retention metrics
  customerChurnRate: z.number().nullable(),
  
  // Efficiency metrics
  customerAcquisitionEfficiency: z.number().nullable(),
  salesEfficiency: z.number().nullable(),
  
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateCustomerMetricsSchema = z.object({
  companyId: z.number().min(1, 'Company is required'),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid'),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  scenario: financialScenarioEnum.optional().default('Actual'),
  fullYear: z.boolean().optional().default(false),
  date: z.string().optional().nullable(),
  
  // Customer counts
  totalCustomers: z.number().optional().nullable(),
  newCustomers: z.number().optional().nullable(),
  churnedCustomers: z.number().optional().nullable(),
  
  // User metrics
  totalUsers: z.number().optional().nullable(),
  activeUsers: z.number().optional().nullable(),
  totalMonthlyActiveClientUsers: z.number().optional().nullable(),
  
  // User breakdown
  existingCustomerExistingSeatsUsers: z.number().optional().nullable(),
  existingCustomerAdditionalSeatsUsers: z.number().optional().nullable(),
  newCustomerNewSeatsUsers: z.number().optional().nullable(),
  userGrowthRate: z.number().optional().nullable(),
  
  // Addressable market metrics
  newCustomerTotalAddressableSeats: z.number().optional().nullable(),
  newCustomerNewSeatsPercentSigned: z.number().optional().nullable(),
  newCustomerTotalAddressableSeatsRemaining: z.number().optional().nullable(),
  
  // Customer segments
  existingCustomerCount: z.number().optional().nullable(),
  existingCustomerExpansionCount: z.number().optional().nullable(),
  newCustomerCount: z.number().optional().nullable(),
  
  // Growth metrics
  customerGrowthRate: z.number().optional().nullable(),
  
  // Customer acquisition
  cac: z.number().optional().nullable(),
  ltv: z.number().optional().nullable(),
  ltvCacRatio: z.number().optional().nullable(),
  paybackPeriod: z.number().optional().nullable(),
  
  // Retention metrics
  customerChurnRate: z.number().optional().nullable(),
  
  // Efficiency metrics
  customerAcquisitionEfficiency: z.number().optional().nullable(),
  salesEfficiency: z.number().optional().nullable(),
  
  notes: z.string().optional().nullable(),
});

export const UpdateCustomerMetricsSchema = z.object({
  companyId: z.number().min(1, 'Company is required').optional(),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid').optional(),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  scenario: financialScenarioEnum.optional(),
  fullYear: z.boolean().optional(),
  date: z.string().optional().nullable(),
  
  // Customer counts - all optional for updates
  totalCustomers: z.number().optional().nullable(),
  newCustomers: z.number().optional().nullable(),
  churnedCustomers: z.number().optional().nullable(),
  
  // User metrics
  totalUsers: z.number().optional().nullable(),
  activeUsers: z.number().optional().nullable(),
  totalMonthlyActiveClientUsers: z.number().optional().nullable(),
  
  // User breakdown
  existingCustomerExistingSeatsUsers: z.number().optional().nullable(),
  existingCustomerAdditionalSeatsUsers: z.number().optional().nullable(),
  newCustomerNewSeatsUsers: z.number().optional().nullable(),
  userGrowthRate: z.number().optional().nullable(),
  
  // Addressable market metrics
  newCustomerTotalAddressableSeats: z.number().optional().nullable(),
  newCustomerNewSeatsPercentSigned: z.number().optional().nullable(),
  newCustomerTotalAddressableSeatsRemaining: z.number().optional().nullable(),
  
  // Customer segments
  existingCustomerCount: z.number().optional().nullable(),
  existingCustomerExpansionCount: z.number().optional().nullable(),
  newCustomerCount: z.number().optional().nullable(),
  
  // Growth metrics
  customerGrowthRate: z.number().optional().nullable(),
  
  // Customer acquisition
  cac: z.number().optional().nullable(),
  ltv: z.number().optional().nullable(),
  ltvCacRatio: z.number().optional().nullable(),
  paybackPeriod: z.number().optional().nullable(),
  
  // Retention metrics
  customerChurnRate: z.number().optional().nullable(),
  
  // Efficiency metrics
  customerAcquisitionEfficiency: z.number().optional().nullable(),
  salesEfficiency: z.number().optional().nullable(),
  
  notes: z.string().optional().nullable(),
});

// ==========================================
// Type Exports
// ==========================================

export type CustomerMetrics = z.infer<typeof CustomerMetricsSchema>;
export type CreateCustomerMetricsInput = z.infer<typeof CreateCustomerMetricsSchema>;
export type UpdateCustomerMetricsInput = z.infer<typeof UpdateCustomerMetricsSchema>;

// Provider-expected type aliases
export type CreateCustomerMetricsData = CreateCustomerMetricsInput;
export type UpdateCustomerMetricsData = UpdateCustomerMetricsInput;

// ==========================================
// Response Types
// ==========================================

export type CustomerMetricsResponse = {
  success: boolean;
  data?: CustomerMetrics;
  error?: string;
};

export type CustomerMetricsListResponse = {
  success: boolean;
  data?: CustomerMetrics[];
  error?: string;
};

// ==========================================
// Extended Types (with relations)
// ==========================================

export interface CustomerMetricsWithRelations extends CustomerMetrics {
  company?: {
    id: number;
    name: string;
  };
}