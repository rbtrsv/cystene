import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const BiologicTypeEnum = z.enum(['Antibody', 'Enzyme']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** Biologic.biologic_type */
export const BIOLOGIC_TYPE_OPTIONS = [
  { label: 'Antibody', value: 'Antibody' },
  { label: 'Enzyme', value: 'Enzyme' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const BiologicSchema = z.object({
  id: z.number(),
  uid: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  project_code: z.string().max(50).nullable().optional(),
  asset_type: z.string().max(50),
  sequence_aa: z.string().min(1),
  biologic_type: BiologicTypeEnum,
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateBiologicSchema = z.object({
  uid: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  project_code: z.string().max(50).nullable().optional(),
  sequence_aa: z.string().min(1),
  biologic_type: BiologicTypeEnum,
});

export const UpdateBiologicSchema = z.object({
  uid: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(255).optional(),
  project_code: z.string().max(50).nullable().optional(),
  sequence_aa: z.string().min(1).optional(),
  biologic_type: BiologicTypeEnum.optional(),
});

// ==========================================
// Types
// ==========================================

export type Biologic = z.infer<typeof BiologicSchema>;
export type CreateBiologic = z.infer<typeof CreateBiologicSchema>;
export type UpdateBiologic = z.infer<typeof UpdateBiologicSchema>;
export type BiologicType = z.infer<typeof BiologicTypeEnum>;

// ==========================================
// Response Types
// ==========================================

export type BiologicResponse = {
  success: boolean;
  data?: Biologic;
  error?: string;
};

export type BiologicsResponse = {
  success: boolean;
  data?: Biologic[];
  count?: number;
  error?: string;
};
