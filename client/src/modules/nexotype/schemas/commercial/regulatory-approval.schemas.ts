import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const AgencyEnum = z.enum(['FDA', 'EMA', 'PMDA', 'NMPA', 'TGA']);
export const ApprovalTypeEnum = z.enum(['NDA', 'BLA', '510(k)', 'Accelerated', 'Conditional']);
export const ApprovalStatusEnum = z.enum(['Approved', 'Withdrawn', 'Tentative']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** RegulatoryApproval.agency */
export const AGENCY_OPTIONS = [
  { label: 'FDA', value: 'FDA' },
  { label: 'EMA', value: 'EMA' },
  { label: 'PMDA', value: 'PMDA' },
  { label: 'NMPA', value: 'NMPA' },
  { label: 'TGA', value: 'TGA' },
] as const;

/** RegulatoryApproval.approval_type */
export const APPROVAL_TYPE_OPTIONS = [
  { label: 'NDA', value: 'NDA' },
  { label: 'BLA', value: 'BLA' },
  { label: '510(k)', value: '510(k)' },
  { label: 'Accelerated', value: 'Accelerated' },
  { label: 'Conditional', value: 'Conditional' },
] as const;

/** RegulatoryApproval.status */
export const APPROVAL_STATUS_OPTIONS = [
  { label: 'Approved', value: 'Approved' },
  { label: 'Withdrawn', value: 'Withdrawn' },
  { label: 'Tentative', value: 'Tentative' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const RegulatoryApprovalSchema = z.object({
  id: z.number(),
  asset_id: z.number().int(),
  indication_id: z.number().int(),
  agency: AgencyEnum,
  approval_type: ApprovalTypeEnum,
  approval_date: z.string(),
  status: ApprovalStatusEnum,
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateRegulatoryApprovalSchema = z.object({
  asset_id: z.number().int(),
  indication_id: z.number().int(),
  agency: AgencyEnum,
  approval_type: ApprovalTypeEnum,
  approval_date: z.string().min(1),
  status: ApprovalStatusEnum,
});

export const UpdateRegulatoryApprovalSchema = z.object({
  asset_id: z.number().int().optional(),
  indication_id: z.number().int().optional(),
  agency: AgencyEnum.optional(),
  approval_type: ApprovalTypeEnum.optional(),
  approval_date: z.string().min(1).optional(),
  status: ApprovalStatusEnum.optional(),
});

// ==========================================
// Types
// ==========================================

export type RegulatoryApproval = z.infer<typeof RegulatoryApprovalSchema>;
export type CreateRegulatoryApproval = z.infer<typeof CreateRegulatoryApprovalSchema>;
export type UpdateRegulatoryApproval = z.infer<typeof UpdateRegulatoryApprovalSchema>;
export type Agency = z.infer<typeof AgencyEnum>;
export type ApprovalType = z.infer<typeof ApprovalTypeEnum>;
export type ApprovalStatus = z.infer<typeof ApprovalStatusEnum>;

// ==========================================
// Response Types
// ==========================================

export type RegulatoryApprovalResponse = {
  success: boolean;
  data?: RegulatoryApproval;
  error?: string;
};

export type RegulatoryApprovalsResponse = {
  success: boolean;
  data?: RegulatoryApproval[];
  count?: number;
  error?: string;
};
