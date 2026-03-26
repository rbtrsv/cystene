import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const ContextAttributeSchema = z.object({
  id: z.number(),
  evidence_id: z.number().int(),
  key: z.string().min(1).max(50),
  value: z.string().min(1).max(255),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateContextAttributeSchema = z.object({
  evidence_id: z.number().int(),
  key: z.string().min(1).max(50),
  value: z.string().min(1).max(255),
});

export const UpdateContextAttributeSchema = z.object({
  evidence_id: z.number().int().optional(),
  key: z.string().min(1).max(50).optional(),
  value: z.string().min(1).max(255).optional(),
});

// ==========================================
// Types
// ==========================================

export type ContextAttribute = z.infer<typeof ContextAttributeSchema>;
export type CreateContextAttribute = z.infer<typeof CreateContextAttributeSchema>;
export type UpdateContextAttribute = z.infer<typeof UpdateContextAttributeSchema>;

// ==========================================
// Response Types
// ==========================================

export type ContextAttributeResponse = {
  success: boolean;
  data?: ContextAttribute;
  error?: string;
};

export type ContextAttributesResponse = {
  success: boolean;
  data?: ContextAttribute[];
  count?: number;
  error?: string;
};
