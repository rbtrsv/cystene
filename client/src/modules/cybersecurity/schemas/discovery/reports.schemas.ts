/**
 * Report Schemas
 *
 * Zod validation schemas for Report model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/cybersecurity/models/discovery_models.py
 * - Schema: /server/apps/cybersecurity/schemas/discovery_schemas/report_schemas.py
 * - Router: /server/apps/cybersecurity/subrouters/discovery_subrouters/report_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Report type options — matches backend ReportType enum
 * Backend: class ReportType(str, Enum)
 */
export const ReportTypeEnum = z.enum(['full', 'executive_summary', 'compliance', 'delta']);

/**
 * Report output format options — matches backend ReportFormat enum
 * Backend: class ReportFormat(str, Enum)
 */
export const ReportFormatEnum = z.enum(['pdf', 'html', 'json']);

// ==========================================
// Report Schema (Full Representation)
// ==========================================

/**
 * Report schema — full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class ReportDetail(BaseModel)
 */
export const ReportSchema = z.object({
  id: z.number(),
  target_id: z.number(),
  scan_job_id: z.number().nullable().optional(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  report_type: ReportTypeEnum,
  format: ReportFormatEnum,
  content: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  total_findings: z.number().default(0),
  critical_count: z.number().default(0),
  high_count: z.number().default(0),
  medium_count: z.number().default(0),
  low_count: z.number().default(0),
  info_count: z.number().default(0),
  generated_at: z.string(), // ISO datetime
  generated_by: z.number().nullable().optional(),
  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for generating a new report (POST /generate)
 *
 * Backend equivalent: class ReportCreate(BaseModel)
 */
export const CreateReportSchema = z.object({
  target_id: z.number(),
  scan_job_id: z.number().nullable().optional(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  report_type: ReportTypeEnum.default('full').optional(),
  format: ReportFormatEnum.default('pdf').optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type ReportType = z.infer<typeof ReportTypeEnum>;
export type ReportFormat = z.infer<typeof ReportFormatEnum>;
export type Report = z.infer<typeof ReportSchema>;
export type CreateReport = z.infer<typeof CreateReportSchema>;

// ==========================================
// Label Helpers
// ==========================================

/** Human-readable labels for report types */
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  full: 'Full Report',
  executive_summary: 'Executive Summary',
  compliance: 'Compliance Report',
  delta: 'Delta Report',
};

export const getReportTypeLabel = (type: string): string => {
  return REPORT_TYPE_LABELS[type as ReportType] || type;
};

/** Human-readable labels for report formats */
export const REPORT_FORMAT_LABELS: Record<ReportFormat, string> = {
  pdf: 'PDF',
  html: 'HTML',
  json: 'JSON',
};

export const getReportFormatLabel = (format: string): string => {
  return REPORT_FORMAT_LABELS[format as ReportFormat] || format;
};

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single report
 * Backend equivalent: class ReportResponse(BaseModel)
 */
export type ReportResponse = {
  success: boolean;
  data?: Report;
  error?: string;
};

/**
 * Response containing multiple reports
 * Backend equivalent: class ReportsResponse(BaseModel)
 */
export type ReportsResponse = {
  success: boolean;
  data?: Report[];
  error?: string;
};
