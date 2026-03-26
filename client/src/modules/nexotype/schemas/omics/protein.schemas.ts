import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const ProteinSchema = z.object({
  id: z.number(),
  transcript_id: z.number().int(),
  uniprot_accession: z.string().min(1).max(20),
  sequence_aa: z.string().min(1),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateProteinSchema = z.object({
  transcript_id: z.number().int(),
  uniprot_accession: z.string().min(1).max(20),
  sequence_aa: z.string().min(1),
});

export const UpdateProteinSchema = z.object({
  transcript_id: z.number().int().optional(),
  uniprot_accession: z.string().min(1).max(20).optional(),
  sequence_aa: z.string().min(1).optional(),
});

// ==========================================
// Types
// ==========================================

export type Protein = z.infer<typeof ProteinSchema>;
export type CreateProtein = z.infer<typeof CreateProteinSchema>;
export type UpdateProtein = z.infer<typeof UpdateProteinSchema>;

// ==========================================
// Response Types
// ==========================================

export type ProteinResponse = {
  success: boolean;
  data?: Protein;
  error?: string;
};

export type ProteinsResponse = {
  success: boolean;
  data?: Protein[];
  count?: number;
  error?: string;
};
