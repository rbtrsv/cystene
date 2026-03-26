import { z } from 'zod';

// ==========================================
// Enums & Types
// ==========================================
export const companyRoleEnum = z.enum(['ADMIN', 'EDITOR', 'VIEWER']);
export type CompanyRole = z.infer<typeof companyRoleEnum>;

// ==========================================
// Entity Schemas
// ==========================================
export const CompanySchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required'),
  website: z.string().url().nullable(),
  country: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CompanyUserSchema = z.object({
  userProfileId: z.number(),
  companyId: z.number(),
  role: companyRoleEnum,
});

// ==========================================
// Input Schemas
// ==========================================
export const CreateCompanySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  website: z.string().url().or(z.literal('')).optional().nullable(),
  country: z.string().optional().nullable(),
});

export const UpdateCompanySchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  website: z.string().url().or(z.literal('')).optional().nullable(),
  country: z.string().optional().nullable(),
});

export const CreateCompanyUserSchema = z.object({
  userProfileId: z.number(),
  companyId: z.number(),
  role: companyRoleEnum,
});

export const UpdateCompanyUserSchema = z.object({
  role: companyRoleEnum,
});

// ==========================================
// Type Exports
// ==========================================
export type Company = z.infer<typeof CompanySchema>;
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;
export type CompanyUser = z.infer<typeof CompanyUserSchema>;
export type CreateCompanyUserInput = z.infer<typeof CreateCompanyUserSchema>;
export type UpdateCompanyUserInput = z.infer<typeof UpdateCompanyUserSchema>;

// ==========================================
// Response Types
// ==========================================
export type CompanyResponse = {
  success: boolean;
  data?: Company;
  error?: string;
};

export type CompaniesResponse = {
  success: boolean;
  data?: Company[];
  error?: string;
};

export type CompanyUserResponse = {
  success: boolean;
  data?: CompanyUser;
  error?: string;
};

export type CompanyUsersResponse = {
  success: boolean;
  data?: CompanyUserWithProfile[];
  error?: string;
};

// ==========================================
// Extended Types (with relations)
// ==========================================
export interface CompanyWithUsers extends Company {
  users?: CompanyUser[];
}

export interface CompanyUserWithProfile extends CompanyUser {
  profile?: {
    id: number;
    name?: string;
    email: string;
  };
}