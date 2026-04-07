'use client';

import { useContext, useCallback } from 'react';
import { AssetContext, AssetContextType } from '../../providers/discovery/asset-provider';
import { useAssetStore } from '../../store/discovery/assets.store';
import {
  type Asset,
  type AssetType
} from '../../schemas/discovery/assets.schemas';
import { ListAssetsParams } from '../../service/discovery/assets.service';

/**
 * Hook to use the asset context
 * @throws Error if used outside of an AssetProvider
 */
export function useAssetContext(): AssetContextType {
  const context = useContext(AssetContext);

  if (!context) {
    throw new Error('useAssetContext must be used within an AssetProvider');
  }

  return context;
}

/**
 * Custom hook that combines asset context and store
 * to provide a simplified interface for asset functionality
 *
 * @returns Asset utilities and state
 */
export function useAssets() {
  // Get data from asset context
  const {
    assets,
    activeAssetId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveAsset,
    clearError: clearContextError
  } = useAssetContext();

  // Get additional actions from asset store
  const {
    fetchAssets,
    fetchAsset,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useAssetStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active asset
  const activeAsset = assets.find((item: Asset) => item.id === activeAssetId) || null;

  return {
    // State
    assets,
    activeAssetId,
    activeAsset,
    isLoading,
    error,
    isInitialized,

    // Asset actions (read-only — no create/update/delete)
    fetchAssets,
    fetchAsset,
    setActiveAsset,
    initialize,
    clearError,

    // Helper methods — memoized so they can be used in useMemo dependency arrays
    getAssetById: useCallback((id: number) => {
      return assets.find((item: Asset) => item.id === id);
    }, [assets]),
    getAssetsByType: useCallback((assetType: AssetType) => {
      return assets.filter((a: Asset) => a.asset_type === assetType);
    }, [assets]),
    getAssetsByScanJob: useCallback((scanJobId: number) => {
      return assets.filter((a: Asset) => a.scan_job_id === scanJobId);
    }, [assets]),
    getServiceAssets: useCallback(() => {
      return assets.filter((a: Asset) => a.asset_type === 'service');
    }, [assets]),
    getHostAssets: useCallback(() => {
      return assets.filter((a: Asset) => a.asset_type === 'host');
    }, [assets]),

    // Convenience wrapper functions
    fetchAssetsWithFilters: async (filters: ListAssetsParams) => {
      return await fetchAssets(filters);
    }
  };
}

export default useAssets;
