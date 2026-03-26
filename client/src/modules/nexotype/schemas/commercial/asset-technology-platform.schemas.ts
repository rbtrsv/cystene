import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const PlatformRoleEnum = z.enum(['Primary', 'Secondary', 'Enabling']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** AssetTechnologyPlatform.role */
export const PLATFORM_ROLE_OPTIONS = [
  { label: 'Primary', value: 'Primary' },
  { label: 'Secondary', value: 'Secondary' },
  { label: 'Enabling', value: 'Enabling' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const AssetTechnologyPlatformSchema = z.object({
  id: z.number(),
  asset_id: z.number().int(),
  technology_platform_id: z.number().int(),
  role: PlatformRoleEnum,
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateAssetTechnologyPlatformSchema = z.object({
  asset_id: z.number().int(),
  technology_platform_id: z.number().int(),
  role: PlatformRoleEnum,
});

export const UpdateAssetTechnologyPlatformSchema = z.object({
  asset_id: z.number().int().optional(),
  technology_platform_id: z.number().int().optional(),
  role: PlatformRoleEnum.optional(),
});

// ==========================================
// Types
// ==========================================

export type AssetTechnologyPlatform = z.infer<typeof AssetTechnologyPlatformSchema>;
export type CreateAssetTechnologyPlatform = z.infer<typeof CreateAssetTechnologyPlatformSchema>;
export type UpdateAssetTechnologyPlatform = z.infer<typeof UpdateAssetTechnologyPlatformSchema>;
export type PlatformRole = z.infer<typeof PlatformRoleEnum>;

// ==========================================
// Response Types
// ==========================================

export type AssetTechnologyPlatformResponse = {
  success: boolean;
  data?: AssetTechnologyPlatform;
  error?: string;
};

export type AssetTechnologyPlatformsResponse = {
  success: boolean;
  data?: AssetTechnologyPlatform[];
  count?: number;
  error?: string;
};
