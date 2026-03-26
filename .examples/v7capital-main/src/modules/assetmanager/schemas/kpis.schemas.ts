import { z } from 'zod';

// ==========================================
// Enums & Types
// ==========================================

// KPI data types
export const kpiDataTypeEnum = z.enum(['DECIMAL', 'INTEGER', 'STRING']);
export type KpiDataType = z.infer<typeof kpiDataTypeEnum>;

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
// KPI Schemas
// ==========================================

export const KpiSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  name: z.string().min(1, 'KPI name is required'),
  description: z.string().nullable(),
  dataType: kpiDataTypeEnum.default('DECIMAL'),
  isCalculated: z.boolean().default(false),
  formula: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateKpiSchema = z.object({
  companyId: z.number().min(1, 'Company is required'),
  name: z.string().min(1, 'KPI name is required'),
  description: z.string().optional().nullable(),
  dataType: kpiDataTypeEnum.optional().default('DECIMAL'),
  isCalculated: z.boolean().optional().default(false),
  formula: z.string().optional().nullable(),
});

export const UpdateKpiSchema = z.object({
  companyId: z.number().min(1, 'Company is required').optional(),
  name: z.string().min(1, 'KPI name is required').optional(),
  description: z.string().optional().nullable(),
  dataType: kpiDataTypeEnum.optional(),
  isCalculated: z.boolean().optional(),
  formula: z.string().optional().nullable(),
});

// ==========================================
// KPI Value Schemas
// ==========================================

export const KpiValueSchema = z.object({
  id: z.number(),
  kpiId: z.number(),
  date: z.string(), // ISO date string
  year: z.number(),
  semester: semesterEnum.nullable(),
  quarter: quarterEnum.nullable(),
  month: monthEnum.nullable(),
  fullYear: z.boolean().default(false),
  scenario: financialScenarioEnum.default('Actual'),
  value: z.number().nullable(),
  calculatedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateKpiValueSchema = z.object({
  kpiId: z.number().min(1, 'KPI is required'),
  date: z.string().min(1, 'Date is required'),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid'),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  fullYear: z.boolean().optional().default(false),
  scenario: financialScenarioEnum.optional().default('Actual'),
  value: z.number().optional().nullable(),
  calculatedAt: z.string().optional().nullable(),
});

export const UpdateKpiValueSchema = z.object({
  kpiId: z.number().min(1, 'KPI is required').optional(),
  date: z.string().optional(),
  year: z.number().min(1900, 'Year must be valid').max(2100, 'Year must be valid').optional(),
  semester: semesterEnum.optional().nullable(),
  quarter: quarterEnum.optional().nullable(),
  month: monthEnum.optional().nullable(),
  fullYear: z.boolean().optional(),
  scenario: financialScenarioEnum.optional(),
  value: z.number().optional().nullable(),
  calculatedAt: z.string().optional().nullable(),
});

// ==========================================
// Type Exports
// ==========================================

// KPI types
export type Kpi = z.infer<typeof KpiSchema>;
export type CreateKpiInput = z.infer<typeof CreateKpiSchema>;
export type UpdateKpiInput = z.infer<typeof UpdateKpiSchema>;

// KPI Value types
export type KpiValue = z.infer<typeof KpiValueSchema>;
export type CreateKpiValueInput = z.infer<typeof CreateKpiValueSchema>;
export type UpdateKpiValueInput = z.infer<typeof UpdateKpiValueSchema>;

// Provider-expected type aliases
export type CreateKpiData = CreateKpiInput;
export type UpdateKpiData = UpdateKpiInput;
export type CreateKpiValueData = CreateKpiValueInput;
export type UpdateKpiValueData = UpdateKpiValueInput;

// ==========================================
// Response Types
// ==========================================

// KPI Response types
export type KpiResponse = {
  success: boolean;
  data?: Kpi;
  error?: string;
};

export type KpisResponse = {
  success: boolean;
  data?: Kpi[];
  error?: string;
};

// KPI Value Response types
export type KpiValueResponse = {
  success: boolean;
  data?: KpiValue;
  error?: string;
};

export type KpiValuesResponse = {
  success: boolean;
  data?: KpiValue[];
  error?: string;
};

export type KpiValuesWithRelationsResponse = {
  success: boolean;
  data?: KpiValueWithRelations[];
  error?: string;
};

export type KpiValueWithRelationsResponse = {
  success: boolean;
  data?: KpiValueWithRelations;
  error?: string;
};

// ==========================================
// Extended Types (with relations)
// ==========================================

export interface KpiWithRelations extends Kpi {
  company?: {
    id: number;
    name: string;
  };
  values?: KpiValue[];
}

export interface KpiValueWithRelations extends KpiValue {
  kpi?: {
    id?: number;
    name?: string;
    companyId?: number;
    description?: string;
    dataType?: KpiDataType;
    isCalculated?: boolean;
    formula?: string;
  };
}

export interface KpiWithLatestValue extends Kpi {
  latestValue?: {
    value: number | null;
    date: string;
    scenario: FinancialScenario;
  };
}