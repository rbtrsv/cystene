'use client';

import {
  Connection,
  ConnectionResponse,
  ConnectionsResponse,
  ConnectionTestResponse,
  CreateConnection,
  CreateConnectionSchema,
  UpdateConnection,
  UpdateConnectionSchema,
} from '../schemas/ecommerce-connections.schemas';
import { CONNECTION_ENDPOINTS, SHOPIFY_OAUTH_ENDPOINTS, WOOCOMMERCE_AUTH_ENDPOINTS } from '../utils/api.endpoints';
import { fetchClient } from '@/modules/accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Fetch all connections for the current user
 * @returns Promise with connections response
 */
export const getConnections = async (): Promise<ConnectionsResponse> => {
  try {
    // Backend returns { success, data, count, error }
    const response = await fetchClient<{ success: boolean; data: Connection[]; count: number; error?: string }>(
      CONNECTION_ENDPOINTS.LIST,
      { method: 'GET' }
    );

    return {
      success: response.success,
      data: response.data,
      count: response.count,
      error: response.error,
    };
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('@/modules/accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch connections',
      data: [],
    };
  }
};

/**
 * Fetch a specific connection by ID
 * @param id Connection ID
 * @returns Promise with connection response
 */
export const getConnection = async (id: number): Promise<ConnectionResponse> => {
  try {
    // Backend returns { success, data, error }
    const response = await fetchClient<{ success: boolean; data: Connection; error?: string }>(
      CONNECTION_ENDPOINTS.DETAIL(id),
      { method: 'GET' }
    );

    return {
      success: response.success,
      data: response.data,
      error: response.error,
    };
  } catch (error) {
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('@/modules/accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch connection with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Create a new connection
 * @param data Connection creation data
 * @returns Promise with connection response
 */
export const createConnection = async (data: CreateConnection): Promise<ConnectionResponse> => {
  // Validate request data
  CreateConnectionSchema.parse(data);

  try {
    const response = await fetchClient<{ success: boolean; data: Connection; error?: string }>(
      CONNECTION_ENDPOINTS.CREATE,
      { method: 'POST', body: data as unknown as Record<string, unknown> }
    );

    return {
      success: response.success,
      data: response.data,
      error: response.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create connection',
      data: undefined,
    };
  }
};

/**
 * Update an existing connection
 * @param id Connection ID
 * @param data Connection update data
 * @returns Promise with connection response
 */
export const updateConnection = async (id: number, data: UpdateConnection): Promise<ConnectionResponse> => {
  // Validate request data
  UpdateConnectionSchema.parse(data);

  try {
    const response = await fetchClient<{ success: boolean; data: Connection; error?: string }>(
      CONNECTION_ENDPOINTS.UPDATE(id),
      { method: 'PUT', body: data as unknown as Record<string, unknown> }
    );

    return {
      success: response.success,
      data: response.data,
      error: response.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update connection with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Delete a connection
 * @param id Connection ID
 * @returns Promise with message response
 */
export const deleteConnection = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      CONNECTION_ENDPOINTS.DELETE(id),
      { method: 'DELETE' }
    );

    return {
      success: response.success,
      message: response.message,
      error: response.success ? undefined : response.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete connection with ID ${id}`,
    };
  }
};

/**
 * Test a connection's connectivity
 * @param id Connection ID
 * @returns Promise with test response
 */
export const testConnection = async (id: number): Promise<ConnectionTestResponse> => {
  try {
    const response = await fetchClient<ConnectionTestResponse>(
      CONNECTION_ENDPOINTS.TEST(id),
      { method: 'POST' }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : `Failed to test connection with ID ${id}`,
    };
  }
};

/**
 * Initiate Shopify OAuth flow
 * @param shop Shopify store domain (e.g., "mystore.myshopify.com")
 * @returns Promise with auth URL to redirect the merchant
 */
export const initiateShopifyOAuth = async (shop: string): Promise<{ success: boolean; auth_url?: string; error?: string }> => {
  try {
    const response = await fetchClient<{ auth_url: string }>(
      SHOPIFY_OAUTH_ENDPOINTS.AUTH(shop),
      { method: 'GET' }
    );

    return {
      success: true,
      auth_url: response.auth_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate Shopify OAuth',
    };
  }
};

/**
 * Initiate WooCommerce auto-auth flow
 * @param storeUrl WooCommerce store URL (e.g., "https://mystore.com")
 * @returns Promise with auth URL to redirect the merchant
 */
export const initiateWooCommerceAuth = async (storeUrl: string): Promise<{ success: boolean; auth_url?: string; error?: string }> => {
  try {
    const response = await fetchClient<{ auth_url: string }>(
      WOOCOMMERCE_AUTH_ENDPOINTS.AUTH(storeUrl),
      { method: 'GET' }
    );

    return {
      success: true,
      auth_url: response.auth_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate WooCommerce auth',
    };
  }
};
