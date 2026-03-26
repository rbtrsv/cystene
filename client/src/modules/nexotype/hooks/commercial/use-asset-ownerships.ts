'use client';

import { useContext } from 'react';
import { AssetOwnershipContext, AssetOwnershipContextType } from '@/modules/nexotype/providers/commercial/asset-ownership-provider';
import { useAssetOwnershipStore } from '@/modules/nexotype/store/commercial/asset-ownership.store';
import {
  type AssetOwnership,
  type CreateAssetOwnership,
  type UpdateAssetOwnership,
} from '@/modules/nexotype/schemas/commercial/asset-ownership.schemas';
import { ListAssetOwnershipsParams } from '@/modules/nexotype/service/commercial/asset-ownership.service';

/**
 * Hook to use the asset ownership context
 * @throws Error if used outside of an AssetOwnershipProvider
 */
export function useAssetOwnershipContext(): AssetOwnershipContextType {
  const context = useContext(AssetOwnershipContext);

  if (!context) {
    throw new Error('useAssetOwnershipContext must be used within an AssetOwnershipProvider');
  }

  return context;
}

/**
 * Custom hook that combines asset ownership context and store
 * to provide a simplified interface for asset ownership functionality
 *
 * @returns Asset ownership utilities and state
 */
export function useAssetOwnerships() {
  // Get data from asset ownership context
  const {
    assetOwnerships,
    activeAssetOwnershipId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveAssetOwnership,
    clearError: clearContextError,
  } = useAssetOwnershipContext();

  // Get additional actions from asset ownership store
  const {
    fetchAssetOwnerships,
    fetchAssetOwnership,
    createAssetOwnership,
    updateAssetOwnership,
    deleteAssetOwnership,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useAssetOwnershipStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active asset ownership
  const activeAssetOwnership = assetOwnerships.find((item: AssetOwnership) => item.id === activeAssetOwnershipId) || null;

  return {
    // State
    assetOwnerships,
    activeAssetOwnershipId,
    activeAssetOwnership,
    isLoading,
    error,
    isInitialized,

    // AssetOwnership actions
    fetchAssetOwnerships,
    fetchAssetOwnership,
    createAssetOwnership,
    updateAssetOwnership,
    deleteAssetOwnership,
    setActiveAssetOwnership,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return assetOwnerships.find((item: AssetOwnership) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListAssetOwnershipsParams) => {
      return await fetchAssetOwnerships(filters);
    },
    createWithData: async (data: CreateAssetOwnership) => {
      return await createAssetOwnership(data);
    },
    updateWithData: async (id: number, data: UpdateAssetOwnership) => {
      return await updateAssetOwnership(id, data);
    },
  };
}

export default useAssetOwnerships;
