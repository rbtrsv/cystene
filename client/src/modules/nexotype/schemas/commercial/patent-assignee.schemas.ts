import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const PatentAssigneeSchema = z.object({
  id: z.number(),
  patent_id: z.number().int(),
  market_organization_id: z.number().int(),
  assignment_date: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreatePatentAssigneeSchema = z.object({
  patent_id: z.number().int(),
  market_organization_id: z.number().int(),
  assignment_date: z.string().min(1),
});

export const UpdatePatentAssigneeSchema = z.object({
  patent_id: z.number().int().optional(),
  market_organization_id: z.number().int().optional(),
  assignment_date: z.string().min(1).optional(),
});

// ==========================================
// Types
// ==========================================

export type PatentAssignee = z.infer<typeof PatentAssigneeSchema>;
export type CreatePatentAssignee = z.infer<typeof CreatePatentAssigneeSchema>;
export type UpdatePatentAssignee = z.infer<typeof UpdatePatentAssigneeSchema>;

// ==========================================
// Response Types
// ==========================================

export type PatentAssigneeResponse = {
  success: boolean;
  data?: PatentAssignee;
  error?: string;
};

export type PatentAssigneesResponse = {
  success: boolean;
  data?: PatentAssignee[];
  count?: number;
  error?: string;
};
