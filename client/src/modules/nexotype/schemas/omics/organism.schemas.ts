import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const OrganismSchema = z.object({
  id: z.number(),
  ncbi_taxonomy_id: z.number().int(),
  scientific_name: z.string().min(1).max(100),
  common_name: z.string().min(1).max(100),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateOrganismSchema = z.object({
  ncbi_taxonomy_id: z.number().int(),
  scientific_name: z.string().min(1).max(100),
  common_name: z.string().min(1).max(100),
});

export const UpdateOrganismSchema = z.object({
  ncbi_taxonomy_id: z.number().int().optional(),
  scientific_name: z.string().min(1).max(100).optional(),
  common_name: z.string().min(1).max(100).optional(),
});

// ==========================================
// Types
// ==========================================

export type Organism = z.infer<typeof OrganismSchema>;
export type CreateOrganism = z.infer<typeof CreateOrganismSchema>;
export type UpdateOrganism = z.infer<typeof UpdateOrganismSchema>;

// ==========================================
// Response Types
// ==========================================

export type OrganismResponse = {
  success: boolean;
  data?: Organism;
  error?: string;
};

export type OrganismsResponse = {
  success: boolean;
  data?: Organism[];
  count?: number;
  error?: string;
};
