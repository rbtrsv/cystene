import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const AssayReadoutSchema = z.object({
  id: z.number(),
  run_id: z.number().int(),
  biospecimen_id: z.number().int().nullable().optional(),
  asset_id: z.number().int().nullable().optional(),
  raw_value: z.number(),
  unit_id: z.number().int(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateAssayReadoutSchema = z.object({
  run_id: z.number().int(),
  biospecimen_id: z.number().int().nullable().optional(),
  asset_id: z.number().int().nullable().optional(),
  raw_value: z.number(),
  unit_id: z.number().int(),
});

export const UpdateAssayReadoutSchema = z.object({
  run_id: z.number().int().optional(),
  biospecimen_id: z.number().int().nullable().optional(),
  asset_id: z.number().int().nullable().optional(),
  raw_value: z.number().optional(),
  unit_id: z.number().int().optional(),
});

// ==========================================
// Types
// ==========================================

export type AssayReadout = z.infer<typeof AssayReadoutSchema>;
export type CreateAssayReadout = z.infer<typeof CreateAssayReadoutSchema>;
export type UpdateAssayReadout = z.infer<typeof UpdateAssayReadoutSchema>;

// ==========================================
// Response Types
// ==========================================

export type AssayReadoutResponse = {
  success: boolean;
  data?: AssayReadout;
  error?: string;
};

export type AssayReadoutsResponse = {
  success: boolean;
  data?: AssayReadout[];
  count?: number;
  error?: string;
};
