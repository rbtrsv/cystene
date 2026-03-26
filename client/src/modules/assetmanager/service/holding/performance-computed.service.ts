'use client';

/**
 * Performance Computed Service
 *
 * Read-only service for computed performance endpoints.
 * No CRUD operations — these endpoints compute metrics on the fly.
 *
 * Backend sources:
 * - Service: /server/apps/assetmanager/services/performance_service.py
 * - Router: /server/apps/assetmanager/subrouters/holding_subrouters/performance_subrouter.py
 */

import {
  EntityPerformanceResponse,
  HoldingsPerformanceResponse,
  StakeholderReturnsResponse,
} from '../../schemas/holding/performance-computed.schemas';
import { PERFORMANCE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Fetch entity/fund performance metrics
 * @param entityId Entity ID to compute performance for
 * @returns Promise with entity performance response
 */
export const getEntityPerformance = async (entityId: number): Promise<EntityPerformanceResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityPerformanceResponse>(PERFORMANCE_ENDPOINTS.ENTITY(entityId), { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch entity performance',
    };
  }
};

/**
 * Fetch per-holding performance metrics
 * @param entityId Entity ID to compute holdings performance for
 * @returns Promise with holdings performance response
 */
export const getHoldingsPerformance = async (entityId: number): Promise<HoldingsPerformanceResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<HoldingsPerformanceResponse>(PERFORMANCE_ENDPOINTS.HOLDINGS(entityId), { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch holdings performance',
      data: [],
    };
  }
};

/**
 * Fetch per-stakeholder return metrics
 * @param entityId Entity ID to compute stakeholder returns for
 * @returns Promise with stakeholder returns response
 */
export const getStakeholderReturns = async (entityId: number): Promise<StakeholderReturnsResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<StakeholderReturnsResponse>(PERFORMANCE_ENDPOINTS.STAKEHOLDERS(entityId), { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stakeholder returns',
      data: [],
    };
  }
};
