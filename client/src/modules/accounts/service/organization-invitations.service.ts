'use client';

import { INVITATION_ENDPOINTS } from '../utils/api.endpoints';
import { fetchClient } from '../utils/fetch.client';
import {
  InvitationDetail,
  InvitationCreate,
  InvitationMessageResponse
} from '../schemas/organization-invitations.schema';

/**
 * Create a new invitation
 * @param data Invitation creation data
 * @returns Promise with success message
 */
export const createInvitation = async (
  data: InvitationCreate
): Promise<InvitationMessageResponse> => {
  try {
    return await fetchClient<InvitationMessageResponse>(INVITATION_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data
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
export const listInvitationsByOrganization = async (
  organizationId: number
): Promise<InvitationDetail[]> => {
  try {
    const response = await fetchClient<InvitationDetail[]>(
      INVITATION_ENDPOINTS.LIST_BY_ORGANIZATION(organizationId),
      {
        method: 'GET'
      }
    );

    return response;
  } catch (error) {
    console.error('Error fetching organization invitations:', error);
    return [];
  }
};

/**
 * List all invitations for the current user
 * @returns Promise with list of invitations
 */
export const listMyInvitations = async (): Promise<InvitationDetail[]> => {
  try {
    const response = await fetchClient<InvitationDetail[]>(
      INVITATION_ENDPOINTS.LIST_MY_INVITATIONS,
      {
        method: 'GET'
      }
    );

    return response;
  } catch (error) {
    console.error('Error fetching my invitations:', error);
    return [];
  }
};

/**
 * Accept an invitation
 * @param invitationId Invitation ID
 * @returns Promise with success message
 */
export const acceptInvitation = async (
  invitationId: number
): Promise<InvitationMessageResponse> => {
  try {
    return await fetchClient<InvitationMessageResponse>(
      INVITATION_ENDPOINTS.ACCEPT(invitationId),
      {
        method: 'POST'
      }
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept invitation'
    };
  }
};

/**
 * Reject an invitation
 * @param invitationId Invitation ID
 * @returns Promise with success message
 */
export const rejectInvitation = async (
  invitationId: number
): Promise<InvitationMessageResponse> => {
  try {
    return await fetchClient<InvitationMessageResponse>(
      INVITATION_ENDPOINTS.REJECT(invitationId),
      {
        method: 'POST'
      }
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject invitation'
    };
  }
};

/**
 * Cancel an invitation
 * @param invitationId Invitation ID
 * @returns Promise with success message
 */
export const cancelInvitation = async (
  invitationId: number
): Promise<InvitationMessageResponse> => {
  try {
    return await fetchClient<InvitationMessageResponse>(
      INVITATION_ENDPOINTS.CANCEL(invitationId),
      {
        method: 'DELETE'
      }
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel invitation'
    };
  }
};
