import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const TranscriptSchema = z.object({
  id: z.number(),
  gene_id: z.number().int(),
  ensembl_transcript_id: z.string().min(1).max(50),
  is_canonical: z.boolean(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateTranscriptSchema = z.object({
  gene_id: z.number().int(),
  ensembl_transcript_id: z.string().min(1).max(50),
  is_canonical: z.boolean().default(false),
});

export const UpdateTranscriptSchema = z.object({
  gene_id: z.number().int().optional(),
  ensembl_transcript_id: z.string().min(1).max(50).optional(),
  is_canonical: z.boolean().optional(),
});

// ==========================================
// Types
// ==========================================

export type Transcript = z.infer<typeof TranscriptSchema>;
export type CreateTranscript = z.infer<typeof CreateTranscriptSchema>;
export type UpdateTranscript = z.infer<typeof UpdateTranscriptSchema>;

// ==========================================
// Response Types
// ==========================================

export type TranscriptResponse = {
  success: boolean;
  data?: Transcript;
  error?: string;
};

export type TranscriptsResponse = {
  success: boolean;
  data?: Transcript[];
  count?: number;
  error?: string;
};
