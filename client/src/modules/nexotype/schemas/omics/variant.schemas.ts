import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const VariantSchema = z.object({
  id: z.number(),
  gene_id: z.number().int(),
  db_snp_id: z.string().min(1).max(20),
  hgvs_c: z.string().max(50).nullable(),
  hgvs_p: z.string().max(50).nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateVariantSchema = z.object({
  gene_id: z.number().int(),
  db_snp_id: z.string().min(1).max(20),
  hgvs_c: z.string().max(50).nullable().optional(),
  hgvs_p: z.string().max(50).nullable().optional(),
});

export const UpdateVariantSchema = z.object({
  gene_id: z.number().int().optional(),
  db_snp_id: z.string().min(1).max(20).optional(),
  hgvs_c: z.string().max(50).nullable().optional(),
  hgvs_p: z.string().max(50).nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type Variant = z.infer<typeof VariantSchema>;
export type CreateVariant = z.infer<typeof CreateVariantSchema>;
export type UpdateVariant = z.infer<typeof UpdateVariantSchema>;

// ==========================================
// Response Types
// ==========================================

export type VariantResponse = {
  success: boolean;
  data?: Variant;
  error?: string;
};

export type VariantsResponse = {
  success: boolean;
  data?: Variant[];
  count?: number;
  error?: string;
};
