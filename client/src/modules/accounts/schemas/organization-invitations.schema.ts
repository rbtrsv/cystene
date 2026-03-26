import { z } from 'zod';

// ==========================================
// Enums
// ==========================================
export const InvitationStatusEnum = z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED']);
export const InvitationRoleEnum = z.enum(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']);

// ==========================================
// Entity Schemas
// ==========================================
export const InvitationDetailSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  organization_id: z.number(),
  organization_name: z.string(),
  role: InvitationRoleEnum,
  status: InvitationStatusEnum,
  created_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================
export const InvitationCreateSchema = z.object({
  email: z.string().email(),
  organization_id: z.number(),
  role: InvitationRoleEnum.default('VIEWER'),
});

// ==========================================
// Response Schemas
// ==========================================
export const InvitationMessageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});

// ==========================================
// Type Exports
// ==========================================
export type InvitationStatus = z.infer<typeof InvitationStatusEnum>;
export type InvitationRole = z.infer<typeof InvitationRoleEnum>;
export type InvitationDetail = z.infer<typeof InvitationDetailSchema>;
export type InvitationCreate = z.infer<typeof InvitationCreateSchema>;
export type InvitationMessageResponse = z.infer<typeof InvitationMessageResponseSchema>;
