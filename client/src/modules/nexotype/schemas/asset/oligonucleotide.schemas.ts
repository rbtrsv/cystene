import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const OligonucleotideSchema = z.object({
  id: z.number(),
  uid: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  project_code: z.string().max(50).nullable().optional(),
  asset_type: z.string().max(50),
  sequence_na: z.string().min(1),
  modification_type: z.string().max(50).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateOligonucleotideSchema = z.object({
  uid: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  project_code: z.string().max(50).nullable().optional(),
  sequence_na: z.string().min(1),
  modification_type: z.string().max(50).nullable().optional(),
});

export const UpdateOligonucleotideSchema = z.object({
  uid: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(255).optional(),
  project_code: z.string().max(50).nullable().optional(),
  sequence_na: z.string().min(1).optional(),
  modification_type: z.string().max(50).nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type Oligonucleotide = z.infer<typeof OligonucleotideSchema>;
export type CreateOligonucleotide = z.infer<typeof CreateOligonucleotideSchema>;
export type UpdateOligonucleotide = z.infer<typeof UpdateOligonucleotideSchema>;

// ==========================================
// Response Types
// ==========================================

export type OligonucleotideResponse = {
  success: boolean;
  data?: Oligonucleotide;
  error?: string;
};

export type OligonucleotidesResponse = {
  success: boolean;
  data?: Oligonucleotide[];
  count?: number;
  error?: string;
};
