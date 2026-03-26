'use client';

import {
  LicensingAgreementResponse,
  LicensingAgreementsResponse,
  CreateLicensingAgreement,
  UpdateLicensingAgreement,
  CreateLicensingAgreementSchema,
  UpdateLicensingAgreementSchema,
} from '../../schemas/commercial/licensing-agreement.schemas';
import { LICENSING_AGREEMENT_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing licensing agreements
 */
export interface ListLicensingAgreementsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all licensing agreements
 * @param params Optional query parameters for pagination
 * @returns Promise with licensing agreements response
 */
export const getLicensingAgreements = async (params?: ListLicensingAgreementsParams): Promise<LicensingAgreementsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${LICENSING_AGREEMENT_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<LicensingAgreementsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch licensing agreements',
      data: []
    };
  }
};

/**
 * Fetch a specific licensing agreement by ID
 * @param id LicensingAgreement ID
 * @returns Promise with licensing agreement response
 */
export const getLicensingAgreement = async (id: number): Promise<LicensingAgreementResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<LicensingAgreementResponse>(LICENSING_AGREEMENT_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch licensing agreement with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new licensing agreement
 * @param data LicensingAgreement creation data
 * @returns Promise with licensing agreement response
 */
export const createLicensingAgreement = async (data: CreateLicensingAgreement): Promise<LicensingAgreementResponse> => {
  // Validate request data
  CreateLicensingAgreementSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<LicensingAgreementResponse>(LICENSING_AGREEMENT_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create licensing agreement',
      data: undefined
    };
  }
};

/**
 * Update an existing licensing agreement
 * @param id LicensingAgreement ID
 * @param data LicensingAgreement update data
 * @returns Promise with licensing agreement response
 */
export const updateLicensingAgreement = async (id: number, data: UpdateLicensingAgreement): Promise<LicensingAgreementResponse> => {
  // Validate request data
  UpdateLicensingAgreementSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<LicensingAgreementResponse>(LICENSING_AGREEMENT_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update licensing agreement with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a licensing agreement
 * @param id LicensingAgreement ID
 * @returns Promise with success response
 */
export const deleteLicensingAgreement = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      LICENSING_AGREEMENT_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete licensing agreement with ID ${id}`
    };
  }
};
