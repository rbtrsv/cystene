import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const VariantPhenotypeSchema = z.object({
  id: z.number(),
  variant_id: z.number().int(),
  phenotype_id: z.number().int(),
  effect_size: z.string().max(50).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateVariantPhenotypeSchema = z.object({
  variant_id: z.number().int(),
  phenotype_id: z.number().int(),
  effect_size: z.string().max(50).nullable().optional(),
});

export const UpdateVariantPhenotypeSchema = z.object({
  variant_id: z.number().int().optional(),
  phenotype_id: z.number().int().optional(),
  effect_size: z.string().max(50).nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type VariantPhenotype = z.infer<typeof VariantPhenotypeSchema>;
export type CreateVariantPhenotype = z.infer<typeof CreateVariantPhenotypeSchema>;
export type UpdateVariantPhenotype = z.infer<typeof UpdateVariantPhenotypeSchema>;

// ==========================================
// Response Types
// ==========================================

export type VariantPhenotypeResponse = {
  success: boolean;
  data?: VariantPhenotype;
  error?: string;
};

export type VariantPhenotypesResponse = {
  success: boolean;
  data?: VariantPhenotype[];
  count?: number;
  error?: string;
};
