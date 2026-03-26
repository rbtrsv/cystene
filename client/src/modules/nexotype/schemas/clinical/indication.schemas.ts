import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const IndicationSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(255),
  icd_10_code: z.string().max(20).nullable().optional(),
  meddra_id: z.string().max(20).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateIndicationSchema = z.object({
  name: z.string().min(1).max(255),
  icd_10_code: z.string().max(20).nullable().optional(),
  meddra_id: z.string().max(20).nullable().optional(),
});

export const UpdateIndicationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  icd_10_code: z.string().max(20).nullable().optional(),
  meddra_id: z.string().max(20).nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type Indication = z.infer<typeof IndicationSchema>;
export type CreateIndication = z.infer<typeof CreateIndicationSchema>;
export type UpdateIndication = z.infer<typeof UpdateIndicationSchema>;

// ==========================================
// Response Types
// ==========================================

export type IndicationResponse = {
  success: boolean;
  data?: Indication;
  error?: string;
};

export type IndicationsResponse = {
  success: boolean;
  data?: Indication[];
  count?: number;
  error?: string;
};
