/**
 * Scan Job Schemas
 *
 * Zod validation schemas for ScanJob model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * No Create/Update — jobs are created via POST /start and are immutable once started.
 *
 * Backend sources:
 * - Model: /server/apps/cybersecurity/models/execution_models.py
 * - Schema: /server/apps/cybersecurity/schemas/execution_schemas/scan_job_schemas.py
 * - Router: /server/apps/cybersecurity/subrouters/execution_subrouters/scan_job_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Job status options — matches backend JobStatus enum
 * Backend: class JobStatus(str, Enum)
 */
export const JobStatusEnum = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']);

// ==========================================
// ScanJob Schema (Full Representation)
// ==========================================

/**
 * Scan job schema — full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class ScanJobDetail(BaseModel)
 */
export const ScanJobSchema = z.object({
  id: z.number(),
  target_id: z.number(),
  template_id: z.number(),
  schedule_id: z.number().nullable().optional(),
  status: JobStatusEnum,
  started_at: z.string().nullable().optional(), // ISO datetime
  completed_at: z.string().nullable().optional(), // ISO datetime
  duration_seconds: z.number().nullable().optional(),
  scan_types_run: z.string().nullable().optional(), // Comma-separated
  // Results summary — denormalized counts for quick display
  total_findings: z.number().default(0),
  critical_count: z.number().default(0),
  high_count: z.number().default(0),
  medium_count: z.number().default(0),
  low_count: z.number().default(0),
  info_count: z.number().default(0),
  total_assets: z.number().default(0),
  execution_point: z.string().default('cloud'),
  security_score: z.number().nullable().optional(), // 0-100
  error_message: z.string().nullable().optional(),
  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(),
});

// ==========================================
// Type Exports
// ==========================================

export type JobStatus = z.infer<typeof JobStatusEnum>;
export type ScanJob = z.infer<typeof ScanJobSchema>;

// ==========================================
// Label Helpers
// ==========================================

/** Human-readable labels for job statuses */
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

/**
 * Get human-readable label for a job status
 * @param status Job status enum value
 * @returns Display label string
 */
export const getJobStatusLabel = (status: string): string => {
  return JOB_STATUS_LABELS[status as JobStatus] || status;
};

/** Color classes for job status badges (Tailwind) */
export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single scan job
 * Backend equivalent: class ScanJobResponse(BaseModel)
 */
export type ScanJobResponse = {
  success: boolean;
  data?: ScanJob;
  error?: string;
};

/**
 * Response containing multiple scan jobs
 * Backend equivalent: class ScanJobsResponse(BaseModel)
 */
export type ScanJobsResponse = {
  success: boolean;
  data?: ScanJob[];
  error?: string;
};
