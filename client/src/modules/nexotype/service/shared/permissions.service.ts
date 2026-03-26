'use client';

import { PermissionsResponse } from '../../schemas/shared/permissions.schemas';
import { PERMISSIONS_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Fetch the authenticated user's access permissions
 * @returns Promise with permissions response
 */
export const getPermissions = async (): Promise<PermissionsResponse> => {
  try {
    // Backend returns { success, data: { tier, domains, entities }, error }
    const response = await fetchClient<PermissionsResponse>(PERMISSIONS_ENDPOINTS.GET, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch permissions',
      data: undefined
    };
  }
};
