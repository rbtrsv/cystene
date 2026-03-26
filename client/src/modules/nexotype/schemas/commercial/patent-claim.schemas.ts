import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const ClaimTypeEnum = z.enum(['Composition', 'Method']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** PatentClaim.claim_type */
export const CLAIM_TYPE_OPTIONS = [
  { label: 'Composition', value: 'Composition' },
  { label: 'Method', value: 'Method' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const PatentClaimSchema = z.object({
  id: z.number(),
  patent_id: z.number().int(),
  asset_id: z.number().int(),
  claim_type: ClaimTypeEnum,
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreatePatentClaimSchema = z.object({
  patent_id: z.number().int(),
  asset_id: z.number().int(),
  claim_type: ClaimTypeEnum,
});

export const UpdatePatentClaimSchema = z.object({
  patent_id: z.number().int().optional(),
  asset_id: z.number().int().optional(),
  claim_type: ClaimTypeEnum.optional(),
});

// ==========================================
// Types
// ==========================================

export type PatentClaim = z.infer<typeof PatentClaimSchema>;
export type CreatePatentClaim = z.infer<typeof CreatePatentClaimSchema>;
export type UpdatePatentClaim = z.infer<typeof UpdatePatentClaimSchema>;
export type ClaimType = z.infer<typeof ClaimTypeEnum>;

// ==========================================
// Response Types
// ==========================================

export type PatentClaimResponse = {
  success: boolean;
  data?: PatentClaim;
  error?: string;
};

export type PatentClaimsResponse = {
  success: boolean;
  data?: PatentClaim[];
  count?: number;
  error?: string;
};
