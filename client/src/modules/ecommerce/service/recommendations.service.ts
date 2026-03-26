'use client';

import {
  RecommendationResult,
  RecommendationResponse,
  BestsellersInput,
  CrossSellInput,
  UpsellInput,
  SimilarInput,
  BestsellersInputSchema,
  CrossSellInputSchema,
  UpsellInputSchema,
  SimilarInputSchema,
} from '../schemas/recommendations.schemas';
import { RECOMMENDATION_ENDPOINTS } from '../utils/api.endpoints';
import { fetchClient } from '@/modules/accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Fetch bestseller recommendations
 * @param data Bestseller request parameters
 * @returns Promise with recommendation response
 */
export const getBestsellers = async (data: BestsellersInput): Promise<RecommendationResponse> => {
  // Validate request data
  BestsellersInputSchema.parse(data);

  try {
    // Backend returns { success, data: RecommendationResult, error } — unwrap the envelope
    const response = await fetchClient<{ success: boolean; data: RecommendationResult; error?: string }>(
      RECOMMENDATION_ENDPOINTS.BESTSELLERS,
      { method: 'POST', body: data as unknown as Record<string, unknown> }
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
      error: error instanceof Error ? error.message : 'Failed to fetch bestseller recommendations',
      data: undefined,
    };
  }
};

/**
 * Fetch cross-sell recommendations for a product
 * @param data Cross-sell request parameters
 * @returns Promise with recommendation response
 */
export const getCrossSell = async (data: CrossSellInput): Promise<RecommendationResponse> => {
  // Validate request data
  CrossSellInputSchema.parse(data);

  try {
    // Backend returns { success, data: RecommendationResult, error } — unwrap the envelope
    const response = await fetchClient<{ success: boolean; data: RecommendationResult; error?: string }>(
      RECOMMENDATION_ENDPOINTS.CROSS_SELL,
      { method: 'POST', body: data as unknown as Record<string, unknown> }
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
      error: error instanceof Error ? error.message : 'Failed to fetch cross-sell recommendations',
      data: undefined,
    };
  }
};

/**
 * Fetch upsell recommendations for a product
 * @param data Upsell request parameters
 * @returns Promise with recommendation response
 */
export const getUpsell = async (data: UpsellInput): Promise<RecommendationResponse> => {
  // Validate request data
  UpsellInputSchema.parse(data);

  try {
    // Backend returns { success, data: RecommendationResult, error } — unwrap the envelope
    const response = await fetchClient<{ success: boolean; data: RecommendationResult; error?: string }>(
      RECOMMENDATION_ENDPOINTS.UPSELL,
      { method: 'POST', body: data as unknown as Record<string, unknown> }
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
      error: error instanceof Error ? error.message : 'Failed to fetch upsell recommendations',
      data: undefined,
    };
  }
};

/**
 * Fetch similar product recommendations
 * @param data Similar products request parameters
 * @returns Promise with recommendation response
 */
export const getSimilar = async (data: SimilarInput): Promise<RecommendationResponse> => {
  // Validate request data
  SimilarInputSchema.parse(data);

  try {
    // Backend returns { success, data: RecommendationResult, error } — unwrap the envelope
    const response = await fetchClient<{ success: boolean; data: RecommendationResult; error?: string }>(
      RECOMMENDATION_ENDPOINTS.SIMILAR,
      { method: 'POST', body: data as unknown as Record<string, unknown> }
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
      error: error instanceof Error ? error.message : 'Failed to fetch similar product recommendations',
      data: undefined,
    };
  }
};
