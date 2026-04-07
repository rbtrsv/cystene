/**
 * Credential Schemas
 *
 * Zod validation schemas for Credential model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * SECURITY: encrypted_value is accepted in Create/Update but NEVER returned in Detail responses.
 *
 * Backend sources:
 * - Model: /server/apps/cybersecurity/models/infrastructure_models.py
 * - Schema: /server/apps/cybersecurity/schemas/infrastructure_schemas/credential_schemas.py
 * - Router: /server/apps/cybersecurity/subrouters/infrastructure_subrouters/credential_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Credential type options — matches backend CredentialType enum
 * Backend: class CredentialType(str, Enum)
 */
export const CredentialTypeEnum = z.enum(['ssh_key', 'ssh_password', 'api_key', 'domain_credentials', 'service_account']);

// ==========================================
// Credential Schema (Full Representation)
// ==========================================

/**
 * Credential schema — full representation
 * Used for GET operations (single and list)
 *
 * Why no encrypted_value: sensitive data never leaves the server in API responses.
 * User sees name, type, username, status — never the actual secret.
 *
 * Backend equivalent: class CredentialDetail(BaseModel)
 */
export const CredentialSchema = z.object({
  id: z.number(),
  organization_id: z.number(),
  infrastructure_id: z.number().nullable(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  cred_type: CredentialTypeEnum,
  username: z.string().nullable().optional(),
  extra_metadata: z.string().nullable().optional(), // JSON string
  is_active: z.boolean().default(true),
  last_used_at: z.string().nullable().optional(), // ISO datetime
  last_verified_at: z.string().nullable().optional(), // ISO datetime
  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new credential (POST)
 * encrypted_value is the raw secret — encrypted by the server before storage.
 *
 * Backend equivalent: class CredentialCreate(BaseModel)
 */
export const CreateCredentialSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  cred_type: CredentialTypeEnum,
  encrypted_value: z.string().min(1, 'Secret value is required'),
  infrastructure_id: z.number().nullable().optional(),
  username: z.string().max(255).nullable().optional(),
  extra_metadata: z.string().nullable().optional(), // JSON string
  is_active: z.boolean().default(true).optional(),
});

/**
 * Schema for updating a credential (PUT)
 * encrypted_value can be updated (re-encrypted) or left unchanged (omit field).
 *
 * Backend equivalent: class CredentialUpdate(BaseModel)
 */
export const UpdateCredentialSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  cred_type: CredentialTypeEnum.optional(),
  encrypted_value: z.string().min(1).optional(), // Omit to keep existing secret
  infrastructure_id: z.number().nullable().optional(),
  username: z.string().max(255).nullable().optional(),
  extra_metadata: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type CredentialType = z.infer<typeof CredentialTypeEnum>;
export type Credential = z.infer<typeof CredentialSchema>;
export type CreateCredential = z.infer<typeof CreateCredentialSchema>;
export type UpdateCredential = z.infer<typeof UpdateCredentialSchema>;

// ==========================================
// Label Helpers
// ==========================================

/** Human-readable labels for credential types */
export const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  ssh_key: 'SSH Key',
  ssh_password: 'SSH Password',
  api_key: 'API Key',
  domain_credentials: 'Domain Credentials',
  service_account: 'Service Account',
};

/**
 * Get human-readable label for a credential type
 * @param type Credential type enum value
 * @returns Display label string
 */
export const getCredentialTypeLabel = (type: string): string => {
  return CREDENTIAL_TYPE_LABELS[type as CredentialType] || type;
};

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single credential
 * Backend equivalent: class CredentialResponse(BaseModel)
 */
export type CredentialResponse = {
  success: boolean;
  data?: Credential;
  error?: string;
};

/**
 * Response containing multiple credentials
 * Backend equivalent: class CredentialsResponse(BaseModel)
 */
export type CredentialsResponse = {
  success: boolean;
  data?: Credential[];
  error?: string;
};
