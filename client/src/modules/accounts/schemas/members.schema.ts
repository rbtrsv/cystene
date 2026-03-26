import { z } from 'zod';

// ==========================================
// Entity Schemas
// ==========================================
export const MemberDetailSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.string(),
});

// ==========================================
// Input Schemas
// ==========================================
export const MemberCreateSchema = z.object({
  user_id: z.number(),
  role: z.string().default('VIEWER'),
});

export const MemberUpdateSchema = z.object({
  role: z.string(),
});

// ==========================================
// Response Schemas
// ==========================================
export const MessageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export const MemberListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(MemberDetailSchema).optional(),
  error: z.string().optional(),
});

// ==========================================
// Type Exports
// ==========================================
export type MemberDetail = z.infer<typeof MemberDetailSchema>;
export type MemberCreate = z.infer<typeof MemberCreateSchema>;
export type MemberUpdate = z.infer<typeof MemberUpdateSchema>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;
export type MemberListResponse = z.infer<typeof MemberListResponseSchema>;