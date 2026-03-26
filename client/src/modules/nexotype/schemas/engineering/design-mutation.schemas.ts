import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const DesignMutationSchema = z.object({
  id: z.number(),
  candidate_id: z.number().int(),
  position: z.number().int(),
  wild_type: z.string().min(1).max(10),
  mutant: z.string().min(1).max(10),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateDesignMutationSchema = z.object({
  candidate_id: z.number().int(),
  position: z.number().int(),
  wild_type: z.string().min(1).max(10),
  mutant: z.string().min(1).max(10),
});

export const UpdateDesignMutationSchema = z.object({
  candidate_id: z.number().int().optional(),
  position: z.number().int().optional(),
  wild_type: z.string().min(1).max(10).optional(),
  mutant: z.string().min(1).max(10).optional(),
});

// ==========================================
// Types
// ==========================================

export type DesignMutation = z.infer<typeof DesignMutationSchema>;
export type CreateDesignMutation = z.infer<typeof CreateDesignMutationSchema>;
export type UpdateDesignMutation = z.infer<typeof UpdateDesignMutationSchema>;

// ==========================================
// Response Types
// ==========================================

export type DesignMutationResponse = {
  success: boolean;
  data?: DesignMutation;
  error?: string;
};

export type DesignMutationsResponse = {
  success: boolean;
  data?: DesignMutation[];
  count?: number;
  error?: string;
};
