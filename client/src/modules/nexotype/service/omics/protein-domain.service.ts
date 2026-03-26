'use client';

import {
  ProteinDomainResponse,
  ProteinDomainsResponse,
  CreateProteinDomain,
  UpdateProteinDomain,
  CreateProteinDomainSchema,
  UpdateProteinDomainSchema,
} from '../../schemas/omics/protein-domain.schemas';
import { PROTEIN_DOMAIN_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing protein domains
 */
export interface ListProteinDomainsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all protein domains
 * @param params Optional query parameters for pagination
 * @returns Promise with protein domains response
 */
export const getProteinDomains = async (params?: ListProteinDomainsParams): Promise<ProteinDomainsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${PROTEIN_DOMAIN_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<ProteinDomainsResponse>(url, {
      method: 'GET'
    });

    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch protein domains',
      data: []
    };
  }
};

/**
 * Fetch a specific protein domain by ID
 * @param id Protein domain ID
 * @returns Promise with protein domain response
 */
export const getProteinDomain = async (id: number): Promise<ProteinDomainResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ProteinDomainResponse>(PROTEIN_DOMAIN_ENDPOINTS.DETAIL(id), {
      method: 'GET'
    });

    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch protein domain with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new protein domain
 * @param data Protein domain creation data
 * @returns Promise with protein domain response
 */
export const createProteinDomain = async (data: CreateProteinDomain): Promise<ProteinDomainResponse> => {
  // Validate request data
  CreateProteinDomainSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ProteinDomainResponse>(PROTEIN_DOMAIN_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create protein domain',
      data: undefined
    };
  }
};

/**
 * Update an existing protein domain
 * @param id Protein domain ID
 * @param data Protein domain update data
 * @returns Promise with protein domain response
 */
export const updateProteinDomain = async (id: number, data: UpdateProteinDomain): Promise<ProteinDomainResponse> => {
  // Validate request data
  UpdateProteinDomainSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ProteinDomainResponse>(PROTEIN_DOMAIN_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update protein domain with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a protein domain
 * @param id Protein domain ID
 * @returns Promise with success response
 */
export const deleteProteinDomain = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      PROTEIN_DOMAIN_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete protein domain with ID ${id}`
    };
  }
};
