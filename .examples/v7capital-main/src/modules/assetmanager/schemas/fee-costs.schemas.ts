import { z } from 'zod';

// ==========================================
// Enums & Types
// ==========================================

// Fee and cost types
export const feeCostTypeEnum = z.enum([
  'MANAGEMENT',
  'PERFORMANCE', 
  'SETUP',
  'ADMINISTRATIVE',
  'LEGAL',
  'AUDIT',
  'CUSTODIAN',
  'OTHER'
]);
export type FeeCostType = z.infer<typeof feeCostTypeEnum>;

// Frequencies
export const frequencyEnum = z.enum([
  'ONE_TIME',
  'MONTHLY',
  'QUARTERLY', 
  'ANNUAL'
]);
export type Frequency = z.infer<typeof frequencyEnum>;

// ==========================================
// Fee Costs Schemas
// ==========================================

export const FeeCostSchema = z.object({
  id: z.number(),
  feeCostType: feeCostTypeEnum,
  fundId: z.number(),
  roundId: z.number().nullable(),
  feeCostName: z.string().nullable(),
  frequency: frequencyEnum,
  amount: z.number(),
  description: z.string().nullable(),
  date: z.date(), // Date object for PostgreSQL date field
  transactionReference: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateFeeCostSchema = z.object({
  feeCostType: feeCostTypeEnum,
  fundId: z.number().min(1, 'Fund is required'),
  roundId: z.number().optional().nullable(),
  feeCostName: z.string().optional().nullable(),
  frequency: frequencyEnum,
  amount: z.number().min(0, 'Amount must be positive'),
  description: z.string().optional().nullable(),
  date: z.date().or(z.string()), // Allow string input for dates
  transactionReference: z.string().optional().nullable(),
});

export const UpdateFeeCostSchema = z.object({
  feeCostType: feeCostTypeEnum.optional(),
  fundId: z.number().min(1, 'Fund is required').optional(),
  roundId: z.number().optional().nullable(),
  feeCostName: z.string().optional().nullable(),
  frequency: frequencyEnum.optional(),
  amount: z.number().min(0, 'Amount must be positive').optional(),
  description: z.string().optional().nullable(),
  date: z.date().or(z.string()).optional(),
  transactionReference: z.string().optional().nullable(),
});

// ==========================================
// Helper functions
// ==========================================

export function getFeeCostTypeLabel(type: FeeCostType): string {
  const labels: Record<FeeCostType, string> = {
    'MANAGEMENT': 'Management',
    'PERFORMANCE': 'Performance',
    'SETUP': 'Setup',
    'ADMINISTRATIVE': 'Administrative',
    'LEGAL': 'Legal',
    'AUDIT': 'Audit',
    'CUSTODIAN': 'Custodian',
    'OTHER': 'Other',
  };
  
  return labels[type] || type;
}

export function getFrequencyLabel(frequency: Frequency): string {
  const labels: Record<Frequency, string> = {
    'ONE_TIME': 'One-time',
    'MONTHLY': 'Monthly',
    'QUARTERLY': 'Quarterly',
    'ANNUAL': 'Annual',
  };
  
  return labels[frequency] || frequency;
}

export type FeeCost = z.infer<typeof FeeCostSchema>;
export type CreateFeeCostInput = z.infer<typeof CreateFeeCostSchema>;
export type UpdateFeeCostInput = z.infer<typeof UpdateFeeCostSchema>;

// Provider-expected type aliases
export type CreateFeeCostData = CreateFeeCostInput;
export type UpdateFeeCostData = UpdateFeeCostInput;

// ==========================================
// Response Types
// ==========================================

export type FeeCostResponse = {
  success: boolean;
  data?: FeeCost;
  error?: string;
};

export type FeeCostsResponse = {
  success: boolean;
  data?: FeeCost[];
  error?: string;
};

// ==========================================
// Extended Types (with relations)
// ==========================================

export interface FeeCostWithRelations extends FeeCost {
  fund?: {
    id: number;
    name: string;
  };
  round?: {
    id: number;
    roundName: string;
    roundType: string;
  };
}