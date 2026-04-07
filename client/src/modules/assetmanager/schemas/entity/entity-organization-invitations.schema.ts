import { z } from 'zod';

// ==========================================
// Enums & Types
// ==========================================
export const InvitationStatusEnum = z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED']);
export type InvitationStatus = z.infer<typeof InvitationStatusEnum>;

export const InvitationTypeEnum = z.enum(['invite', 'request']);
export type InvitationType = z.infer<typeof InvitationTypeEnum>;

// ==========================================
// Entity Schemas
// ==========================================
export const EntityOrganizationInvitationSchema = z.object({
  id: z.number(),
  entity_id: z.number(),
  organization_id: z.number(),
  role: z.string(),
  invited_by_id: z.number(),
  invited_at: z.string(),
  status: z.string(),
  invitation_type: InvitationTypeEnum.default('invite'),
});

// ==========================================
// Input Schemas
// ==========================================
export const CreateEntityOrganizationInvitationSchema = z.object({
  entity_id: z.number(),
  organization_id: z.number(),
  role: z.string().default('VIEWER'),
});

export const UpdateEntityOrganizationInvitationSchema = z.object({
  role: z.string().optional(),
  status: z.string().optional(),
});

export const RequestEntityAccessSchema = z.object({
  entity_id: z.number(),
  organization_id: z.number(),
});

// ==========================================
// Response Schemas
// ==========================================
export const EntityOrganizationInvitationResponseSchema = z.object({
  success: z.boolean(),
  data: EntityOrganizationInvitationSchema.optional(),
  error: z.string().optional(),
});

export const EntityOrganizationInvitationsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(EntityOrganizationInvitationSchema).optional(),
  error: z.string().optional(),
});

// ==========================================
// Type Exports
// ==========================================
export type EntityOrganizationInvitation = z.infer<typeof EntityOrganizationInvitationSchema>;
export type CreateEntityOrganizationInvitation = z.infer<typeof CreateEntityOrganizationInvitationSchema>;
export type UpdateEntityOrganizationInvitation = z.infer<typeof UpdateEntityOrganizationInvitationSchema>;
export type RequestEntityAccess = z.infer<typeof RequestEntityAccessSchema>;
export type EntityOrganizationInvitationResponse = z.infer<typeof EntityOrganizationInvitationResponseSchema>;
export type EntityOrganizationInvitationsResponse = z.infer<typeof EntityOrganizationInvitationsResponseSchema>;
