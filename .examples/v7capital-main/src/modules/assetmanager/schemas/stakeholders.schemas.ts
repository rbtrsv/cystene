import { z } from 'zod';

// ==========================================
// Enums & Types
// ==========================================
export const stakeholderTypeEnum = z.enum(['Fund', 'Investor', 'Employee']);
export type StakeholderType = z.infer<typeof stakeholderTypeEnum>;

export const stakeholderRoleEnum = z.enum(['ADMIN', 'EDITOR', 'VIEWER']);
export type StakeholderRole = z.infer<typeof stakeholderRoleEnum>;

// ==========================================
// Schema Definitions
// ==========================================
export const StakeholderSchema = z.object({
  id: z.number(),
  stakeholderName: z.string().min(1, 'Stakeholder name is required'),
  type: stakeholderTypeEnum,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const StakeholderUserSchema = z.object({
  userProfileId: z.number(),
  stakeholderId: z.number(),
  role: stakeholderRoleEnum,
});

export const CreateStakeholderSchema = z.object({
  stakeholderName: z.string().min(1, 'Stakeholder name is required'),
  type: stakeholderTypeEnum,
});

export const UpdateStakeholderSchema = z.object({
  stakeholderName: z.string().min(1, 'Stakeholder name is required').optional(),
  type: stakeholderTypeEnum.optional(),
});

export const CreateStakeholderUserSchema = z.object({
  userProfileId: z.number(),
  stakeholderId: z.number(),
  role: stakeholderRoleEnum,
});

export const UpdateStakeholderUserSchema = z.object({
  role: stakeholderRoleEnum,
});

// ==========================================
// Type Exports
// ==========================================
export type Stakeholder = z.infer<typeof StakeholderSchema>;
export type StakeholderUser = z.infer<typeof StakeholderUserSchema>;
export type CreateStakeholderInput = z.infer<typeof CreateStakeholderSchema>;
export type UpdateStakeholderInput = z.infer<typeof UpdateStakeholderSchema>;
export type CreateStakeholderUserInput = z.infer<typeof CreateStakeholderUserSchema>;
export type UpdateStakeholderUserInput = z.infer<typeof UpdateStakeholderUserSchema>;

// ==========================================
// Response Types
// ==========================================
export interface StakeholderResponse {
  success: boolean;
  data?: Stakeholder;
  error?: string;
}

export interface StakeholdersResponse {
  success: boolean;
  data?: Stakeholder[];
  error?: string;
}

export interface StakeholderUserResponse {
  success: boolean;
  data?: StakeholderUser;
  error?: string;
}

export interface StakeholderUsersResponse {
  success: boolean;
  data?: StakeholderUser[];
  error?: string;
}

// ==========================================
// Extended Types (with relations)
// ==========================================
export interface StakeholderWithUsers extends Stakeholder {
  users?: StakeholderUser[];
}

export interface StakeholderUserWithProfile extends StakeholderUser {
  profile?: {
    id: number;
    name?: string;
    email: string;
  };
}