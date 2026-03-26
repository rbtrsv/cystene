import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const UnitOfMeasureSchema = z.object({
  id: z.number(),
  symbol: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  si_conversion_factor: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateUnitOfMeasureSchema = z.object({
  symbol: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  si_conversion_factor: z.number().nullable().optional(),
});

export const UpdateUnitOfMeasureSchema = z.object({
  symbol: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
  si_conversion_factor: z.number().nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type UnitOfMeasure = z.infer<typeof UnitOfMeasureSchema>;
export type CreateUnitOfMeasure = z.infer<typeof CreateUnitOfMeasureSchema>;
export type UpdateUnitOfMeasure = z.infer<typeof UpdateUnitOfMeasureSchema>;

// ==========================================
// Response Types
// ==========================================

export type UnitOfMeasureResponse = {
  success: boolean;
  data?: UnitOfMeasure;
  error?: string;
};

export type UnitOfMeasuresResponse = {
  success: boolean;
  data?: UnitOfMeasure[];
  count?: number;
  error?: string;
};
