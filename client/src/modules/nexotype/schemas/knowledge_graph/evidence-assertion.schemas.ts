import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const EvidenceAssertionSchema = z.object({
  id: z.number(),
  relationship_table: z.string().min(1).max(50),
  relationship_id: z.number().int(),
  source_id: z.number().int(),
  confidence_score: z.number(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateEvidenceAssertionSchema = z.object({
  relationship_table: z.string().min(1).max(50),
  relationship_id: z.number().int(),
  source_id: z.number().int(),
  confidence_score: z.number(),
});

export const UpdateEvidenceAssertionSchema = z.object({
  relationship_table: z.string().min(1).max(50).optional(),
  relationship_id: z.number().int().optional(),
  source_id: z.number().int().optional(),
  confidence_score: z.number().optional(),
});

// ==========================================
// Types
// ==========================================

export type EvidenceAssertion = z.infer<typeof EvidenceAssertionSchema>;
export type CreateEvidenceAssertion = z.infer<typeof CreateEvidenceAssertionSchema>;
export type UpdateEvidenceAssertion = z.infer<typeof UpdateEvidenceAssertionSchema>;

// ==========================================
// Response Types
// ==========================================

export type EvidenceAssertionResponse = {
  success: boolean;
  data?: EvidenceAssertion;
  error?: string;
};

export type EvidenceAssertionsResponse = {
  success: boolean;
  data?: EvidenceAssertion[];
  count?: number;
  error?: string;
};
