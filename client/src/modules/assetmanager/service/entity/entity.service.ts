'use client';

import {
  EntityResponse,
  EntitiesResponse,
  CreateEntity,
  UpdateEntity,
  CreateEntitySchema,
  UpdateEntitySchema,
  EntityType,
} from '../../schemas/entity/entity.schemas';
import { ENTITY_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing entities
 */
export interface ListEntitiesParams {
  entity_type?: EntityType;
  organization_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all entities user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with entities response
 */
export const getEntities = async (params?: ListEntitiesParams): Promise<EntitiesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_type) queryParams.append('entity_type', params.entity_type);
    if (params?.organization_id) queryParams.append('organization_id', params.organization_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${ENTITY_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntitiesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch entities',
      data: []
    };
  }
};

/**
 * Fetch a specific entity by ID
 * @param id Entity ID
 * @returns Promise with entity response
 */
export const getEntity = async (id: number): Promise<EntityResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityResponse>(ENTITY_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch entity with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new entity
 * @param data Entity creation data
 * @returns Promise with entity response
 */
export const createEntity = async (data: CreateEntity): Promise<EntityResponse> => {
  // Validate request data
  CreateEntitySchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityResponse>(ENTITY_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create entity',
      data: undefined
    };
  }
};

/**
 * Update an existing entity
 * @param id Entity ID
 * @param data Entity update data
 * @returns Promise with entity response
 */
export const updateEntity = async (id: number, data: UpdateEntity): Promise<EntityResponse> => {
  // Validate request data
  UpdateEntitySchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityResponse>(ENTITY_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update entity with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete an entity
 * @param id Entity ID
 * @returns Promise with success response
 */
export const deleteEntity = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      ENTITY_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete entity with ID ${id}`
    };
  }
};
