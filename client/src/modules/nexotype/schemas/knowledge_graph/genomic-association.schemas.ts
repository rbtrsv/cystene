import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const GenomicAssociationSchema = z.object({
  id: z.number(),
  variant_id: z.number().int(),
  indication_id: z.number().int(),
  odds_ratio: z.number().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateGenomicAssociationSchema = z.object({
  variant_id: z.number().int(),
  indication_id: z.number().int(),
  odds_ratio: z.number().nullable().optional(),
});

export const UpdateGenomicAssociationSchema = z.object({
  variant_id: z.number().int().optional(),
  indication_id: z.number().int().optional(),
  odds_ratio: z.number().nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type GenomicAssociation = z.infer<typeof GenomicAssociationSchema>;
export type CreateGenomicAssociation = z.infer<typeof CreateGenomicAssociationSchema>;
export type UpdateGenomicAssociation = z.infer<typeof UpdateGenomicAssociationSchema>;

// ==========================================
// Response Types
// ==========================================

export type GenomicAssociationResponse = {
  success: boolean;
  data?: GenomicAssociation;
  error?: string;
};

export type GenomicAssociationsResponse = {
  success: boolean;
  data?: GenomicAssociation[];
  count?: number;
  error?: string;
};
