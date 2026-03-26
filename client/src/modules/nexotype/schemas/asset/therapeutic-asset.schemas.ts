import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const AssetTypeEnum = z.enum(['small_molecule', 'biologic', 'therapeutic_peptide', 'oligonucleotide']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** TherapeuticAsset.asset_type */
export const ASSET_TYPE_OPTIONS = [
  { label: 'Small Molecule', value: 'small_molecule' },
  { label: 'Biologic', value: 'biologic' },
  { label: 'Therapeutic Peptide', value: 'therapeutic_peptide' },
  { label: 'Oligonucleotide', value: 'oligonucleotide' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const TherapeuticAssetSchema = z.object({
  id: z.number(),
  uid: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  project_code: z.string().max(50).nullable().optional(),
  asset_type: AssetTypeEnum,
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateTherapeuticAssetSchema = z.object({
  uid: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  project_code: z.string().max(50).nullable().optional(),
  asset_type: AssetTypeEnum,
});

export const UpdateTherapeuticAssetSchema = z.object({
  uid: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(255).optional(),
  project_code: z.string().max(50).nullable().optional(),
  asset_type: AssetTypeEnum.optional(),
});

// ==========================================
// Types
// ==========================================

export type TherapeuticAsset = z.infer<typeof TherapeuticAssetSchema>;
export type CreateTherapeuticAsset = z.infer<typeof CreateTherapeuticAssetSchema>;
export type UpdateTherapeuticAsset = z.infer<typeof UpdateTherapeuticAssetSchema>;
export type AssetType = z.infer<typeof AssetTypeEnum>;

// ==========================================
// Label Helpers
// ==========================================

/** Human-readable labels for asset types */
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  small_molecule: 'Small Molecule',
  biologic: 'Biologic',
  therapeutic_peptide: 'Therapeutic Peptide',
  oligonucleotide: 'Oligonucleotide',
};

/** Get human-readable label for an asset type */
export const getAssetTypeLabel = (type: string): string => {
  return ASSET_TYPE_LABELS[type as AssetType] || type;
};

// ==========================================
// Response Types
// ==========================================

export type TherapeuticAssetResponse = {
  success: boolean;
  data?: TherapeuticAsset;
  error?: string;
};

export type TherapeuticAssetsResponse = {
  success: boolean;
  data?: TherapeuticAsset[];
  count?: number;
  error?: string;
};
