import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const GenomicFileStatusEnum = z.enum(['Processing', 'Completed']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** GenomicFile.status */
export const GENOMIC_FILE_STATUS_OPTIONS = [
  { label: 'Processing', value: 'Processing' },
  { label: 'Completed', value: 'Completed' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const GenomicFileSchema = z.object({
  id: z.number(),
  subject_id: z.number().int(),
  file_url: z.string().min(1).max(255),
  status: GenomicFileStatusEnum,
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateGenomicFileSchema = z.object({
  subject_id: z.number().int(),
  file_url: z.string().min(1).max(255),
  status: GenomicFileStatusEnum,
});

export const UpdateGenomicFileSchema = z.object({
  subject_id: z.number().int().optional(),
  file_url: z.string().min(1).max(255).optional(),
  status: GenomicFileStatusEnum.optional(),
});

// ==========================================
// Types
// ==========================================

export type GenomicFile = z.infer<typeof GenomicFileSchema>;
export type CreateGenomicFile = z.infer<typeof CreateGenomicFileSchema>;
export type UpdateGenomicFile = z.infer<typeof UpdateGenomicFileSchema>;
export type GenomicFileStatus = z.infer<typeof GenomicFileStatusEnum>;

// ==========================================
// Response Types
// ==========================================

export type GenomicFileResponse = {
  success: boolean;
  data?: GenomicFile;
  error?: string;
};

export type GenomicFilesResponse = {
  success: boolean;
  data?: GenomicFile[];
  count?: number;
  error?: string;
};
