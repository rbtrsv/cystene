import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const PlatformCategoryEnum = z.enum(['Gene Editing', 'Cell Therapy', 'Nucleic Acid Therapeutics', 'Computational', 'Drug Delivery']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** TechnologyPlatform.category */
export const PLATFORM_CATEGORY_OPTIONS = [
  { label: 'Gene Editing', value: 'Gene Editing' },
  { label: 'Cell Therapy', value: 'Cell Therapy' },
  { label: 'Nucleic Acid Therapeutics', value: 'Nucleic Acid Therapeutics' },
  { label: 'Computational', value: 'Computational' },
  { label: 'Drug Delivery', value: 'Drug Delivery' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const TechnologyPlatformSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(255),
  category: PlatformCategoryEnum,
  readiness_level: z.number().int().nullable().optional(),
  description: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateTechnologyPlatformSchema = z.object({
  name: z.string().min(1).max(255),
  category: PlatformCategoryEnum,
  readiness_level: z.number().int().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const UpdateTechnologyPlatformSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: PlatformCategoryEnum.optional(),
  readiness_level: z.number().int().nullable().optional(),
  description: z.string().nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type TechnologyPlatform = z.infer<typeof TechnologyPlatformSchema>;
export type CreateTechnologyPlatform = z.infer<typeof CreateTechnologyPlatformSchema>;
export type UpdateTechnologyPlatform = z.infer<typeof UpdateTechnologyPlatformSchema>;
export type PlatformCategory = z.infer<typeof PlatformCategoryEnum>;

// ==========================================
// Response Types
// ==========================================

export type TechnologyPlatformResponse = {
  success: boolean;
  data?: TechnologyPlatform;
  error?: string;
};

export type TechnologyPlatformsResponse = {
  success: boolean;
  data?: TechnologyPlatform[];
  count?: number;
  error?: string;
};
