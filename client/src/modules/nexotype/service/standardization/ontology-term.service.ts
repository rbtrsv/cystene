'use client';

import {
  OntologyTermResponse,
  OntologyTermsResponse,
  CreateOntologyTerm,
  UpdateOntologyTerm,
  CreateOntologyTermSchema,
  UpdateOntologyTermSchema,
} from '../../schemas/standardization/ontology-term.schemas';
import { ONTOLOGY_TERM_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing ontology terms
 */
export interface ListOntologyTermsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all ontology terms
 * @param params Optional query parameters for pagination
 * @returns Promise with ontology terms response
 */
export const getOntologyTerms = async (params?: ListOntologyTermsParams): Promise<OntologyTermsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${ONTOLOGY_TERM_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<OntologyTermsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch ontology terms',
      data: []
    };
  }
};

/**
 * Fetch a specific ontology term by ID
 * @param id Ontology term ID
 * @returns Promise with ontology term response
 */
export const getOntologyTerm = async (id: number): Promise<OntologyTermResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<OntologyTermResponse>(ONTOLOGY_TERM_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch ontology term with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new ontology term
 * @param data Ontology term creation data
 * @returns Promise with ontology term response
 */
export const createOntologyTerm = async (data: CreateOntologyTerm): Promise<OntologyTermResponse> => {
  // Validate request data
  CreateOntologyTermSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<OntologyTermResponse>(ONTOLOGY_TERM_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create ontology term',
      data: undefined
    };
  }
};

/**
 * Update an existing ontology term
 * @param id Ontology term ID
 * @param data Ontology term update data
 * @returns Promise with ontology term response
 */
export const updateOntologyTerm = async (id: number, data: UpdateOntologyTerm): Promise<OntologyTermResponse> => {
  // Validate request data
  UpdateOntologyTermSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<OntologyTermResponse>(ONTOLOGY_TERM_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update ontology term with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete an ontology term
 * @param id Ontology term ID
 * @returns Promise with success response
 */
export const deleteOntologyTerm = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      ONTOLOGY_TERM_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete ontology term with ID ${id}`
    };
  }
};
