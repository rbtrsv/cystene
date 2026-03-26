import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const PhenotypeSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(255),
  hpo_id: z.string().max(20).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreatePhenotypeSchema = z.object({
  name: z.string().min(1).max(255),
  hpo_id: z.string().max(20).nullable().optional(),
});

export const UpdatePhenotypeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  hpo_id: z.string().max(20).nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type Phenotype = z.infer<typeof PhenotypeSchema>;
export type CreatePhenotype = z.infer<typeof CreatePhenotypeSchema>;
export type UpdatePhenotype = z.infer<typeof UpdatePhenotypeSchema>;

// ==========================================
// Response Types
// ==========================================

export type PhenotypeResponse = {
  success: boolean;
  data?: Phenotype;
  error?: string;
};

export type PhenotypesResponse = {
  success: boolean;
  data?: Phenotype[];
  count?: number;
  error?: string;
};
