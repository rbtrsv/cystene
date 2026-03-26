'use client';

import { MEMBER_ENDPOINTS } from '../utils/api.endpoints';
import { fetchClient } from '../utils/fetch.client';
import { 
  MemberDetail, 
  MemberCreate, 
  MemberUpdate,
  MessageResponse
} from '../schemas/organization-members.schema';

/**
 * List all members of an organization
 * @param organizationId Organization ID
 * @returns Promise with list of members
 */
export const listMembers = async (organizationId: number): Promise<MemberDetail[]> => {
  try {
    const response = await fetchClient<MemberDetail[]>(MEMBER_ENDPOINTS.LIST(organizationId), {
      method: 'GET'
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching members:', error);
    return [];
  }
};

/**
 * Get a specific member of an organization
 * @param organizationId Organization ID
 * @param memberId Member ID
 * @returns Promise with member details
 */
export const getMember = async (organizationId: number, memberId: number): Promise<MemberDetail | null> => {
  try {
    const response = await fetchClient<MemberDetail>(MEMBER_ENDPOINTS.DETAIL(organizationId, memberId), {
      method: 'GET'
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching member:', error);
    return null;
  }
};

/**
 * Add a new member to an organization
 * @param organizationId Organization ID
 * @param data Member creation data
 * @returns Promise with created member details
 */
export const addMember = async (
  organizationId: number,
  data: MemberCreate
): Promise<MemberDetail | null> => {
  try {
    const response = await fetchClient<MemberDetail>(MEMBER_ENDPOINTS.ADD(organizationId), {
      method: 'POST',
      body: data
    });
    
    return response;
  } catch (error) {
    console.error('Error adding member:', error);
    return null;
  }
};

/**
 * Update a member's role in an organization
 * @param organizationId Organization ID
 * @param memberId Member ID
 * @param data Member update data
 * @returns Promise with updated member details
 */
export const updateMember = async (
  organizationId: number,
  memberId: number,
  data: MemberUpdate
): Promise<MemberDetail | null> => {
  try {
    const response = await fetchClient<MemberDetail>(MEMBER_ENDPOINTS.UPDATE(organizationId, memberId), {
      method: 'PUT',
      body: data
    });
    
    return response;
  } catch (error) {
    console.error('Error updating member:', error);
    return null;
  }
};

/**
 * Remove a member from an organization
 * @param organizationId Organization ID
 * @param memberId Member ID
 * @returns Promise with success message
 */
export const removeMember = async (
  organizationId: number,
  memberId: number
): Promise<MessageResponse> => {
  try {
    return await fetchClient<MessageResponse>(MEMBER_ENDPOINTS.REMOVE(organizationId, memberId), {
      method: 'DELETE'
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to remove member from organization`
    };
  }
};
