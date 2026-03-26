import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const UserTreatmentLogSchema = z.object({
  id: z.number(),
  subject_id: z.number().int(),
  asset_id: z.number().int(),
  dosage: z.string().min(1).max(100),
  started_at: z.string(),
  ended_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateUserTreatmentLogSchema = z.object({
  subject_id: z.number().int(),
  asset_id: z.number().int(),
  dosage: z.string().min(1).max(100),
  started_at: z.string().min(1),
  ended_at: z.string().nullable().optional(),
});

export const UpdateUserTreatmentLogSchema = z.object({
  subject_id: z.number().int().optional(),
  asset_id: z.number().int().optional(),
  dosage: z.string().min(1).max(100).optional(),
  started_at: z.string().optional(),
  ended_at: z.string().nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type UserTreatmentLog = z.infer<typeof UserTreatmentLogSchema>;
export type CreateUserTreatmentLog = z.infer<typeof CreateUserTreatmentLogSchema>;
export type UpdateUserTreatmentLog = z.infer<typeof UpdateUserTreatmentLogSchema>;

// ==========================================
// Response Types
// ==========================================

export type UserTreatmentLogResponse = {
  success: boolean;
  data?: UserTreatmentLog;
  error?: string;
};

export type UserTreatmentLogsResponse = {
  success: boolean;
  data?: UserTreatmentLog[];
  count?: number;
  error?: string;
};
