import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const AgreementTypeEnum = z.enum(['License', 'Co-Development', 'Distribution', 'CMO', 'CRADA']);
export const TerritoryEnum = z.enum(['Global', 'US', 'EU', 'Asia-Pacific']);
export const LicenseStatusEnum = z.enum(['Active', 'Expired', 'Terminated']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** LicensingAgreement.agreement_type */
export const AGREEMENT_TYPE_OPTIONS = [
  { label: 'License', value: 'License' },
  { label: 'Co-Development', value: 'Co-Development' },
  { label: 'Distribution', value: 'Distribution' },
  { label: 'CMO', value: 'CMO' },
  { label: 'CRADA', value: 'CRADA' },
] as const;

/** LicensingAgreement.territory */
export const TERRITORY_OPTIONS = [
  { label: 'Global', value: 'Global' },
  { label: 'US', value: 'US' },
  { label: 'EU', value: 'EU' },
  { label: 'Asia-Pacific', value: 'Asia-Pacific' },
] as const;

/** LicensingAgreement.status */
export const LICENSE_STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Expired', value: 'Expired' },
  { label: 'Terminated', value: 'Terminated' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const LicensingAgreementSchema = z.object({
  id: z.number(),
  licensor_id: z.number().int(),
  licensee_id: z.number().int(),
  asset_id: z.number().int().nullable().optional(),
  patent_id: z.number().int().nullable().optional(),
  agreement_type: AgreementTypeEnum,
  territory: TerritoryEnum.nullable().optional(),
  value_usd: z.number().nullable().optional(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
  status: LicenseStatusEnum,
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateLicensingAgreementSchema = z.object({
  licensor_id: z.number().int(),
  licensee_id: z.number().int(),
  asset_id: z.number().int().nullable().optional(),
  patent_id: z.number().int().nullable().optional(),
  agreement_type: AgreementTypeEnum,
  territory: TerritoryEnum.nullable().optional(),
  value_usd: z.number().nullable().optional(),
  start_date: z.string().min(1),
  end_date: z.string().nullable().optional(),
  status: LicenseStatusEnum,
});

export const UpdateLicensingAgreementSchema = z.object({
  licensor_id: z.number().int().optional(),
  licensee_id: z.number().int().optional(),
  asset_id: z.number().int().nullable().optional(),
  patent_id: z.number().int().nullable().optional(),
  agreement_type: AgreementTypeEnum.optional(),
  territory: TerritoryEnum.nullable().optional(),
  value_usd: z.number().nullable().optional(),
  start_date: z.string().min(1).optional(),
  end_date: z.string().nullable().optional(),
  status: LicenseStatusEnum.optional(),
});

// ==========================================
// Types
// ==========================================

export type LicensingAgreement = z.infer<typeof LicensingAgreementSchema>;
export type CreateLicensingAgreement = z.infer<typeof CreateLicensingAgreementSchema>;
export type UpdateLicensingAgreement = z.infer<typeof UpdateLicensingAgreementSchema>;
export type AgreementType = z.infer<typeof AgreementTypeEnum>;
export type Territory = z.infer<typeof TerritoryEnum>;
export type LicenseStatus = z.infer<typeof LicenseStatusEnum>;

// ==========================================
// Response Types
// ==========================================

export type LicensingAgreementResponse = {
  success: boolean;
  data?: LicensingAgreement;
  error?: string;
};

export type LicensingAgreementsResponse = {
  success: boolean;
  data?: LicensingAgreement[];
  count?: number;
  error?: string;
};
