'use client';

/**
 * Stakeholder Position Service
 *
 * Read-only service for computed stakeholder position endpoints.
 * No CRUD operations — these endpoints compute positions on the fly.
 *
 * Backend sources:
 * - Service: /server/apps/assetmanager/services/stakeholder_position_service.py
 * - Router: /server/apps/assetmanager/subrouters/captable_subrouters/stakeholder_position_subrouter.py
 */

import {
  StakeholderPositionsResponse,
  StakeholderPositionResponse,
  TrackAsHoldingResponse,
} from '../../schemas/captable/stakeholder-position.schemas';
import { STAKEHOLDER_POSITION_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Fetch all positions for a source entity (investor view)
 * @param sourceEntityId Source entity ID (the investing entity)
 * @returns Promise with stakeholder positions response
 */
export const getStakeholderPositions = async (sourceEntityId: number): Promise<StakeholderPositionsResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<StakeholderPositionsResponse>(STAKEHOLDER_POSITION_ENDPOINTS.LIST(sourceEntityId), { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stakeholder positions',
      data: [],
    };
  }
};

/**
 * Fetch position detail for a source entity on a specific cap table
 * @param entityId Entity ID of the cap table
 * @param sourceEntityId Source entity ID (the investing entity)
 * @returns Promise with stakeholder position response
 */
export const getStakeholderPosition = async (entityId: number, sourceEntityId: number): Promise<StakeholderPositionResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<StakeholderPositionResponse>(STAKEHOLDER_POSITION_ENDPOINTS.DETAIL(entityId, sourceEntityId), { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stakeholder position',
    };
  }
};

/**
 * Track a position as a Holding (creates Holding + HoldingCashFlows from cap table data)
 * @param entityId Entity ID of the cap table (target entity)
 * @param sourceEntityId Source entity ID (the investing entity — where the Holding lives)
 * @returns Promise with track-as-holding response
 */
export const trackAsHolding = async (entityId: number, sourceEntityId: number): Promise<TrackAsHoldingResponse> => {
  try {
    const response = await fetchClient<TrackAsHoldingResponse>(STAKEHOLDER_POSITION_ENDPOINTS.TRACK_AS_HOLDING(entityId, sourceEntityId), { method: 'POST' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to track as holding',
    };
  }
};
