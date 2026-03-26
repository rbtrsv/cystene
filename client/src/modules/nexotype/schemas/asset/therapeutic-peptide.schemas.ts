import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const TherapeuticPeptideSchema = z.object({
  id: z.number(),
  uid: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  project_code: z.string().max(50).nullable().optional(),
  asset_type: z.string().max(50),
  sequence_aa: z.string().min(1),
  purity_grade: z.string().max(20).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateTherapeuticPeptideSchema = z.object({
  uid: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  project_code: z.string().max(50).nullable().optional(),
  sequence_aa: z.string().min(1),
  purity_grade: z.string().max(20).nullable().optional(),
});

export const UpdateTherapeuticPeptideSchema = z.object({
  uid: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(255).optional(),
  project_code: z.string().max(50).nullable().optional(),
  sequence_aa: z.string().min(1).optional(),
  purity_grade: z.string().max(20).nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type TherapeuticPeptide = z.infer<typeof TherapeuticPeptideSchema>;
export type CreateTherapeuticPeptide = z.infer<typeof CreateTherapeuticPeptideSchema>;
export type UpdateTherapeuticPeptide = z.infer<typeof UpdateTherapeuticPeptideSchema>;

// ==========================================
// Response Types
// ==========================================

export type TherapeuticPeptideResponse = {
  success: boolean;
  data?: TherapeuticPeptide;
  error?: string;
};

export type TherapeuticPeptidesResponse = {
  success: boolean;
  data?: TherapeuticPeptide[];
  count?: number;
  error?: string;
};
