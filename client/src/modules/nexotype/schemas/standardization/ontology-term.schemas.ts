import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const OntologySourceEnum = z.enum(['GO', 'HPO', 'ICD-10']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** OntologyTerm.source */
export const ONTOLOGY_SOURCE_OPTIONS = [
  { label: 'GO', value: 'GO' },
  { label: 'HPO', value: 'HPO' },
  { label: 'ICD-10', value: 'ICD-10' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const OntologyTermSchema = z.object({
  id: z.number(),
  source: OntologySourceEnum,
  accession: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  definition: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateOntologyTermSchema = z.object({
  source: OntologySourceEnum,
  accession: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  definition: z.string().nullable().optional(),
});

export const UpdateOntologyTermSchema = z.object({
  source: OntologySourceEnum.optional(),
  accession: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  definition: z.string().nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type OntologyTerm = z.infer<typeof OntologyTermSchema>;
export type CreateOntologyTerm = z.infer<typeof CreateOntologyTermSchema>;
export type UpdateOntologyTerm = z.infer<typeof UpdateOntologyTermSchema>;
export type OntologySource = z.infer<typeof OntologySourceEnum>;

// ==========================================
// Response Types
// ==========================================

export type OntologyTermResponse = {
  success: boolean;
  data?: OntologyTerm;
  error?: string;
};

export type OntologyTermsResponse = {
  success: boolean;
  data?: OntologyTerm[];
  count?: number;
  error?: string;
};
