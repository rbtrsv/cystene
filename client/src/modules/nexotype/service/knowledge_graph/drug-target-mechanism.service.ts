'use client';

import {
  DrugTargetMechanismResponse,
  DrugTargetMechanismsResponse,
  CreateDrugTargetMechanism,
  UpdateDrugTargetMechanism,
  CreateDrugTargetMechanismSchema,
  UpdateDrugTargetMechanismSchema,
} from '../../schemas/knowledge_graph/drug-target-mechanism.schemas';
import { DRUG_TARGET_MECHANISM_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing drug target mechanisms
 */
export interface ListDrugTargetMechanismsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all drug target mechanisms
 * @param params Optional query parameters for pagination
 * @returns Promise with drug target mechanisms response
 */
export const getDrugTargetMechanisms = async (params?: ListDrugTargetMechanismsParams): Promise<DrugTargetMechanismsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${DRUG_TARGET_MECHANISM_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<DrugTargetMechanismsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch drug target mechanisms',
      data: []
    };
  }
};

/**
 * Fetch a specific drug target mechanism by ID
 * @param id DrugTargetMechanism ID
 * @returns Promise with drug target mechanism response
 */
export const getDrugTargetMechanism = async (id: number): Promise<DrugTargetMechanismResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DrugTargetMechanismResponse>(DRUG_TARGET_MECHANISM_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch drug target mechanism with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new drug target mechanism
 * @param data DrugTargetMechanism creation data
 * @returns Promise with drug target mechanism response
 */
export const createDrugTargetMechanism = async (data: CreateDrugTargetMechanism): Promise<DrugTargetMechanismResponse> => {
  // Validate request data
  CreateDrugTargetMechanismSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DrugTargetMechanismResponse>(DRUG_TARGET_MECHANISM_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create drug target mechanism',
      data: undefined
    };
  }
};

/**
 * Update an existing drug target mechanism
 * @param id DrugTargetMechanism ID
 * @param data DrugTargetMechanism update data
 * @returns Promise with drug target mechanism response
 */
export const updateDrugTargetMechanism = async (id: number, data: UpdateDrugTargetMechanism): Promise<DrugTargetMechanismResponse> => {
  // Validate request data
  UpdateDrugTargetMechanismSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DrugTargetMechanismResponse>(DRUG_TARGET_MECHANISM_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update drug target mechanism with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a drug target mechanism
 * @param id DrugTargetMechanism ID
 * @returns Promise with success response
 */
export const deleteDrugTargetMechanism = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      DRUG_TARGET_MECHANISM_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete drug target mechanism with ID ${id}`
    };
  }
};
