import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const BiologicalRelationshipSchema = z.object({
  id: z.number(),
  protein_a_id: z.number().int(),
  protein_b_id: z.number().int(),
  interaction_type: z.string().min(1).max(50),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateBiologicalRelationshipSchema = z.object({
  protein_a_id: z.number().int(),
  protein_b_id: z.number().int(),
  interaction_type: z.string().min(1).max(50),
});

export const UpdateBiologicalRelationshipSchema = z.object({
  protein_a_id: z.number().int().optional(),
  protein_b_id: z.number().int().optional(),
  interaction_type: z.string().min(1).max(50).optional(),
});

// ==========================================
// Types
// ==========================================

export type BiologicalRelationship = z.infer<typeof BiologicalRelationshipSchema>;
export type CreateBiologicalRelationship = z.infer<typeof CreateBiologicalRelationshipSchema>;
export type UpdateBiologicalRelationship = z.infer<typeof UpdateBiologicalRelationshipSchema>;

// ==========================================
// Response Types
// ==========================================

export type BiologicalRelationshipResponse = {
  success: boolean;
  data?: BiologicalRelationship;
  error?: string;
};

export type BiologicalRelationshipsResponse = {
  success: boolean;
  data?: BiologicalRelationship[];
  count?: number;
  error?: string;
};
