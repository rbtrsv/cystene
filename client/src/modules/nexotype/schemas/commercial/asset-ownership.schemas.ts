import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const OwnershipTypeEnum = z.enum(['Originator', 'Licensee']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** AssetOwnership.ownership_type */
export const OWNERSHIP_TYPE_OPTIONS = [
  { label: 'Originator', value: 'Originator' },
  { label: 'Licensee', value: 'Licensee' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const AssetOwnershipSchema = z.object({
  id: z.number(),
  market_organization_id: z.number().int(),
  asset_id: z.number().int(),
  ownership_type: OwnershipTypeEnum,
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateAssetOwnershipSchema = z.object({
  market_organization_id: z.number().int(),
  asset_id: z.number().int(),
  ownership_type: OwnershipTypeEnum,
});

export const UpdateAssetOwnershipSchema = z.object({
  market_organization_id: z.number().int().optional(),
  asset_id: z.number().int().optional(),
  ownership_type: OwnershipTypeEnum.optional(),
});

// ==========================================
// Types
// ==========================================

export type AssetOwnership = z.infer<typeof AssetOwnershipSchema>;
export type CreateAssetOwnership = z.infer<typeof CreateAssetOwnershipSchema>;
export type UpdateAssetOwnership = z.infer<typeof UpdateAssetOwnershipSchema>;
export type OwnershipType = z.infer<typeof OwnershipTypeEnum>;

// ==========================================
// Response Types
// ==========================================

export type AssetOwnershipResponse = {
  success: boolean;
  data?: AssetOwnership;
  error?: string;
};

export type AssetOwnershipsResponse = {
  success: boolean;
  data?: AssetOwnership[];
  count?: number;
  error?: string;
};
