'use client';

import { useContext } from 'react';
import { AssetTechnologyPlatformContext, AssetTechnologyPlatformContextType } from '@/modules/nexotype/providers/commercial/asset-technology-platform-provider';
import { useAssetTechnologyPlatformStore } from '@/modules/nexotype/store/commercial/asset-technology-platform.store';
import {
  type AssetTechnologyPlatform,
  type CreateAssetTechnologyPlatform,
  type UpdateAssetTechnologyPlatform,
} from '@/modules/nexotype/schemas/commercial/asset-technology-platform.schemas';
import { ListAssetTechnologyPlatformsParams } from '@/modules/nexotype/service/commercial/asset-technology-platform.service';

/**
 * Hook to use the asset technology platform context
 * @throws Error if used outside of an AssetTechnologyPlatformProvider
 */
export function useAssetTechnologyPlatformContext(): AssetTechnologyPlatformContextType {
  const context = useContext(AssetTechnologyPlatformContext);

  if (!context) {
    throw new Error('useAssetTechnologyPlatformContext must be used within an AssetTechnologyPlatformProvider');
  }

  return context;
}

/**
 * Custom hook that combines asset technology platform context and store
 * to provide a simplified interface for asset technology platform functionality
 *
 * @returns Asset technology platform utilities and state
 */
export function useAssetTechnologyPlatforms() {
  // Get data from asset technology platform context
  const {
    assetTechnologyPlatforms,
    activeAssetTechnologyPlatformId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveAssetTechnologyPlatform,
    clearError: clearContextError,
  } = useAssetTechnologyPlatformContext();

  // Get additional actions from asset technology platform store
  const {
    fetchAssetTechnologyPlatforms,
    fetchAssetTechnologyPlatform,
    createAssetTechnologyPlatform,
    updateAssetTechnologyPlatform,
    deleteAssetTechnologyPlatform,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useAssetTechnologyPlatformStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active asset technology platform
  const activeAssetTechnologyPlatform = assetTechnologyPlatforms.find((item: AssetTechnologyPlatform) => item.id === activeAssetTechnologyPlatformId) || null;

  return {
    // State
    assetTechnologyPlatforms,
    activeAssetTechnologyPlatformId,
    activeAssetTechnologyPlatform,
    isLoading,
    error,
    isInitialized,

    // AssetTechnologyPlatform actions
    fetchAssetTechnologyPlatforms,
    fetchAssetTechnologyPlatform,
    createAssetTechnologyPlatform,
    updateAssetTechnologyPlatform,
    deleteAssetTechnologyPlatform,
    setActiveAssetTechnologyPlatform,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return assetTechnologyPlatforms.find((item: AssetTechnologyPlatform) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListAssetTechnologyPlatformsParams) => {
      return await fetchAssetTechnologyPlatforms(filters);
    },
    createWithData: async (data: CreateAssetTechnologyPlatform) => {
      return await createAssetTechnologyPlatform(data);
    },
    updateWithData: async (id: number, data: UpdateAssetTechnologyPlatform) => {
      return await updateAssetTechnologyPlatform(id, data);
    },
  };
}

export default useAssetTechnologyPlatforms;
