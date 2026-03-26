import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const LongevityTierEnum = z.enum(['S', 'A', 'B', 'C']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** Pathway.longevity_tier */
export const LONGEVITY_TIER_OPTIONS = [
  { label: 'S', value: 'S' },
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const PathwaySchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(255),
  kegg_id: z.string().max(20).nullable().optional(),
  longevity_tier: LongevityTierEnum.nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreatePathwaySchema = z.object({
  name: z.string().min(1).max(255),
  kegg_id: z.string().max(20).nullable().optional(),
  longevity_tier: LongevityTierEnum.nullable().optional(),
});

export const UpdatePathwaySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  kegg_id: z.string().max(20).nullable().optional(),
  longevity_tier: LongevityTierEnum.nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type Pathway = z.infer<typeof PathwaySchema>;
export type CreatePathway = z.infer<typeof CreatePathwaySchema>;
export type UpdatePathway = z.infer<typeof UpdatePathwaySchema>;
export type LongevityTier = z.infer<typeof LongevityTierEnum>;

// ==========================================
// Response Types
// ==========================================

export type PathwayResponse = {
  success: boolean;
  data?: Pathway;
  error?: string;
};

export type PathwaysResponse = {
  success: boolean;
  data?: Pathway[];
  count?: number;
  error?: string;
};
