/**
 * Scan Template Schemas
 *
 * Zod validation schemas for ScanTemplate model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/cybersecurity/models/execution_models.py
 * - Schema: /server/apps/cybersecurity/schemas/execution_schemas/scan_template_schemas.py
 * - Router: /server/apps/cybersecurity/subrouters/execution_subrouters/scan_template_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Scan type options — each maps to a scanner module
 * Backend: class ScanType(str, Enum)
 */
export const ScanTypeEnum = z.enum([
  // Production scanners (12)
  'port_scan', 'dns_enum', 'ssl_check', 'web_scan', 'vuln_scan', 'api_scan',
  'active_web_scan', 'password_audit', 'host_audit', 'cloud_audit', 'ad_audit', 'mobile_scan',
  // Future expansion
  'tech_detect', 'waf_detect', 'whois', 'cloud_scan', 'smb_scan', 'ad_scan',
]);

/**
 * Port range preset options (custom ranges are free-text strings)
 * Backend: class PortRange(str, Enum)
 */
export const PortRangeEnum = z.enum(['top_100', 'top_1000', 'full']);

/**
 * Scan speed options
 * Backend: class ScanSpeed(str, Enum)
 */
export const ScanSpeedEnum = z.enum(['slow', 'normal', 'fast']);

// ==========================================
// ScanTemplate Schema (Full Representation)
// ==========================================

/**
 * Scan template schema — full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class ScanTemplateDetail(BaseModel)
 */
export const ScanTemplateSchema = z.object({
  id: z.number(),
  target_id: z.number(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().nullable().optional(),
  scan_types: z.string().min(1), // Comma-separated scan types
  port_range: z.string(),
  scan_speed: ScanSpeedEnum,
  follow_redirects: z.boolean().default(true),
  max_depth: z.number().default(3),
  check_headers: z.boolean().default(true),
  dns_brute_force: z.boolean().default(false),
  dns_wordlist: z.string().default('small'),
  timeout_seconds: z.number().default(300),
  max_concurrent: z.number().default(50),
  active_scan_consent: z.boolean().default(false),
  engine_params: z.string().nullable().optional(), // JSON string
  credential_id: z.number().nullable().optional(),
  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new scan template (POST)
 *
 * Backend equivalent: class ScanTemplateCreate(BaseModel)
 */
export const CreateScanTemplateSchema = z.object({
  target_id: z.number(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().nullable().optional(),
  scan_types: z.string().min(1, 'At least one scan type is required').max(500),
  port_range: z.string().max(255).default('top_100').optional(),
  scan_speed: ScanSpeedEnum.default('normal').optional(),
  follow_redirects: z.boolean().default(true).optional(),
  max_depth: z.number().min(1).max(10).default(3).optional(),
  check_headers: z.boolean().default(true).optional(),
  dns_brute_force: z.boolean().default(false).optional(),
  dns_wordlist: z.string().max(50).default('small').optional(),
  timeout_seconds: z.number().min(10).max(3600).default(300).optional(),
  max_concurrent: z.number().min(1).max(500).default(50).optional(),
  active_scan_consent: z.boolean().default(false).optional(),
  engine_params: z.string().nullable().optional(),
  credential_id: z.number().nullable().optional(),
});

/**
 * Schema for updating a scan template (PUT)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class ScanTemplateUpdate(BaseModel)
 */
export const UpdateScanTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  scan_types: z.string().min(1).max(500).optional(),
  port_range: z.string().max(255).optional(),
  scan_speed: ScanSpeedEnum.optional(),
  follow_redirects: z.boolean().optional(),
  max_depth: z.number().min(1).max(10).optional(),
  check_headers: z.boolean().optional(),
  dns_brute_force: z.boolean().optional(),
  dns_wordlist: z.string().max(50).optional(),
  timeout_seconds: z.number().min(10).max(3600).optional(),
  max_concurrent: z.number().min(1).max(500).optional(),
  active_scan_consent: z.boolean().optional(),
  engine_params: z.string().nullable().optional(),
  credential_id: z.number().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type ScanType = z.infer<typeof ScanTypeEnum>;
export type PortRange = z.infer<typeof PortRangeEnum>;
export type ScanSpeed = z.infer<typeof ScanSpeedEnum>;
export type ScanTemplate = z.infer<typeof ScanTemplateSchema>;
export type CreateScanTemplate = z.infer<typeof CreateScanTemplateSchema>;
export type UpdateScanTemplate = z.infer<typeof UpdateScanTemplateSchema>;

// ==========================================
// Label Helpers
// ==========================================

/** Human-readable labels for scan types */
export const SCAN_TYPE_LABELS: Record<string, string> = {
  port_scan: 'Port Scan',
  dns_enum: 'DNS Enumeration',
  ssl_check: 'SSL/TLS Check',
  web_scan: 'Web Scan',
  vuln_scan: 'Vulnerability Scan',
  api_scan: 'API Scan',
  active_web_scan: 'Active Web Scan',
  password_audit: 'Password Audit',
  host_audit: 'Host Audit',
  cloud_audit: 'Cloud Audit',
  ad_audit: 'AD Audit',
  mobile_scan: 'Mobile Scan',
};

export const getScanTypeLabel = (type: string): string => {
  return SCAN_TYPE_LABELS[type] || type;
};

/** Human-readable labels for scan speeds */
export const SCAN_SPEED_LABELS: Record<ScanSpeed, string> = {
  slow: 'Slow (Stealth)',
  normal: 'Normal',
  fast: 'Fast (Aggressive)',
};

export const getScanSpeedLabel = (speed: string): string => {
  return SCAN_SPEED_LABELS[speed as ScanSpeed] || speed;
};

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single scan template
 * Backend equivalent: class ScanTemplateResponse(BaseModel)
 */
export type ScanTemplateResponse = {
  success: boolean;
  data?: ScanTemplate;
  error?: string;
};

/**
 * Response containing multiple scan templates
 * Backend equivalent: class ScanTemplatesResponse(BaseModel)
 */
export type ScanTemplatesResponse = {
  success: boolean;
  data?: ScanTemplate[];
  error?: string;
};
