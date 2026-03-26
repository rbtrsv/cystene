import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const PipelinePhaseEnum = z.enum(['Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Commercial']);
export const PipelineStatusEnum = z.enum(['Active', 'Terminated', 'On-Hold']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** DevelopmentPipeline.phase */
export const PIPELINE_PHASE_OPTIONS = [
  { label: 'Preclinical', value: 'Preclinical' },
  { label: 'Phase I', value: 'Phase I' },
  { label: 'Phase II', value: 'Phase II' },
  { label: 'Phase III', value: 'Phase III' },
  { label: 'Commercial', value: 'Commercial' },
] as const;

/** DevelopmentPipeline.status */
export const PIPELINE_STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Terminated', value: 'Terminated' },
  { label: 'On-Hold', value: 'On-Hold' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const DevelopmentPipelineSchema = z.object({
  id: z.number(),
  asset_id: z.number().int(),
  indication_id: z.number().int(),
  phase: PipelinePhaseEnum,
  status: PipelineStatusEnum,
  nct_number: z.string().max(20).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateDevelopmentPipelineSchema = z.object({
  asset_id: z.number().int(),
  indication_id: z.number().int(),
  phase: PipelinePhaseEnum,
  status: PipelineStatusEnum,
  nct_number: z.string().max(20).nullable().optional(),
});

export const UpdateDevelopmentPipelineSchema = z.object({
  asset_id: z.number().int().optional(),
  indication_id: z.number().int().optional(),
  phase: PipelinePhaseEnum.optional(),
  status: PipelineStatusEnum.optional(),
  nct_number: z.string().max(20).nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type DevelopmentPipeline = z.infer<typeof DevelopmentPipelineSchema>;
export type CreateDevelopmentPipeline = z.infer<typeof CreateDevelopmentPipelineSchema>;
export type UpdateDevelopmentPipeline = z.infer<typeof UpdateDevelopmentPipelineSchema>;
export type PipelinePhase = z.infer<typeof PipelinePhaseEnum>;
export type PipelineStatus = z.infer<typeof PipelineStatusEnum>;

// ==========================================
// Response Types
// ==========================================

export type DevelopmentPipelineResponse = {
  success: boolean;
  data?: DevelopmentPipeline;
  error?: string;
};

export type DevelopmentPipelinesResponse = {
  success: boolean;
  data?: DevelopmentPipeline[];
  count?: number;
  error?: string;
};
