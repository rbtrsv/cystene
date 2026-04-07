/**
 * Finding Schemas
 *
 * Zod validation schemas for Finding model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * No Create/Update — scanner writes findings. User only updates triage status via PATCH.
 *
 * Backend sources:
 * - Model: /server/apps/cybersecurity/models/discovery_models.py
 * - Schema: /server/apps/cybersecurity/schemas/discovery_schemas/finding_schemas.py
 * - Router: /server/apps/cybersecurity/subrouters/discovery_subrouters/finding_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Finding severity levels — matches backend Severity enum
 * Backend: class Severity(str, Enum)
 */
export const SeverityEnum = z.enum(['critical', 'high', 'medium', 'low', 'info']);

/**
 * Finding triage status options — matches backend FindingStatus enum
 * Backend: class FindingStatus(str, Enum)
 */
export const FindingStatusEnum = z.enum(['open', 'acknowledged', 'resolved', 'false_positive']);

/**
 * Finding category options — groups findings in UI
 * Backend: class FindingCategory(str, Enum)
 */
export const FindingCategoryEnum = z.enum([
  // Port & Service findings (from port_scan)
  'open_port', 'service_exposure', 'outdated_service', 'default_credentials',
  // DNS findings (from dns_scan)
  'dns_exposure', 'subdomain_discovery', 'dns_misconfiguration',
  // SSL/TLS findings (from ssl_scan)
  'ssl_weakness', 'certificate_issue', 'protocol_vulnerability',
  // Web findings (from web_scan)
  'missing_header', 'web_misconfiguration', 'information_disclosure',
  // Vuln scanner findings (from vuln_scan)
  'known_vulnerability',
  // API scanner findings (from api_scan)
  'api_vulnerability',
  // Active web scanner findings (from active_web_scan)
  'injection_detected',
  // Web scanner extended findings
  'file_exposure', 'directory_listing', 'cors_misconfiguration', 'open_redirect',
  // Host audit findings (from host_audit_scan)
  'privilege_escalation', 'weak_file_permissions', 'exposed_credentials', 'insecure_service_config',
  // Cloud audit findings (from cloud_audit_scan)
  'cloud_misconfiguration', 'iam_issue',
  // AD audit findings (from ad_audit_scan)
  'ad_weakness',
  // Password audit findings (from password_audit_scan)
  'weak_password',
  // Mobile findings (from mobile_scan)
  'mobile_vulnerability',
  // General categories
  'weak_authentication', 'configuration_error',
]);

// ==========================================
// Finding Schema (Full Representation)
// ==========================================

/**
 * Finding schema — full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class FindingDetail(BaseModel)
 */
export const FindingSchema = z.object({
  id: z.number(),
  scan_job_id: z.number(),
  fingerprint: z.string(), // SHA-256 hash for deduplication
  is_new: z.boolean(),
  first_found_job_id: z.number().nullable().optional(),
  severity: SeverityEnum,
  category: FindingCategoryEnum,
  finding_type: z.string(),
  title: z.string(),
  description: z.string(),
  remediation: z.string().nullable().optional(),
  remediation_script: z.string().nullable().optional(),
  evidence: z.string().nullable().optional(),
  host: z.string().nullable().optional(),
  port: z.number().nullable().optional(),
  protocol: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  cve_id: z.string().nullable().optional(),
  cvss_score: z.number().nullable().optional(),
  cwe_id: z.string().nullable().optional(),
  owasp_category: z.string().nullable().optional(),
  mitre_tactic: z.string().nullable().optional(),
  mitre_technique: z.string().nullable().optional(),
  status: FindingStatusEnum,
  resolved_by: z.number().nullable().optional(),
  discovered_at: z.string(), // ISO datetime
  status_changed_at: z.string().nullable().optional(), // ISO datetime
});

// ==========================================
// Action Schemas
// ==========================================

/**
 * Schema for updating finding triage status via PATCH /{id}/status
 *
 * Backend equivalent: class FindingStatusUpdate(BaseModel)
 */
export const FindingStatusUpdateSchema = z.object({
  status: FindingStatusEnum,
});

// ==========================================
// Type Exports
// ==========================================

export type Severity = z.infer<typeof SeverityEnum>;
export type FindingStatus = z.infer<typeof FindingStatusEnum>;
export type FindingCategory = z.infer<typeof FindingCategoryEnum>;
export type Finding = z.infer<typeof FindingSchema>;
export type FindingStatusUpdate = z.infer<typeof FindingStatusUpdateSchema>;

// ==========================================
// Label Helpers
// ==========================================

/** Human-readable labels for severities */
export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

/** Color classes for severity badges (Tailwind) */
export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-blue-400 text-white',
  info: 'bg-gray-400 text-white',
};

export const getSeverityLabel = (severity: string): string => {
  return SEVERITY_LABELS[severity as Severity] || severity;
};

/** Human-readable labels for finding statuses */
export const FINDING_STATUS_LABELS: Record<FindingStatus, string> = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
  false_positive: 'False Positive',
};

export const getFindingStatusLabel = (status: string): string => {
  return FINDING_STATUS_LABELS[status as FindingStatus] || status;
};

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single finding
 * Backend equivalent: class FindingResponse(BaseModel)
 */
export type FindingResponse = {
  success: boolean;
  data?: Finding;
  error?: string;
};

/**
 * Response containing multiple findings
 * Backend equivalent: class FindingsResponse(BaseModel)
 */
export type FindingsResponse = {
  success: boolean;
  data?: Finding[];
  error?: string;
};
