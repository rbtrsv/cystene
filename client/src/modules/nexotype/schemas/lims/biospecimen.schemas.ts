import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const SampleTypeEnum = z.enum(['Plasma', 'Tissue', 'Blood']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** Biospecimen.sample_type */
export const SAMPLE_TYPE_OPTIONS = [
  { label: 'Plasma', value: 'Plasma' },
  { label: 'Tissue', value: 'Tissue' },
  { label: 'Blood', value: 'Blood' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const BiospecimenSchema = z.object({
  id: z.number(),
  subject_id: z.number().int(),
  barcode: z.string().min(1).max(100),
  sample_type: SampleTypeEnum,
  freezer_location: z.string().max(100).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateBiospecimenSchema = z.object({
  subject_id: z.number().int(),
  barcode: z.string().min(1).max(100),
  sample_type: SampleTypeEnum,
  freezer_location: z.string().max(100).nullable().optional(),
});

export const UpdateBiospecimenSchema = z.object({
  subject_id: z.number().int().optional(),
  barcode: z.string().min(1).max(100).optional(),
  sample_type: SampleTypeEnum.optional(),
  freezer_location: z.string().max(100).nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type Biospecimen = z.infer<typeof BiospecimenSchema>;
export type CreateBiospecimen = z.infer<typeof CreateBiospecimenSchema>;
export type UpdateBiospecimen = z.infer<typeof UpdateBiospecimenSchema>;
export type SampleType = z.infer<typeof SampleTypeEnum>;

// ==========================================
// Response Types
// ==========================================

export type BiospecimenResponse = {
  success: boolean;
  data?: Biospecimen;
  error?: string;
};

export type BiospecimensResponse = {
  success: boolean;
  data?: Biospecimen[];
  count?: number;
  error?: string;
};
