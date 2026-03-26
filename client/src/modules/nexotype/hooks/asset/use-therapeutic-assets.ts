'use client';

import { useContext } from 'react';
import { TherapeuticAssetContext, TherapeuticAssetContextType } from '@/modules/nexotype/providers/asset/therapeutic-asset-provider';
import { useTherapeuticAssetStore } from '@/modules/nexotype/store/asset/therapeutic-asset.store';
import {
  type TherapeuticAsset,
  type CreateTherapeuticAsset,
  type UpdateTherapeuticAsset,
} from '@/modules/nexotype/schemas/asset/therapeutic-asset.schemas';
import { ListTherapeuticAssetsParams } from '@/modules/nexotype/service/asset/therapeutic-asset.service';

/**
 * Hook to use the therapeutic asset context
 * @throws Error if used outside of a TherapeuticAssetProvider
 */
export function useTherapeuticAssetContext(): TherapeuticAssetContextType {
  const context = useContext(TherapeuticAssetContext);

  if (!context) {
    throw new Error('useTherapeuticAssetContext must be used within a TherapeuticAssetProvider');
  }

  return context;
}

/**
 * Custom hook that combines therapeutic asset context and store
 * to provide a simplified interface for therapeutic asset functionality
 *
 * @returns Therapeutic asset utilities and state
 */
export function useTherapeuticAssets() {
  // Get data from therapeutic asset context
  const {
    therapeuticAssets,
    activeTherapeuticAssetId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveTherapeuticAsset,
    clearError: clearContextError,
  } = useTherapeuticAssetContext();

  // Get additional actions from therapeutic asset store
  const {
    fetchTherapeuticAssets,
    fetchTherapeuticAsset,
    createTherapeuticAsset,
    updateTherapeuticAsset,
    deleteTherapeuticAsset,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useTherapeuticAssetStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active therapeutic asset
  const activeTherapeuticAsset = therapeuticAssets.find(
    (asset: TherapeuticAsset) => asset.id === activeTherapeuticAssetId
  ) || null;

  return {
    // State
    therapeuticAssets,
    activeTherapeuticAssetId,
    activeTherapeuticAsset,
    isLoading,
    error,
    isInitialized,

    // Therapeutic asset actions
    fetchTherapeuticAssets,
    fetchTherapeuticAsset,
    createTherapeuticAsset,
    updateTherapeuticAsset,
    deleteTherapeuticAsset,
    setActiveTherapeuticAsset,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return therapeuticAssets.find((asset: TherapeuticAsset) => asset.id === id);
    },
    getByName: (id: number) => {
      const asset = therapeuticAssets.find((a: TherapeuticAsset) => a.id === id);
      return asset ? asset.name : 'Unknown Asset';
    },
    getByAssetType: (assetType: string) => {
      return therapeuticAssets.filter((a: TherapeuticAsset) => a.asset_type === assetType);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListTherapeuticAssetsParams) => {
      return await fetchTherapeuticAssets(filters);
    },
    createWithData: async (data: CreateTherapeuticAsset) => {
      return await createTherapeuticAsset(data);
    },
    updateWithData: async (id: number, data: UpdateTherapeuticAsset) => {
      return await updateTherapeuticAsset(id, data);
    },
  };
}

export default useTherapeuticAssets;
