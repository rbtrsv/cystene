import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const GeneSchema = z.object({
  id: z.number(),
  organism_id: z.number().int(),
  hgnc_symbol: z.string().min(1).max(50),
  ensembl_gene_id: z.string().min(1).max(50),
  chromosome: z.string().min(1).max(10),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateGeneSchema = z.object({
  organism_id: z.number().int(),
  hgnc_symbol: z.string().min(1).max(50),
  ensembl_gene_id: z.string().min(1).max(50),
  chromosome: z.string().min(1).max(10),
});

export const UpdateGeneSchema = z.object({
  organism_id: z.number().int().optional(),
  hgnc_symbol: z.string().min(1).max(50).optional(),
  ensembl_gene_id: z.string().min(1).max(50).optional(),
  chromosome: z.string().min(1).max(10).optional(),
});

// ==========================================
// Types
// ==========================================

export type Gene = z.infer<typeof GeneSchema>;
export type CreateGene = z.infer<typeof CreateGeneSchema>;
export type UpdateGene = z.infer<typeof UpdateGeneSchema>;

// ==========================================
// Response Types
// ==========================================

export type GeneResponse = {
  success: boolean;
  data?: Gene;
  error?: string;
};

export type GenesResponse = {
  success: boolean;
  data?: Gene[];
  count?: number;
  error?: string;
};
