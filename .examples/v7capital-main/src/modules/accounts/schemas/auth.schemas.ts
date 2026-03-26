import { z } from 'zod';

// ==========================================
// Enums & Types
// ==========================================
export const userRoleEnum = z.enum(['ADMIN', 'EDITOR', 'VIEWER']);
export type UserRole = z.infer<typeof userRoleEnum>;

// ==========================================
// Schema Definitions
// ==========================================
export const UserProfileSchema = z.object({
  id: z.number(),
  userId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: userRoleEnum.nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
});

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const SignupSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const CreateUserProfileSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  role: userRoleEnum.nullable().optional(),
});

export const UpdateUserProfileSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().nullable().optional(),
  role: userRoleEnum.nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type CreateUserProfileInput = z.infer<typeof CreateUserProfileSchema>;
export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;

// ==========================================
// Response Types
// ==========================================
export interface UserProfileResponse {
  success: boolean;
  data?: UserProfile;
  error?: string;
}

export interface UserProfilesResponse {
  success: boolean;
  data?: UserProfile[];
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  error?: string;
}

export interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
  expires: string;
}
