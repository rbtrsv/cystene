import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const PeptideFragmentSchema = z.object({
  id: z.number(),
  protein_id: z.number().int(),
  sequence: z.string().min(1).max(255),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreatePeptideFragmentSchema = z.object({
  protein_id: z.number().int(),
  sequence: z.string().min(1).max(255),
});

export const UpdatePeptideFragmentSchema = z.object({
  protein_id: z.number().int().optional(),
  sequence: z.string().min(1).max(255).optional(),
});

// ==========================================
// Types
// ==========================================

export type PeptideFragment = z.infer<typeof PeptideFragmentSchema>;
export type CreatePeptideFragment = z.infer<typeof CreatePeptideFragmentSchema>;
export type UpdatePeptideFragment = z.infer<typeof UpdatePeptideFragmentSchema>;

// ==========================================
// Response Types
// ==========================================

export type PeptideFragmentResponse = {
  success: boolean;
  data?: PeptideFragment;
  error?: string;
};

export type PeptideFragmentsResponse = {
  success: boolean;
  data?: PeptideFragment[];
  count?: number;
  error?: string;
};
