import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const PathwayMembershipSchema = z.object({
  id: z.number(),
  protein_id: z.number().int(),
  pathway_id: z.number().int(),
  role: z.string().max(100).nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreatePathwayMembershipSchema = z.object({
  protein_id: z.number().int(),
  pathway_id: z.number().int(),
  role: z.string().max(100).nullable().optional(),
});

export const UpdatePathwayMembershipSchema = z.object({
  protein_id: z.number().int().optional(),
  pathway_id: z.number().int().optional(),
  role: z.string().max(100).nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type PathwayMembership = z.infer<typeof PathwayMembershipSchema>;
export type CreatePathwayMembership = z.infer<typeof CreatePathwayMembershipSchema>;
export type UpdatePathwayMembership = z.infer<typeof UpdatePathwayMembershipSchema>;

// ==========================================
// Response Types
// ==========================================

export type PathwayMembershipResponse = {
  success: boolean;
  data?: PathwayMembership;
  error?: string;
};

export type PathwayMembershipsResponse = {
  success: boolean;
  data?: PathwayMembership[];
  count?: number;
  error?: string;
};
