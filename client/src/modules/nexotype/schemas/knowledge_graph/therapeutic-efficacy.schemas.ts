import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const DirectionEnum = z.enum(['Increases', 'Decreases', 'Ameliorates']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** TherapeuticEfficacy.direction */
export const DIRECTION_OPTIONS = [
  { label: 'Increases', value: 'Increases' },
  { label: 'Decreases', value: 'Decreases' },
  { label: 'Ameliorates', value: 'Ameliorates' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const TherapeuticEfficacySchema = z.object({
  id: z.number(),
  asset_id: z.number().int(),
  indication_id: z.number().int().nullable().optional(),
  phenotype_id: z.number().int().nullable().optional(),
  biomarker_id: z.number().int().nullable().optional(),
  direction: DirectionEnum,
  magnitude: z.string().max(50).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateTherapeuticEfficacySchema = z.object({
  asset_id: z.number().int(),
  indication_id: z.number().int().nullable().optional(),
  phenotype_id: z.number().int().nullable().optional(),
  biomarker_id: z.number().int().nullable().optional(),
  direction: DirectionEnum,
  magnitude: z.string().max(50).nullable().optional(),
});

export const UpdateTherapeuticEfficacySchema = z.object({
  asset_id: z.number().int().optional(),
  indication_id: z.number().int().nullable().optional(),
  phenotype_id: z.number().int().nullable().optional(),
  biomarker_id: z.number().int().nullable().optional(),
  direction: DirectionEnum.optional(),
  magnitude: z.string().max(50).nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type TherapeuticEfficacy = z.infer<typeof TherapeuticEfficacySchema>;
export type CreateTherapeuticEfficacy = z.infer<typeof CreateTherapeuticEfficacySchema>;
export type UpdateTherapeuticEfficacy = z.infer<typeof UpdateTherapeuticEfficacySchema>;
export type Direction = z.infer<typeof DirectionEnum>;

// ==========================================
// Response Types
// ==========================================

export type TherapeuticEfficacyResponse = {
  success: boolean;
  data?: TherapeuticEfficacy;
  error?: string;
};

export type TherapeuticEfficaciesResponse = {
  success: boolean;
  data?: TherapeuticEfficacy[];
  count?: number;
  error?: string;
};
