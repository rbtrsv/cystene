import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const PathwayScoreSchema = z.object({
  id: z.number(),
  subject_id: z.number().int(),
  pathway_id: z.number().int(),
  score: z.number(),
  calculated_at: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreatePathwayScoreSchema = z.object({
  subject_id: z.number().int(),
  pathway_id: z.number().int(),
  score: z.number(),
  calculated_at: z.string().min(1),
});

export const UpdatePathwayScoreSchema = z.object({
  subject_id: z.number().int().optional(),
  pathway_id: z.number().int().optional(),
  score: z.number().optional(),
  calculated_at: z.string().optional(),
});

// ==========================================
// Types
// ==========================================

export type PathwayScore = z.infer<typeof PathwayScoreSchema>;
export type CreatePathwayScore = z.infer<typeof CreatePathwayScoreSchema>;
export type UpdatePathwayScore = z.infer<typeof UpdatePathwayScoreSchema>;

// ==========================================
// Response Types
// ==========================================

export type PathwayScoreResponse = {
  success: boolean;
  data?: PathwayScore;
  error?: string;
};

export type PathwayScoresResponse = {
  success: boolean;
  data?: PathwayScore[];
  count?: number;
  error?: string;
};
