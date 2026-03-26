import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const AssayRunSchema = z.object({
  id: z.number(),
  protocol_id: z.number().int(),
  run_date: z.string(),
  operator_id: z.number().int().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateAssayRunSchema = z.object({
  protocol_id: z.number().int(),
  run_date: z.string().min(1),
  operator_id: z.number().int().nullable().optional(),
});

export const UpdateAssayRunSchema = z.object({
  protocol_id: z.number().int().optional(),
  run_date: z.string().min(1).optional(),
  operator_id: z.number().int().nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type AssayRun = z.infer<typeof AssayRunSchema>;
export type CreateAssayRun = z.infer<typeof CreateAssayRunSchema>;
export type UpdateAssayRun = z.infer<typeof UpdateAssayRunSchema>;

// ==========================================
// Response Types
// ==========================================

export type AssayRunResponse = {
  success: boolean;
  data?: AssayRun;
  error?: string;
};

export type AssayRunsResponse = {
  success: boolean;
  data?: AssayRun[];
  count?: number;
  error?: string;
};
