import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const SourceTypeEnum = z.enum(['PubMed', 'Patent', 'ClinicalTrial']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** Source.source_type */
export const SOURCE_TYPE_OPTIONS = [
  { label: 'PubMed', value: 'PubMed' },
  { label: 'Patent', value: 'Patent' },
  { label: 'ClinicalTrial', value: 'ClinicalTrial' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const SourceSchema = z.object({
  id: z.number(),
  source_type: SourceTypeEnum,
  external_id: z.string().min(1).max(100),
  title: z.string().nullable(),
  authors: z.string().nullable(),
  journal: z.string().max(255).nullable(),
  publication_date: z.string().nullable(),
  url: z.string().max(500).nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateSourceSchema = z.object({
  source_type: SourceTypeEnum,
  external_id: z.string().min(1).max(100),
  title: z.string().optional(),
  authors: z.string().optional(),
  journal: z.string().max(255).optional(),
  publication_date: z.string().optional(),
  url: z.string().max(500).optional(),
});

export const UpdateSourceSchema = z.object({
  source_type: SourceTypeEnum.optional(),
  external_id: z.string().min(1).max(100).optional(),
  title: z.string().optional(),
  authors: z.string().optional(),
  journal: z.string().max(255).optional(),
  publication_date: z.string().optional(),
  url: z.string().max(500).optional(),
});

// ==========================================
// Types
// ==========================================

export type Source = z.infer<typeof SourceSchema>;
export type CreateSource = z.infer<typeof CreateSourceSchema>;
export type UpdateSource = z.infer<typeof UpdateSourceSchema>;
export type SourceType = z.infer<typeof SourceTypeEnum>;

// ==========================================
// Response Types
// ==========================================

export type SourceResponse = {
  success: boolean;
  data?: Source;
  error?: string;
};

export type SourcesResponse = {
  success: boolean;
  data?: Source[];
  count?: number;
  error?: string;
};
