'use client';

import { INVITATION_ENDPOINTS } from '../utils/api.endpoints';
import { fetchClient } from '../utils/fetch.client';
import { 
  Invitation, 
  CreateInvitationInput,
  InvitationMessageResponse
} from '../schemas/invitations.schema';

/**
 * Create a new invitation
 * @param data Invitation creation data
 * @returns Promise with success message
 */
export const createInvitation = async (data: CreateInvitationInput): Promise<InvitationMessageResponse> => {
  try {
    return await fetchClient<InvitationMessageResponse>(INVITATION_ENDPOINTS.CREATE, {
      method: 'POST',
      body: {
        email: data.email,
        organization_id: data.organization_id,
        role: data.role,
      }
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invitation'
    };
  }
};

/**
 * List all invitations for an organization
 * @param organizationId Organization ID
 * @returns Promise with list of invitations
 */
export const listOrganizationInvitations = async (organizationId: number): Promise<Invitation[]> => {
  try {
    const response = await fetchClient<Invitation[]>(
      INVITATION_ENDPOINTS.LIST_BY_ORGANIZATION(organizationId),
      { method: 'GET' }
    );
    
    return response;
  } catch (error) {
    console.error('Error fetching organization invitations:', error);
    return [];
  }
};

/**
 * List all pending invitations for the current user
 * @returns Promise with list of invitations
 */
export const listMyInvitations = async (): Promise<Invitation[]> => {
  try {
    const response = await fetchClient<Invitation[]>(
      INVITATION_ENDPOINTS.LIST_MY_INVITATIONS,
      { method: 'GET' }
    );
    
    return response;
  } catch (error) {
    console.error('Error fetching user invitations:', error);
    return [];
  }
};

/**
 * Accept an invitation
 * @param invitationId Invitation ID
 * @returns Promise with success message
 */
export const acceptInvitation = async (invitationId: number): Promise<InvitationMessageResponse> => {
  try {
    return await fetchClient<InvitationMessageResponse>(
      INVITATION_ENDPOINTS.ACCEPT(invitationId),
      {
        method: 'POST',
        body: {}
      }
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to accept invitation with ID ${invitationId}`
    };
  }
};

/**
 * Reject an invitation
 * @param invitationId Invitation ID
 * @returns Promise with success message
 */
export const rejectInvitation = async (invitationId: number): Promise<InvitationMessageResponse> => {
  try {
    return await fetchClient<InvitationMessageResponse>(
      INVITATION_ENDPOINTS.REJECT(invitationId),
      {
        method: 'POST',
        body: {}
      }
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to reject invitation with ID ${invitationId}`
    };
  }
};

/**
 * Cancel an invitation
 * @param invitationId Invitation ID
 * @returns Promise with success message
 */
export const cancelInvitation = async (invitationId: number): Promise<InvitationMessageResponse> => {
  try {
    return await fetchClient<InvitationMessageResponse>(
      INVITATION_ENDPOINTS.CANCEL(invitationId),
      { method: 'DELETE' }
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to cancel invitation with ID ${invitationId}`
    };
  }
};
