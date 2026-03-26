import { z } from 'zod';
import { OrganizationSchema } from './organizations.schema';

// ==========================================
// Enums & Types
// ==========================================
export const userRoleEnum = z.enum(['OWNER', 'ADMIN', 'MEMBER']);
export type UserRole = z.infer<typeof userRoleEnum>;

// ==========================================
// Entity Schemas
// ==========================================
export const UserSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  email: z.string().email('Invalid email address'),
  role: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  email_verified: z.boolean(),
});

export const TokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string().default('bearer'),
});

export const SessionSchema = z.object({
  user: UserSchema,
  organizations: z.array(OrganizationSchema),
});

// ==========================================
// Input Schemas
// ==========================================
export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const RefreshTokenSchema = z.object({
  refresh_token: z.string(),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const CompleteResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// ==========================================
// Type Exports
// ==========================================
export type User = z.infer<typeof UserSchema>;
export type Token = z.infer<typeof TokenSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type CompleteResetPasswordInput = z.infer<typeof CompleteResetPasswordSchema>;

// ==========================================
// Response Types
// ==========================================
export type AuthResponse = {
  success: boolean;
  data?: Session;
  token?: Token;
  error?: string;
};
