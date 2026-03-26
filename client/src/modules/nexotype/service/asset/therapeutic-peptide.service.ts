'use client';

import {
  TherapeuticPeptideResponse,
  TherapeuticPeptidesResponse,
  CreateTherapeuticPeptide,
  UpdateTherapeuticPeptide,
  CreateTherapeuticPeptideSchema,
  UpdateTherapeuticPeptideSchema,
} from '../../schemas/asset/therapeutic-peptide.schemas';
import { THERAPEUTIC_PEPTIDE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing therapeutic peptides
 */
export interface ListTherapeuticPeptidesParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all therapeutic peptides
 * @param params Optional query parameters for pagination
 * @returns Promise with therapeutic peptides response
 */
export const getTherapeuticPeptides = async (params?: ListTherapeuticPeptidesParams): Promise<TherapeuticPeptidesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${THERAPEUTIC_PEPTIDE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<TherapeuticPeptidesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch therapeutic peptides',
      data: []
    };
  }
};

/**
 * Fetch a specific therapeutic peptide by ID
 * @param id Therapeutic peptide ID
 * @returns Promise with therapeutic peptide response
 */
export const getTherapeuticPeptide = async (id: number): Promise<TherapeuticPeptideResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TherapeuticPeptideResponse>(THERAPEUTIC_PEPTIDE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch therapeutic peptide with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new therapeutic peptide
 * @param data Therapeutic peptide creation data
 * @returns Promise with therapeutic peptide response
 */
export const createTherapeuticPeptide = async (data: CreateTherapeuticPeptide): Promise<TherapeuticPeptideResponse> => {
  // Validate request data
  CreateTherapeuticPeptideSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TherapeuticPeptideResponse>(THERAPEUTIC_PEPTIDE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create therapeutic peptide',
      data: undefined
    };
  }
};

/**
 * Update an existing therapeutic peptide
 * @param id Therapeutic peptide ID
 * @param data Therapeutic peptide update data
 * @returns Promise with therapeutic peptide response
 */
export const updateTherapeuticPeptide = async (id: number, data: UpdateTherapeuticPeptide): Promise<TherapeuticPeptideResponse> => {
  // Validate request data
  UpdateTherapeuticPeptideSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TherapeuticPeptideResponse>(THERAPEUTIC_PEPTIDE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update therapeutic peptide with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a therapeutic peptide
 * @param id Therapeutic peptide ID
 * @returns Promise with success response
 */
export const deleteTherapeuticPeptide = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      THERAPEUTIC_PEPTIDE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete therapeutic peptide with ID ${id}`
    };
  }
};
