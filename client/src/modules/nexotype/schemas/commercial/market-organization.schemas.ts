import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const OrgTypeEnum = z.enum(['Public', 'Private', 'University']);
export const OrgStatusEnum = z.enum(['Active', 'Inactive', 'Acquired', 'Bankrupt']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** MarketOrganization.org_type */
export const ORG_TYPE_OPTIONS = [
  { label: 'Public', value: 'Public' },
  { label: 'Private', value: 'Private' },
  { label: 'University', value: 'University' },
] as const;

/** MarketOrganization.status */
export const ORG_STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
  { label: 'Acquired', value: 'Acquired' },
  { label: 'Bankrupt', value: 'Bankrupt' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const MarketOrganizationSchema = z.object({
  id: z.number(),
  legal_name: z.string().min(1).max(255),
  isin: z.string().max(12).nullable().optional(),
  ticker_symbol: z.string().max(20).nullable().optional(),
  primary_exchange: z.string().max(50).nullable().optional(),
  org_type: OrgTypeEnum,
  status: OrgStatusEnum,
  founded: z.string().nullable().optional(),
  headquarters: z.string().max(255).nullable().optional(),
  website: z.string().max(500).nullable().optional(),
  employee_count: z.number().int().nullable().optional(),
  revenue_usd: z.number().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateMarketOrganizationSchema = z.object({
  legal_name: z.string().min(1).max(255),
  isin: z.string().max(12).nullable().optional(),
  ticker_symbol: z.string().max(20).nullable().optional(),
  primary_exchange: z.string().max(50).nullable().optional(),
  org_type: OrgTypeEnum,
  status: OrgStatusEnum.optional().default('Active'),
  founded: z.string().nullable().optional(),
  headquarters: z.string().max(255).nullable().optional(),
  website: z.string().max(500).nullable().optional(),
  employee_count: z.number().int().nullable().optional(),
  revenue_usd: z.number().nullable().optional(),
});

export const UpdateMarketOrganizationSchema = z.object({
  legal_name: z.string().min(1).max(255).optional(),
  isin: z.string().max(12).nullable().optional(),
  ticker_symbol: z.string().max(20).nullable().optional(),
  primary_exchange: z.string().max(50).nullable().optional(),
  org_type: OrgTypeEnum.optional(),
  status: OrgStatusEnum.optional(),
  founded: z.string().nullable().optional(),
  headquarters: z.string().max(255).nullable().optional(),
  website: z.string().max(500).nullable().optional(),
  employee_count: z.number().int().nullable().optional(),
  revenue_usd: z.number().nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type MarketOrganization = z.infer<typeof MarketOrganizationSchema>;
export type CreateMarketOrganization = z.infer<typeof CreateMarketOrganizationSchema>;
export type UpdateMarketOrganization = z.infer<typeof UpdateMarketOrganizationSchema>;
export type OrgType = z.infer<typeof OrgTypeEnum>;
export type OrgStatus = z.infer<typeof OrgStatusEnum>;

// ==========================================
// Badge Variant Helpers
// ==========================================

/** Badge variant for organization status */
export const getOrgStatusVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status) {
    case 'Active':
      return 'default';
    case 'Inactive':
      return 'secondary';
    case 'Acquired':
      return 'outline';
    case 'Bankrupt':
      return 'destructive';
    default:
      return 'outline';
  }
};

/** Badge variant for organization type */
export const getOrgTypeVariant = (orgType: string): 'default' | 'secondary' | 'outline' => {
  switch (orgType) {
    case 'Public':
      return 'default';
    case 'Private':
      return 'secondary';
    case 'University':
      return 'outline';
    default:
      return 'outline';
  }
};

// ==========================================
// Response Types
// ==========================================

export type MarketOrganizationResponse = {
  success: boolean;
  data?: MarketOrganization;
  error?: string;
};

export type MarketOrganizationsResponse = {
  success: boolean;
  data?: MarketOrganization[];
  count?: number;
  error?: string;
};
