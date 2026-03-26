import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const BiomarkerSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(255),
  loinc_code: z.string().max(20).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateBiomarkerSchema = z.object({
  name: z.string().min(1).max(255),
  loinc_code: z.string().max(20).nullable().optional(),
});

export const UpdateBiomarkerSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  loinc_code: z.string().max(20).nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type Biomarker = z.infer<typeof BiomarkerSchema>;
export type CreateBiomarker = z.infer<typeof CreateBiomarkerSchema>;
export type UpdateBiomarker = z.infer<typeof UpdateBiomarkerSchema>;

// ==========================================
// Response Types
// ==========================================

export type BiomarkerResponse = {
  success: boolean;
  data?: Biomarker;
  error?: string;
};

export type BiomarkersResponse = {
  success: boolean;
  data?: Biomarker[];
  count?: number;
  error?: string;
};
