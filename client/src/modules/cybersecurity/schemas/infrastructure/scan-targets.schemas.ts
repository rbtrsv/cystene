/**
 * Scan Target Schemas
 *
 * Zod validation schemas for ScanTarget model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/cybersecurity/models/infrastructure_models.py
 * - Schema: /server/apps/cybersecurity/schemas/infrastructure_schemas/scan_target_schemas.py
 * - Router: /server/apps/cybersecurity/subrouters/infrastructure_subrouters/scan_target_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Scan target type options — matches backend TargetType enum
 * Backend: class TargetType(str, Enum)
 */
export const TargetTypeEnum = z.enum(['domain', 'ip', 'ip_range', 'url']);

/**
 * Target ownership verification method options — matches backend VerificationMethod enum
 * Backend: class VerificationMethod(str, Enum)
 */
export const VerificationMethodEnum = z.enum(['dns_txt', 'file_upload', 'meta_tag']);

// ==========================================
// ScanTarget Schema (Full Representation)
// ==========================================

/**
 * Scan target schema — full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class ScanTargetDetail(BaseModel)
 */
export const ScanTargetSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  organization_id: z.number(),
  infrastructure_id: z.number().nullable(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  target_type: TargetTypeEnum,
  target_value: z.string().min(1).max(500),
  is_verified: z.boolean(),
  verification_method: VerificationMethodEnum.nullable().optional(),
  verification_token: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new scan target (POST)
 * Excludes: id, user_id, organization_id, is_verified, verification_method,
 * verification_token, created_at, updated_at (auto-generated or set by server)
 *
 * Backend equivalent: class ScanTargetCreate(BaseModel)
 */
export const CreateScanTargetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  target_type: TargetTypeEnum,
  target_value: z.string().min(1, 'Target value is required').max(500, 'Target value must be less than 500 characters'),
  infrastructure_id: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.string().max(500).nullable().optional(),
  is_active: z.boolean().default(true).optional(),
});

/**
 * Schema for updating a scan target (PUT)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class ScanTargetUpdate(BaseModel)
 */
export const UpdateScanTargetSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  target_type: TargetTypeEnum.optional(),
  target_value: z.string().min(1).max(500).optional(),
  infrastructure_id: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.string().max(500).nullable().optional(),
  is_active: z.boolean().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type TargetType = z.infer<typeof TargetTypeEnum>;
export type VerificationMethod = z.infer<typeof VerificationMethodEnum>;
export type ScanTarget = z.infer<typeof ScanTargetSchema>;
export type CreateScanTarget = z.infer<typeof CreateScanTargetSchema>;
export type UpdateScanTarget = z.infer<typeof UpdateScanTargetSchema>;

// ==========================================
// Label Helpers
// ==========================================

/** Human-readable labels for target types */
export const TARGET_TYPE_LABELS: Record<TargetType, string> = {
  domain: 'Domain',
  ip: 'IP Address',
  ip_range: 'IP Range',
  url: 'URL',
};

/**
 * Get human-readable label for a target type
 * @param type Target type enum value
 * @returns Display label string
 */
export const getTargetTypeLabel = (type: string): string => {
  return TARGET_TYPE_LABELS[type as TargetType] || type;
};

/** Human-readable labels for verification methods */
export const VERIFICATION_METHOD_LABELS: Record<VerificationMethod, string> = {
  dns_txt: 'DNS TXT Record',
  file_upload: 'File Upload',
  meta_tag: 'Meta Tag',
};

/**
 * Get human-readable label for a verification method
 * @param method Verification method enum value
 * @returns Display label string
 */
export const getVerificationMethodLabel = (method: string): string => {
  return VERIFICATION_METHOD_LABELS[method as VerificationMethod] || method;
};

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single scan target
 * Backend equivalent: class ScanTargetResponse(BaseModel)
 */
export type ScanTargetResponse = {
  success: boolean;
  data?: ScanTarget;
  error?: string;
};

/**
 * Response containing multiple scan targets
 * Backend equivalent: class ScanTargetsResponse(BaseModel)
 */
export type ScanTargetsResponse = {
  success: boolean;
  data?: ScanTarget[];
  error?: string;
};
