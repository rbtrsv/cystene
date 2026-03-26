import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const UserProfileSchema = z.object({
  id: z.number(),
  user_id: z.number().int(),
  subject_id: z.number().int(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateUserProfileSchema = z.object({
  user_id: z.number().int(),
  subject_id: z.number().int(),
});

export const UpdateUserProfileSchema = z.object({
  user_id: z.number().int().optional(),
  subject_id: z.number().int().optional(),
});

// ==========================================
// Types
// ==========================================

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type CreateUserProfile = z.infer<typeof CreateUserProfileSchema>;
export type UpdateUserProfile = z.infer<typeof UpdateUserProfileSchema>;

// ==========================================
// Response Types
// ==========================================

export type UserProfileResponse = {
  success: boolean;
  data?: UserProfile;
  error?: string;
};

export type UserProfilesResponse = {
  success: boolean;
  data?: UserProfile[];
  count?: number;
  error?: string;
};
