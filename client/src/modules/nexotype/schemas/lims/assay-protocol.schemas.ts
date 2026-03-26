import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const AssayProtocolSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100),
  version: z.string().min(1).max(20),
  method_description: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateAssayProtocolSchema = z.object({
  name: z.string().min(1).max(100),
  version: z.string().min(1).max(20),
  method_description: z.string().nullable().optional(),
});

export const UpdateAssayProtocolSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  version: z.string().min(1).max(20).optional(),
  method_description: z.string().nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type AssayProtocol = z.infer<typeof AssayProtocolSchema>;
export type CreateAssayProtocol = z.infer<typeof CreateAssayProtocolSchema>;
export type UpdateAssayProtocol = z.infer<typeof UpdateAssayProtocolSchema>;

// ==========================================
// Response Types
// ==========================================

export type AssayProtocolResponse = {
  success: boolean;
  data?: AssayProtocol;
  error?: string;
};

export type AssayProtocolsResponse = {
  success: boolean;
  data?: AssayProtocol[];
  count?: number;
  error?: string;
};
