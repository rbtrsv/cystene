import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const ZygosityEnum = z.enum(['Homozygous', 'Heterozygous', 'Hemizygous']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** UserVariant.zygosity */
export const ZYGOSITY_OPTIONS = [
  { label: 'Homozygous', value: 'Homozygous' },
  { label: 'Heterozygous', value: 'Heterozygous' },
  { label: 'Hemizygous', value: 'Hemizygous' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const UserVariantSchema = z.object({
  id: z.number(),
  subject_id: z.number().int(),
  variant_id: z.number().int(),
  zygosity: ZygosityEnum,
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateUserVariantSchema = z.object({
  subject_id: z.number().int(),
  variant_id: z.number().int(),
  zygosity: ZygosityEnum,
});

export const UpdateUserVariantSchema = z.object({
  subject_id: z.number().int().optional(),
  variant_id: z.number().int().optional(),
  zygosity: ZygosityEnum.optional(),
});

// ==========================================
// Types
// ==========================================

export type UserVariant = z.infer<typeof UserVariantSchema>;
export type CreateUserVariant = z.infer<typeof CreateUserVariantSchema>;
export type UpdateUserVariant = z.infer<typeof UpdateUserVariantSchema>;
export type Zygosity = z.infer<typeof ZygosityEnum>;

// ==========================================
// Response Types
// ==========================================

export type UserVariantResponse = {
  success: boolean;
  data?: UserVariant;
  error?: string;
};

export type UserVariantsResponse = {
  success: boolean;
  data?: UserVariant[];
  count?: number;
  error?: string;
};
