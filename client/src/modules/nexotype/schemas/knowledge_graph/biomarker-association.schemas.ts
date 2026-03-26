import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const CorrelationEnum = z.enum(['Positive', 'Negative']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** BiomarkerAssociation.correlation */
export const CORRELATION_OPTIONS = [
  { label: 'Positive', value: 'Positive' },
  { label: 'Negative', value: 'Negative' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const BiomarkerAssociationSchema = z.object({
  id: z.number(),
  biomarker_id: z.number().int(),
  indication_id: z.number().int().nullable().optional(),
  phenotype_id: z.number().int().nullable().optional(),
  correlation: CorrelationEnum,
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateBiomarkerAssociationSchema = z.object({
  biomarker_id: z.number().int(),
  indication_id: z.number().int().nullable().optional(),
  phenotype_id: z.number().int().nullable().optional(),
  correlation: CorrelationEnum,
});

export const UpdateBiomarkerAssociationSchema = z.object({
  biomarker_id: z.number().int().optional(),
  indication_id: z.number().int().nullable().optional(),
  phenotype_id: z.number().int().nullable().optional(),
  correlation: CorrelationEnum.optional(),
});

// ==========================================
// Types
// ==========================================

export type BiomarkerAssociation = z.infer<typeof BiomarkerAssociationSchema>;
export type CreateBiomarkerAssociation = z.infer<typeof CreateBiomarkerAssociationSchema>;
export type UpdateBiomarkerAssociation = z.infer<typeof UpdateBiomarkerAssociationSchema>;
export type Correlation = z.infer<typeof CorrelationEnum>;

// ==========================================
// Response Types
// ==========================================

export type BiomarkerAssociationResponse = {
  success: boolean;
  data?: BiomarkerAssociation;
  error?: string;
};

export type BiomarkerAssociationsResponse = {
  success: boolean;
  data?: BiomarkerAssociation[];
  count?: number;
  error?: string;
};
