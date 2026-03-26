'use client';

import {
  MarketOrganizationResponse,
  MarketOrganizationsResponse,
  CreateMarketOrganization,
  UpdateMarketOrganization,
  CreateMarketOrganizationSchema,
  UpdateMarketOrganizationSchema,
} from '../../schemas/commercial/market-organization.schemas';
import { MARKET_ORGANIZATION_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing market organizations
 */
export interface ListMarketOrganizationsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all market organizations
 * @param params Optional query parameters for pagination
 * @returns Promise with market organizations response
 */
export const getMarketOrganizations = async (params?: ListMarketOrganizationsParams): Promise<MarketOrganizationsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${MARKET_ORGANIZATION_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<MarketOrganizationsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch market organizations',
      data: []
    };
  }
};

/**
 * Fetch a specific market organization by ID
 * @param id Market organization ID
 * @returns Promise with market organization response
 */
export const getMarketOrganization = async (id: number): Promise<MarketOrganizationResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<MarketOrganizationResponse>(MARKET_ORGANIZATION_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch market organization with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new market organization
 * @param data Market organization creation data
 * @returns Promise with market organization response
 */
export const createMarketOrganization = async (data: CreateMarketOrganization): Promise<MarketOrganizationResponse> => {
  // Validate request data
  CreateMarketOrganizationSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<MarketOrganizationResponse>(MARKET_ORGANIZATION_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create market organization',
      data: undefined
    };
  }
};

/**
 * Update an existing market organization
 * @param id Market organization ID
 * @param data Market organization update data
 * @returns Promise with market organization response
 */
export const updateMarketOrganization = async (id: number, data: UpdateMarketOrganization): Promise<MarketOrganizationResponse> => {
  // Validate request data
  UpdateMarketOrganizationSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<MarketOrganizationResponse>(MARKET_ORGANIZATION_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update market organization with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a market organization
 * @param id Market organization ID
 * @returns Promise with success response
 */
export const deleteMarketOrganization = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      MARKET_ORGANIZATION_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete market organization with ID ${id}`
    };
  }
};
