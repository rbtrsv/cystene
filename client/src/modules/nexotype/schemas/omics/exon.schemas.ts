import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const ExonSchema = z.object({
  id: z.number(),
  transcript_id: z.number().int(),
  ensembl_exon_id: z.string().min(1).max(50),
  start_position: z.number().int(),
  end_position: z.number().int(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateExonSchema = z.object({
  transcript_id: z.number().int(),
  ensembl_exon_id: z.string().min(1).max(50),
  start_position: z.number().int(),
  end_position: z.number().int(),
});

export const UpdateExonSchema = z.object({
  transcript_id: z.number().int().optional(),
  ensembl_exon_id: z.string().min(1).max(50).optional(),
  start_position: z.number().int().optional(),
  end_position: z.number().int().optional(),
});

// ==========================================
// Types
// ==========================================

export type Exon = z.infer<typeof ExonSchema>;
export type CreateExon = z.infer<typeof CreateExonSchema>;
export type UpdateExon = z.infer<typeof UpdateExonSchema>;

// ==========================================
// Response Types
// ==========================================

export type ExonResponse = {
  success: boolean;
  data?: Exon;
  error?: string;
};

export type ExonsResponse = {
  success: boolean;
  data?: Exon[];
  count?: number;
  error?: string;
};
