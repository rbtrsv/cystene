import { z } from 'zod';

// ==========================================
// Enums & Types
// ==========================================

// Deal priorities
export const dealPriorityEnum = z.enum(['P1', 'P2', 'P3', 'P4', 'P5']);
export type DealPriority = z.infer<typeof dealPriorityEnum>;

// Deal statuses
export const dealStatusEnum = z.enum([
  'Initial Screening',
  'First Meeting', 
  'Follow Up',
  'Due Diligence',
  'Negotiation',
  'Term Sheet',
  'Legal Review',
  'Closing',
  'Closed',
  'Rejected',
  'On Hold'
]);
export type DealStatus = z.infer<typeof dealStatusEnum>;

// Sector types
export const sectorTypeEnum = z.enum([
  'Fintech',
  'Healthtech',
  'Ecommerce',
  'SaaS',
  'AI/ML',
  'Blockchain',
  'Cleantech',
  'Edtech',
  'Enterprise',
  'Consumer',
  'Other'
]);
export type SectorType = z.infer<typeof sectorTypeEnum>;

// ==========================================
// Deal Pipeline Schemas
// ==========================================

export const DealPipelineSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  dealName: z.string().min(1, 'Deal name is required'),
  priority: dealPriorityEnum,
  status: dealStatusEnum,
  round: z.string().min(1, 'Round is required'),
  sector: sectorTypeEnum,
  preMoneyValuation: z.number().nullable(),
  postMoneyValuation: z.number().nullable(),
  rejectionReason: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateDealPipelineSchema = z.object({
  companyId: z.number().min(1, 'Company is required'),
  dealName: z.string().min(1, 'Deal name is required'),
  priority: dealPriorityEnum,
  status: dealStatusEnum,
  round: z.string().min(1, 'Round is required'),
  sector: sectorTypeEnum,
  preMoneyValuation: z.number().optional().nullable(),
  postMoneyValuation: z.number().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const UpdateDealPipelineSchema = z.object({
  companyId: z.number().min(1, 'Company is required').optional(),
  dealName: z.string().min(1, 'Deal name is required').optional(),
  priority: dealPriorityEnum.optional(),
  status: dealStatusEnum.optional(),
  round: z.string().min(1, 'Round is required').optional(),
  sector: sectorTypeEnum.optional(),
  preMoneyValuation: z.number().optional().nullable(),
  postMoneyValuation: z.number().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ==========================================
// Type Exports
// ==========================================

export type DealPipeline = z.infer<typeof DealPipelineSchema>;
export type CreateDealPipelineInput = z.infer<typeof CreateDealPipelineSchema>;
export type UpdateDealPipelineInput = z.infer<typeof UpdateDealPipelineSchema>;

// Provider-expected type aliases
export type CreateDealPipelineData = CreateDealPipelineInput;
export type UpdateDealPipelineData = UpdateDealPipelineInput;

// ==========================================
// Response Types
// ==========================================

export type DealPipelineResponse = {
  success: boolean;
  data?: DealPipeline;
  error?: string;
};

export type DealPipelinesResponse = {
  success: boolean;
  data?: DealPipeline[];
  error?: string;
};

// ==========================================
// Extended Types (with relations)
// ==========================================

export interface DealPipelineWithRelations extends DealPipeline {
  company?: {
    id: number;
    name: string;
  };
}