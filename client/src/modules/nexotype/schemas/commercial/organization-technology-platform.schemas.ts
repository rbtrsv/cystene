import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const UtilizationTypeEnum = z.enum(['Core', 'Licensed', 'Research']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** OrganizationTechnologyPlatform.utilization_type */
export const UTILIZATION_TYPE_OPTIONS = [
  { label: 'Core', value: 'Core' },
  { label: 'Licensed', value: 'Licensed' },
  { label: 'Research', value: 'Research' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const OrganizationTechnologyPlatformSchema = z.object({
  id: z.number(),
  market_organization_id: z.number().int(),
  technology_platform_id: z.number().int(),
  utilization_type: UtilizationTypeEnum,
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateOrganizationTechnologyPlatformSchema = z.object({
  market_organization_id: z.number().int(),
  technology_platform_id: z.number().int(),
  utilization_type: UtilizationTypeEnum,
});

export const UpdateOrganizationTechnologyPlatformSchema = z.object({
  market_organization_id: z.number().int().optional(),
  technology_platform_id: z.number().int().optional(),
  utilization_type: UtilizationTypeEnum.optional(),
});

// ==========================================
// Types
// ==========================================

export type OrganizationTechnologyPlatform = z.infer<typeof OrganizationTechnologyPlatformSchema>;
export type CreateOrganizationTechnologyPlatform = z.infer<typeof CreateOrganizationTechnologyPlatformSchema>;
export type UpdateOrganizationTechnologyPlatform = z.infer<typeof UpdateOrganizationTechnologyPlatformSchema>;
export type UtilizationType = z.infer<typeof UtilizationTypeEnum>;

// ==========================================
// Response Types
// ==========================================

export type OrganizationTechnologyPlatformResponse = {
  success: boolean;
  data?: OrganizationTechnologyPlatform;
  error?: string;
};

export type OrganizationTechnologyPlatformsResponse = {
  success: boolean;
  data?: OrganizationTechnologyPlatform[];
  count?: number;
  error?: string;
};
