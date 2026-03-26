import { z } from 'zod';

// ==========================================
// Entity Schemas
// ==========================================
export const EntityOrganizationMemberSchema = z.object({
  id: z.number(),
  organization_id: z.number(),
  entity_id: z.number(),
  role: z.string(),
  joined_at: z.string(),
});

// ==========================================
// Input Schemas
// ==========================================
export const CreateEntityOrganizationMemberSchema = z.object({
  organization_id: z.number(),
  entity_id: z.number(),
  role: z.string().default('VIEWER'),
});

export const UpdateEntityOrganizationMemberSchema = z.object({
  role: z.string(),
});

// ==========================================
// Response Schemas
// ==========================================
export const EntityOrganizationMemberResponseSchema = z.object({
  success: z.boolean(),
  data: EntityOrganizationMemberSchema.optional(),
  error: z.string().optional(),
});

export const EntityOrganizationMembersResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(EntityOrganizationMemberSchema).optional(),
  error: z.string().optional(),
});

// ==========================================
// Type Exports
// ==========================================
export type EntityOrganizationMember = z.infer<typeof EntityOrganizationMemberSchema>;
export type CreateEntityOrganizationMember = z.infer<typeof CreateEntityOrganizationMemberSchema>;
export type UpdateEntityOrganizationMember = z.infer<typeof UpdateEntityOrganizationMemberSchema>;
export type EntityOrganizationMemberResponse = z.infer<typeof EntityOrganizationMemberResponseSchema>;
export type EntityOrganizationMembersResponse = z.infer<typeof EntityOrganizationMembersResponseSchema>;
