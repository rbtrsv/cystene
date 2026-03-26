'use client';

import { 
  Organization,
  OrganizationResponse,
  OrganizationsResponse,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  OrganizationRole
} from '../schemas/organizations.schema';
import { MessageResponse } from '../schemas/shared.schemas';
import { ORGANIZATION_ENDPOINTS, MEMBER_ENDPOINTS } from '../utils/api.endpoints';
import { fetchClient } from '../utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Fetch all organizations user has access to
 * @returns Promise with organizations response
 */
export const getOrganizations = async (): Promise<OrganizationsResponse> => {
  try {
    // Django Ninja returns array directly
    const organizations = await fetchClient<Organization[]>(ORGANIZATION_ENDPOINTS.LIST, {
      method: 'GET'
    });
    
    return {
      success: true,
      data: organizations,
      error: undefined
    };
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../utils/token.client.utils');
      clearAuthCookies();
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch organizations',
      data: []
    };
  }
};

/**
 * Fetch a specific organization by ID
 * @param id Organization ID
 * @returns Promise with organization response
 */
export const getOrganization = async (id: number): Promise<OrganizationResponse> => {
  try {
    // Django Ninja returns organization object directly
    const organization = await fetchClient<Organization>(ORGANIZATION_ENDPOINTS.DETAIL(id), {
      method: 'GET'
    });
    
    return {
      success: true,
      data: organization,
      error: undefined
    };
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../utils/token.client.utils');
      clearAuthCookies();
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch organization with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new organization
 * @param data Organization creation data
 * @returns Promise with organization response
 */
export const createOrganization = async (data: CreateOrganizationInput): Promise<OrganizationResponse> => {
  // Validate request data
  CreateOrganizationSchema.parse(data);

  try {
    // Django Ninja returns organization object directly
    const organization = await fetchClient<Organization>(ORGANIZATION_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data
    });
    
    return {
      success: true,
      data: organization,
      error: undefined
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create organization',
      data: undefined
    };
  }
};

/**
 * Update an existing organization
 * @param id Organization ID
 * @param data Organization update data
 * @returns Promise with organization response
 */
export const updateOrganization = async (id: number, data: UpdateOrganizationInput): Promise<OrganizationResponse> => {
  // Validate request data
  UpdateOrganizationSchema.parse(data);

  try {
    // Django Ninja returns organization object directly
    const organization = await fetchClient<Organization>(ORGANIZATION_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data
    });
    
    return {
      success: true,
      data: organization,
      error: undefined
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update organization with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete an organization
 * @param id Organization ID
 * @returns Promise with message response
 */
export const deleteOrganization = async (id: number): Promise<MessageResponse> => {
  try {
    // Django Ninja returns {success: bool, message?: string}
    const response = await fetchClient<{success: boolean; message?: string}>(ORGANIZATION_ENDPOINTS.DELETE(id), {
      method: 'DELETE'
    });
    
    // Map to frontend MessageResponse schema which has both message and error fields
    return {
      success: response.success,
      message: response.message,
      error: response.success ? undefined : response.message
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete organization with ID ${id}`
    };
  }
};

/**
 * Get the user's role in an organization
 * @param id Organization ID
 * @returns Promise with role response
 */
export const getOrganizationRole = async (id: number): Promise<{ success: boolean; role?: OrganizationRole; error?: string }> => {
  try {
    return await fetchClient<{ success: boolean; role?: OrganizationRole; error?: string }>(
      ORGANIZATION_ENDPOINTS.ROLE(id), 
      { method: 'GET' }
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to get role for organization with ID ${id}`
    };
  }
};

/**
 * Get organization members
 * @param organizationId Organization ID
 * @returns Promise with members response
 */
export const getOrganizationMembers = async (organizationId: number) => {
  try {
    return await fetchClient(MEMBER_ENDPOINTS.LIST(organizationId), {
      method: 'GET'
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch members for organization with ID ${organizationId}`,
      data: []
    };
  }
};

/**
 * Add member to organization (invite)
 * @param organizationId Organization ID
 * @param email Email of the user to invite
 * @param role Role to assign
 * @returns Promise with message response
 */
export const addOrganizationMember = async (
  organizationId: number,
  email: string,
  role: OrganizationRole
): Promise<MessageResponse> => {
  try {
    return await fetchClient<MessageResponse>(MEMBER_ENDPOINTS.ADD(organizationId), {
      method: 'POST',
      body: { email, role }
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to add member to organization with ID ${organizationId}`
    };
  }
};

/**
 * Update organization member role
 * @param organizationId Organization ID
 * @param memberId Member ID
 * @param role New role to assign
 * @returns Promise with message response
 */
export const updateOrganizationMemberRole = async (
  organizationId: number,
  memberId: number,
  role: OrganizationRole
): Promise<MessageResponse> => {
  try {
    return await fetchClient<MessageResponse>(MEMBER_ENDPOINTS.UPDATE(organizationId, memberId), {
      method: 'PUT',
      body: { role }
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update member role in organization with ID ${organizationId}`
    };
  }
};

/**
 * Remove member from organization
 * @param organizationId Organization ID
 * @param memberId Member ID
 * @returns Promise with message response
 */
export const removeOrganizationMember = async (
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
      error: error instanceof Error ? error.message : `Failed to remove member from organization with ID ${organizationId}`
    };
  }
};
