/**
 * Asset Schemas
 *
 * Zod validation schemas for Asset model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Read-only — no Create/Update. Scanner discovers assets, user views them.
 *
 * Backend sources:
 * - Model: /server/apps/cybersecurity/models/discovery_models.py
 * - Schema: /server/apps/cybersecurity/schemas/discovery_schemas/asset_schemas.py
 * - Router: /server/apps/cybersecurity/subrouters/discovery_subrouters/asset_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Discovered asset type options — matches backend AssetType enum
 * Backend: class AssetType(str, Enum)
 */
export const AssetTypeEnum = z.enum(['host', 'service', 'technology', 'certificate', 'dns_record']);

/**
 * Asset discovery confidence level — matches backend AssetConfidence enum
 * Backend: class AssetConfidence(str, Enum)
 */
export const AssetConfidenceEnum = z.enum(['confirmed', 'probable', 'possible']);

// ==========================================
// Asset Schema (Full Representation)
// ==========================================

/**
 * Asset schema — full representation. Read-only.
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class AssetDetail(BaseModel)
 */
export const AssetSchema = z.object({
  id: z.number(),
  scan_job_id: z.number(),
  asset_type: AssetTypeEnum,
  value: z.string(),
  host: z.string().nullable().optional(),
  port: z.number().nullable().optional(),
  protocol: z.string().nullable().optional(),
  service_name: z.string().nullable().optional(),
  service_version: z.string().nullable().optional(),
  banner: z.string().nullable().optional(),
  service_metadata: z.string().nullable().optional(), // JSON string
  confidence: AssetConfidenceEnum,
  first_seen_at: z.string(), // ISO datetime
});

// ==========================================
// Type Exports
// ==========================================

export type AssetType = z.infer<typeof AssetTypeEnum>;
export type AssetConfidence = z.infer<typeof AssetConfidenceEnum>;
export type Asset = z.infer<typeof AssetSchema>;

// ==========================================
// Label Helpers
// ==========================================

/** Human-readable labels for asset types */
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  host: 'Host',
  service: 'Service',
  technology: 'Technology',
  certificate: 'Certificate',
  dns_record: 'DNS Record',
};

export const getAssetTypeLabel = (type: string): string => {
  return ASSET_TYPE_LABELS[type as AssetType] || type;
};

/** Human-readable labels for confidence levels */
export const ASSET_CONFIDENCE_LABELS: Record<AssetConfidence, string> = {
  confirmed: 'Confirmed',
  probable: 'Probable',
  possible: 'Possible',
};

export const getAssetConfidenceLabel = (confidence: string): string => {
  return ASSET_CONFIDENCE_LABELS[confidence as AssetConfidence] || confidence;
};

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single asset
 * Backend equivalent: class AssetResponse(BaseModel)
 */
export type AssetResponse = {
  success: boolean;
  data?: Asset;
  error?: string;
};

/**
 * Response containing multiple assets
 * Backend equivalent: class AssetsResponse(BaseModel)
 */
export type AssetsResponse = {
  success: boolean;
  data?: Asset[];
  error?: string;
};
