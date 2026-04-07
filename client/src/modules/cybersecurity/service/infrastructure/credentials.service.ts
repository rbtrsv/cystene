'use client';

/**
 * Credential Service
 *
 * CRUD operations for Credential model.
 * SECURITY: encrypted_value is sent in Create/Update but NEVER returned in responses.
 *
 * Backend: /server/apps/cybersecurity/subrouters/infrastructure_subrouters/credential_subrouter.py
 */

import {
  CredentialResponse,
  CredentialsResponse,
  CreateCredential,
  UpdateCredential,
  CreateCredentialSchema,
  UpdateCredentialSchema,
  CredentialType,
} from '../../schemas/infrastructure/credentials.schemas';
import { CREDENTIAL_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing credentials
 */
export interface ListCredentialsParams {
  cred_type?: CredentialType;
  infrastructure_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all credentials user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with credentials response
 */
export const getCredentials = async (params?: ListCredentialsParams): Promise<CredentialsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.cred_type) queryParams.append('cred_type', params.cred_type);
    if (params?.infrastructure_id) queryParams.append('infrastructure_id', params.infrastructure_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${CREDENTIAL_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetchClient<CredentialsResponse>(url, {
      method: 'GET'
    });

    return response;
  } catch (error) {
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch credentials',
      data: []
    };
  }
};

/**
 * Fetch a specific credential by ID
 * @param id Credential ID
 * @returns Promise with credential response
 */
export const getCredential = async (id: number): Promise<CredentialResponse> => {
  try {
    const response = await fetchClient<CredentialResponse>(CREDENTIAL_ENDPOINTS.DETAIL(id), {
      method: 'GET'
    });

    return response;
  } catch (error) {
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch credential with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new credential
 * @param data Credential creation data (encrypted_value will be encrypted server-side)
 * @returns Promise with credential response
 */
export const createCredential = async (data: CreateCredential): Promise<CredentialResponse> => {
  CreateCredentialSchema.parse(data);

  try {
    const response = await fetchClient<CredentialResponse>(CREDENTIAL_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create credential',
      data: undefined
    };
  }
};

/**
 * Update an existing credential
 * @param id Credential ID
 * @param data Credential update data (omit encrypted_value to keep existing secret)
 * @returns Promise with credential response
 */
export const updateCredential = async (id: number, data: UpdateCredential): Promise<CredentialResponse> => {
  UpdateCredentialSchema.parse(data);

  try {
    const response = await fetchClient<CredentialResponse>(CREDENTIAL_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update credential with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a credential (soft delete)
 * @param id Credential ID
 * @returns Promise with success response
 */
export const deleteCredential = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      CREDENTIAL_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete credential with ID ${id}`
    };
  }
};
