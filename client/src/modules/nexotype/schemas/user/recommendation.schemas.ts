import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const PriorityEnum = z.enum(['High', 'Medium', 'Low']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** Recommendation.priority */
export const PRIORITY_OPTIONS = [
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const RecommendationSchema = z.object({
  id: z.number(),
  user_profile_id: z.number().int(),
  asset_id: z.number().int(),
  reason: z.string().min(1),
  priority: PriorityEnum,
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateRecommendationSchema = z.object({
  user_profile_id: z.number().int(),
  asset_id: z.number().int(),
  reason: z.string().min(1),
  priority: PriorityEnum,
});

export const UpdateRecommendationSchema = z.object({
  user_profile_id: z.number().int().optional(),
  asset_id: z.number().int().optional(),
  reason: z.string().min(1).optional(),
  priority: PriorityEnum.optional(),
});

// ==========================================
// Types
// ==========================================

export type Recommendation = z.infer<typeof RecommendationSchema>;
export type CreateRecommendation = z.infer<typeof CreateRecommendationSchema>;
export type UpdateRecommendation = z.infer<typeof UpdateRecommendationSchema>;
export type Priority = z.infer<typeof PriorityEnum>;

// ==========================================
// Response Types
// ==========================================

export type RecommendationResponse = {
  success: boolean;
  data?: Recommendation;
  error?: string;
};

export type RecommendationsResponse = {
  success: boolean;
  data?: Recommendation[];
  count?: number;
  error?: string;
};
