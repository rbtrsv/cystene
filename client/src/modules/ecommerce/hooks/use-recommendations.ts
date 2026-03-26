'use client';

import { useState, useCallback } from 'react';
import {
  type RecommendationResult,
  type BestsellersInput,
  type CrossSellInput,
  type UpsellInput,
  type SimilarInput,
} from '../schemas/recommendations.schemas';
import {
  getBestsellers as apiBestsellers,
  getCrossSell as apiCrossSell,
  getUpsell as apiUpsell,
  getSimilar as apiSimilar,
} from '../service/recommendations.service';

/**
 * Stateless hook for fetching recommendations
 *
 * No store/provider needed — uses local useState for loading/error/result.
 * Wraps service calls and provides a clean API.
 */
export function useRecommendations() {
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch bestseller recommendations
   */
  const fetchBestsellers = useCallback(async (data: BestsellersInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiBestsellers(data);

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || 'Failed to fetch bestsellers');
        setResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch cross-sell recommendations
   */
  const fetchCrossSell = useCallback(async (data: CrossSellInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCrossSell(data);

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || 'Failed to fetch cross-sell recommendations');
        setResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch upsell recommendations
   */
  const fetchUpsell = useCallback(async (data: UpsellInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiUpsell(data);

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || 'Failed to fetch upsell recommendations');
        setResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch similar product recommendations
   */
  const fetchSimilar = useCallback(async (data: SimilarInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiSimilar(data);

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || 'Failed to fetch similar product recommendations');
        setResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear current result and error
   */
  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    isLoading,
    error,
    fetchBestsellers,
    fetchCrossSell,
    fetchUpsell,
    fetchSimilar,
    clearResult,
  };
}

export default useRecommendations;
