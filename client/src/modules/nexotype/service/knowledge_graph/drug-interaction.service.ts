'use client';

import {
  DrugInteractionResponse,
  DrugInteractionsResponse,
  CreateDrugInteraction,
  UpdateDrugInteraction,
  CreateDrugInteractionSchema,
  UpdateDrugInteractionSchema,
} from '../../schemas/knowledge_graph/drug-interaction.schemas';
import { DRUG_INTERACTION_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing drug interactions
 */
export interface ListDrugInteractionsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all drug interactions
 * @param params Optional query parameters for pagination
 * @returns Promise with drug interactions response
 */
export const getDrugInteractions = async (params?: ListDrugInteractionsParams): Promise<DrugInteractionsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${DRUG_INTERACTION_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<DrugInteractionsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch drug interactions',
      data: []
    };
  }
};

/**
 * Fetch a specific drug interaction by ID
 * @param id DrugInteraction ID
 * @returns Promise with drug interaction response
 */
export const getDrugInteraction = async (id: number): Promise<DrugInteractionResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DrugInteractionResponse>(DRUG_INTERACTION_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch drug interaction with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new drug interaction
 * @param data DrugInteraction creation data
 * @returns Promise with drug interaction response
 */
export const createDrugInteraction = async (data: CreateDrugInteraction): Promise<DrugInteractionResponse> => {
  // Validate request data
  CreateDrugInteractionSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DrugInteractionResponse>(DRUG_INTERACTION_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create drug interaction',
      data: undefined
    };
  }
};

/**
 * Update an existing drug interaction
 * @param id DrugInteraction ID
 * @param data DrugInteraction update data
 * @returns Promise with drug interaction response
 */
export const updateDrugInteraction = async (id: number, data: UpdateDrugInteraction): Promise<DrugInteractionResponse> => {
  // Validate request data
  UpdateDrugInteractionSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DrugInteractionResponse>(DRUG_INTERACTION_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update drug interaction with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a drug interaction
 * @param id DrugInteraction ID
 * @returns Promise with success response
 */
export const deleteDrugInteraction = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      DRUG_INTERACTION_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete drug interaction with ID ${id}`
    };
  }
};
