'use client';

import {
  BiomarkerAssociationResponse,
  BiomarkerAssociationsResponse,
  CreateBiomarkerAssociation,
  UpdateBiomarkerAssociation,
  CreateBiomarkerAssociationSchema,
  UpdateBiomarkerAssociationSchema,
} from '../../schemas/knowledge_graph/biomarker-association.schemas';
import { BIOMARKER_ASSOCIATION_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing biomarker associations
 */
export interface ListBiomarkerAssociationsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all biomarker associations
 * @param params Optional query parameters for pagination
 * @returns Promise with biomarker associations response
 */
export const getBiomarkerAssociations = async (params?: ListBiomarkerAssociationsParams): Promise<BiomarkerAssociationsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${BIOMARKER_ASSOCIATION_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<BiomarkerAssociationsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch biomarker associations',
      data: []
    };
  }
};

/**
 * Fetch a specific biomarker association by ID
 * @param id BiomarkerAssociation ID
 * @returns Promise with biomarker association response
 */
export const getBiomarkerAssociation = async (id: number): Promise<BiomarkerAssociationResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BiomarkerAssociationResponse>(BIOMARKER_ASSOCIATION_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch biomarker association with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new biomarker association
 * @param data BiomarkerAssociation creation data
 * @returns Promise with biomarker association response
 */
export const createBiomarkerAssociation = async (data: CreateBiomarkerAssociation): Promise<BiomarkerAssociationResponse> => {
  // Validate request data
  CreateBiomarkerAssociationSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BiomarkerAssociationResponse>(BIOMARKER_ASSOCIATION_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create biomarker association',
      data: undefined
    };
  }
};

/**
 * Update an existing biomarker association
 * @param id BiomarkerAssociation ID
 * @param data BiomarkerAssociation update data
 * @returns Promise with biomarker association response
 */
export const updateBiomarkerAssociation = async (id: number, data: UpdateBiomarkerAssociation): Promise<BiomarkerAssociationResponse> => {
  // Validate request data
  UpdateBiomarkerAssociationSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BiomarkerAssociationResponse>(BIOMARKER_ASSOCIATION_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update biomarker association with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a biomarker association
 * @param id BiomarkerAssociation ID
 * @returns Promise with success response
 */
export const deleteBiomarkerAssociation = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      BIOMARKER_ASSOCIATION_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete biomarker association with ID ${id}`
    };
  }
};
