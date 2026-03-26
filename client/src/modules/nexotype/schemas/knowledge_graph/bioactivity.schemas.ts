import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const ActivityTypeEnum = z.enum(['Activator', 'Senolytic', 'NAD+ Booster']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** BioActivity.activity_type */
export const ACTIVITY_TYPE_OPTIONS = [
  { label: 'Activator', value: 'Activator' },
  { label: 'Senolytic', value: 'Senolytic' },
  { label: 'NAD+ Booster', value: 'NAD+ Booster' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const BioactivitySchema = z.object({
  id: z.number(),
  asset_id: z.number().int(),
  pathway_id: z.number().int(),
  activity_type: ActivityTypeEnum,
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateBioactivitySchema = z.object({
  asset_id: z.number().int(),
  pathway_id: z.number().int(),
  activity_type: ActivityTypeEnum,
});

export const UpdateBioactivitySchema = z.object({
  asset_id: z.number().int().optional(),
  pathway_id: z.number().int().optional(),
  activity_type: ActivityTypeEnum.optional(),
});

// ==========================================
// Types
// ==========================================

export type Bioactivity = z.infer<typeof BioactivitySchema>;
export type CreateBioactivity = z.infer<typeof CreateBioactivitySchema>;
export type UpdateBioactivity = z.infer<typeof UpdateBioactivitySchema>;
export type ActivityType = z.infer<typeof ActivityTypeEnum>;

// ==========================================
// Response Types
// ==========================================

export type BioactivityResponse = {
  success: boolean;
  data?: Bioactivity;
  error?: string;
};

export type BioactivitiesResponse = {
  success: boolean;
  data?: Bioactivity[];
  count?: number;
  error?: string;
};
