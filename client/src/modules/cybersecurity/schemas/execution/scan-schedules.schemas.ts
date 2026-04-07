/**
 * Scan Schedule Schemas
 *
 * Zod validation schemas for ScanSchedule model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/cybersecurity/models/execution_models.py
 * - Schema: /server/apps/cybersecurity/schemas/execution_schemas/scan_schedule_schemas.py
 * - Router: /server/apps/cybersecurity/subrouters/execution_subrouters/scan_schedule_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Schedule frequency options — matches backend ScheduleFrequency enum
 * Backend: class ScheduleFrequency(str, Enum)
 */
export const ScheduleFrequencyEnum = z.enum(['hourly', 'daily', 'weekly', 'monthly']);

// ==========================================
// ScanSchedule Schema (Full Representation)
// ==========================================

/**
 * Scan schedule schema — full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class ScanScheduleDetail(BaseModel)
 */
export const ScanScheduleSchema = z.object({
  id: z.number(),
  target_id: z.number(),
  template_id: z.number(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  frequency: ScheduleFrequencyEnum,
  cron_expression: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  last_run_at: z.string().nullable().optional(), // ISO datetime
  next_run_at: z.string().nullable().optional(), // ISO datetime
  last_run_status: z.string().nullable().optional(),
  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new scan schedule (POST)
 *
 * Backend equivalent: class ScanScheduleCreate(BaseModel)
 */
export const CreateScanScheduleSchema = z.object({
  target_id: z.number(),
  template_id: z.number(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  frequency: ScheduleFrequencyEnum,
  cron_expression: z.string().max(100).nullable().optional(),
  is_active: z.boolean().default(true).optional(),
});

/**
 * Schema for updating a scan schedule (PUT)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class ScanScheduleUpdate(BaseModel)
 */
export const UpdateScanScheduleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  frequency: ScheduleFrequencyEnum.optional(),
  cron_expression: z.string().max(100).nullable().optional(),
  is_active: z.boolean().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type ScheduleFrequency = z.infer<typeof ScheduleFrequencyEnum>;
export type ScanSchedule = z.infer<typeof ScanScheduleSchema>;
export type CreateScanSchedule = z.infer<typeof CreateScanScheduleSchema>;
export type UpdateScanSchedule = z.infer<typeof UpdateScanScheduleSchema>;

// ==========================================
// Label Helpers
// ==========================================

/** Human-readable labels for schedule frequencies */
export const SCHEDULE_FREQUENCY_LABELS: Record<ScheduleFrequency, string> = {
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

/**
 * Get human-readable label for a schedule frequency
 * @param frequency Schedule frequency enum value
 * @returns Display label string
 */
export const getScheduleFrequencyLabel = (frequency: string): string => {
  return SCHEDULE_FREQUENCY_LABELS[frequency as ScheduleFrequency] || frequency;
};

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single scan schedule
 * Backend equivalent: class ScanScheduleResponse(BaseModel)
 */
export type ScanScheduleResponse = {
  success: boolean;
  data?: ScanSchedule;
  error?: string;
};

/**
 * Response containing multiple scan schedules
 * Backend equivalent: class ScanSchedulesResponse(BaseModel)
 */
export type ScanSchedulesResponse = {
  success: boolean;
  data?: ScanSchedule[];
  error?: string;
};
