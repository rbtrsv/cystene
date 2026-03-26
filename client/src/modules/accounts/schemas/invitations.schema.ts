import { z } from 'zod';
import { MessageResponseSchema } from './shared.schemas';

// ==========================================
// Enums & Types  
// ==========================================
export const invitationStatusEnum = z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED']);
export type InvitationStatus = z.infer<typeof invitationStatusEnum>;

// ==========================================
// Entity Schemas
// ==========================================
export const InvitationSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  organization_id: z.number(),
  organization_name: z.string(),
  role: z.string(),
  status: z.string(),
  created_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================
export const CreateInvitationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  organization_id: z.number(),
  role: z.string().default('VIEWER'),
});

// ==========================================
// Type Exports
// ==========================================
export type Invitation = z.infer<typeof InvitationSchema>;
export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;

// ==========================================
// Response Types
// ==========================================
export type InvitationResponse = {
  success: boolean;
  data?: Invitation;
  error?: string;
};

export type InvitationsResponse = {
  success: boolean;
  data?: Invitation[];
  error?: string;
};

export type InvitationMessageResponse = z.infer<typeof MessageResponseSchema>;

