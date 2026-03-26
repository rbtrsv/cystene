import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const ProteinDomainSchema = z.object({
  id: z.number(),
  protein_id: z.number().int(),
  pfam_id: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateProteinDomainSchema = z.object({
  protein_id: z.number().int(),
  pfam_id: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
});

export const UpdateProteinDomainSchema = z.object({
  protein_id: z.number().int().optional(),
  pfam_id: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
});

// ==========================================
// Types
// ==========================================

export type ProteinDomain = z.infer<typeof ProteinDomainSchema>;
export type CreateProteinDomain = z.infer<typeof CreateProteinDomainSchema>;
export type UpdateProteinDomain = z.infer<typeof UpdateProteinDomainSchema>;

// ==========================================
// Response Types
// ==========================================

export type ProteinDomainResponse = {
  success: boolean;
  data?: ProteinDomain;
  error?: string;
};

export type ProteinDomainsResponse = {
  success: boolean;
  data?: ProteinDomain[];
  count?: number;
  error?: string;
};
