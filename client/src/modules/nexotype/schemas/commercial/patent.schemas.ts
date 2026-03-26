import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const JurisdictionEnum = z.enum(['US', 'WO', 'EP', 'CN', 'JP']);
export const PatentStatusEnum = z.enum(['Pending', 'Granted', 'Expired', 'Abandoned']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** Patent.jurisdiction */
export const JURISDICTION_OPTIONS = [
  { label: 'US', value: 'US' },
  { label: 'WO', value: 'WO' },
  { label: 'EP', value: 'EP' },
  { label: 'CN', value: 'CN' },
  { label: 'JP', value: 'JP' },
] as const;

/** Patent.status */
export const PATENT_STATUS_OPTIONS = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Granted', value: 'Granted' },
  { label: 'Expired', value: 'Expired' },
  { label: 'Abandoned', value: 'Abandoned' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const PatentSchema = z.object({
  id: z.number(),
  jurisdiction: JurisdictionEnum,
  patent_number: z.string().max(50),
  title: z.string().nullable().optional(),
  status: PatentStatusEnum,
  filing_date: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreatePatentSchema = z.object({
  jurisdiction: JurisdictionEnum,
  patent_number: z.string().min(1).max(50),
  title: z.string().nullable().optional(),
  status: PatentStatusEnum.optional().default('Pending'),
  filing_date: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
});

export const UpdatePatentSchema = z.object({
  jurisdiction: JurisdictionEnum.optional(),
  patent_number: z.string().min(1).max(50).optional(),
  title: z.string().nullable().optional(),
  status: PatentStatusEnum.optional(),
  filing_date: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type Patent = z.infer<typeof PatentSchema>;
export type CreatePatent = z.infer<typeof CreatePatentSchema>;
export type UpdatePatent = z.infer<typeof UpdatePatentSchema>;
export type Jurisdiction = z.infer<typeof JurisdictionEnum>;
export type PatentStatus = z.infer<typeof PatentStatusEnum>;

// ==========================================
// Badge Variant Helpers
// ==========================================

/** Badge variant for patent status */
export const getPatentStatusVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status) {
    case 'Granted':
      return 'default';
    case 'Pending':
      return 'secondary';
    case 'Expired':
      return 'outline';
    case 'Abandoned':
      return 'destructive';
    default:
      return 'outline';
  }
};

// ==========================================
// Response Types
// ==========================================

export type PatentResponse = {
  success: boolean;
  data?: Patent;
  error?: string;
};

export type PatentsResponse = {
  success: boolean;
  data?: Patent[];
  count?: number;
  error?: string;
};
