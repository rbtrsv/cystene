import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const ConstructSchema = z.object({
  id: z.number(),
  candidate_id: z.number().int(),
  plasmid_map_url: z.string().max(255).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateConstructSchema = z.object({
  candidate_id: z.number().int(),
  plasmid_map_url: z.string().max(255).optional(),
});

export const UpdateConstructSchema = z.object({
  candidate_id: z.number().int().optional(),
  plasmid_map_url: z.string().max(255).nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type Construct = z.infer<typeof ConstructSchema>;
export type CreateConstruct = z.infer<typeof CreateConstructSchema>;
export type UpdateConstruct = z.infer<typeof UpdateConstructSchema>;

// ==========================================
// Response Types
// ==========================================

export type ConstructResponse = {
  success: boolean;
  data?: Construct;
  error?: string;
};

export type ConstructsResponse = {
  success: boolean;
  data?: Construct[];
  count?: number;
  error?: string;
};
