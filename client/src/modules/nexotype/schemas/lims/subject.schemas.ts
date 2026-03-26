import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const SexEnum = z.enum(['M', 'F', 'Unknown']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** Subject.sex */
export const SEX_OPTIONS = [
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
  { label: 'Unknown', value: 'Unknown' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const SubjectSchema = z.object({
  id: z.number(),
  subject_identifier: z.string().min(1).max(100),
  organism_id: z.number().int(),
  cohort_name: z.string().max(100).nullable().optional(),
  sex: SexEnum.nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateSubjectSchema = z.object({
  subject_identifier: z.string().min(1).max(100),
  organism_id: z.number().int(),
  cohort_name: z.string().max(100).nullable().optional(),
  sex: SexEnum.nullable().optional(),
});

export const UpdateSubjectSchema = z.object({
  subject_identifier: z.string().min(1).max(100).optional(),
  organism_id: z.number().int().optional(),
  cohort_name: z.string().max(100).nullable().optional(),
  sex: SexEnum.nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type Subject = z.infer<typeof SubjectSchema>;
export type CreateSubject = z.infer<typeof CreateSubjectSchema>;
export type UpdateSubject = z.infer<typeof UpdateSubjectSchema>;
export type Sex = z.infer<typeof SexEnum>;

// ==========================================
// Response Types
// ==========================================

export type SubjectResponse = {
  success: boolean;
  data?: Subject;
  error?: string;
};

export type SubjectsResponse = {
  success: boolean;
  data?: Subject[];
  count?: number;
  error?: string;
};
