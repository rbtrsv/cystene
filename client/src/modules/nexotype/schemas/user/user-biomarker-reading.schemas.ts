import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const UserBiomarkerReadingSchema = z.object({
  id: z.number(),
  subject_id: z.number().int(),
  biomarker_id: z.number().int(),
  source_id: z.number().int(),
  value: z.number(),
  unit_id: z.number().int(),
  measured_at: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateUserBiomarkerReadingSchema = z.object({
  subject_id: z.number().int(),
  biomarker_id: z.number().int(),
  source_id: z.number().int(),
  value: z.number(),
  unit_id: z.number().int(),
  measured_at: z.string().min(1),
});

export const UpdateUserBiomarkerReadingSchema = z.object({
  subject_id: z.number().int().optional(),
  biomarker_id: z.number().int().optional(),
  source_id: z.number().int().optional(),
  value: z.number().optional(),
  unit_id: z.number().int().optional(),
  measured_at: z.string().optional(),
});

// ==========================================
// Types
// ==========================================

export type UserBiomarkerReading = z.infer<typeof UserBiomarkerReadingSchema>;
export type CreateUserBiomarkerReading = z.infer<typeof CreateUserBiomarkerReadingSchema>;
export type UpdateUserBiomarkerReading = z.infer<typeof UpdateUserBiomarkerReadingSchema>;

// ==========================================
// Response Types
// ==========================================

export type UserBiomarkerReadingResponse = {
  success: boolean;
  data?: UserBiomarkerReading;
  error?: string;
};

export type UserBiomarkerReadingsResponse = {
  success: boolean;
  data?: UserBiomarkerReading[];
  count?: number;
  error?: string;
};
