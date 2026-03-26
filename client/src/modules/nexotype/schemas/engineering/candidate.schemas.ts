import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const CandidateSchema = z.object({
  id: z.number(),
  parent_candidate_id: z.number().int().nullable().optional(),
  asset_id: z.number().int(),
  version_number: z.string().min(1).max(20),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateCandidateSchema = z.object({
  parent_candidate_id: z.number().int().nullable().optional(),
  asset_id: z.number().int(),
  version_number: z.string().min(1).max(20),
});

export const UpdateCandidateSchema = z.object({
  parent_candidate_id: z.number().int().nullable().optional(),
  asset_id: z.number().int().optional(),
  version_number: z.string().min(1).max(20).optional(),
});

// ==========================================
// Types
// ==========================================

export type Candidate = z.infer<typeof CandidateSchema>;
export type CreateCandidate = z.infer<typeof CreateCandidateSchema>;
export type UpdateCandidate = z.infer<typeof UpdateCandidateSchema>;

// ==========================================
// Response Types
// ==========================================

export type CandidateResponse = {
  success: boolean;
  data?: Candidate;
  error?: string;
};

export type CandidatesResponse = {
  success: boolean;
  data?: Candidate[];
  count?: number;
  error?: string;
};
