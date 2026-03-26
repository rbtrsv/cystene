import { z } from 'zod';

// ==========================================
// Enums & Types
// ==========================================
export const organizationRoleEnum = z.enum(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']);
export type OrganizationRole = z.infer<typeof organizationRoleEnum>;

// ==========================================
// Entity Schemas
// ==========================================
export const OrganizationSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required'),
  role: organizationRoleEnum,
  created_at: z.string(),
  updated_at: z.string(),
});

// ==========================================
// Input Schemas
// ==========================================
export const CreateOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

// ==========================================
// Type Exports
// ==========================================
export type Organization = z.infer<typeof OrganizationSchema>;
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;

// ==========================================
// Response Types
// ==========================================
export type OrganizationResponse = {
  success: boolean;
  data?: Organization;
  error?: string;
};

export type OrganizationsResponse = {
  success: boolean;
  data?: Organization[];
  error?: string;
};
