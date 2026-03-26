'use client';

import { useContext } from 'react';
import { VariantContext, VariantContextType } from '@/modules/nexotype/providers/omics/variant-provider';
import { useVariantStore } from '@/modules/nexotype/store/omics/variant.store';
import {
  type Variant,
  type CreateVariant,
  type UpdateVariant,
} from '@/modules/nexotype/schemas/omics/variant.schemas';
import { ListVariantsParams } from '@/modules/nexotype/service/omics/variant.service';

/**
 * Hook to use the variant context
 * @throws Error if used outside of a VariantProvider
 */
export function useVariantContext(): VariantContextType {
  const context = useContext(VariantContext);

  if (!context) {
    throw new Error('useVariantContext must be used within a VariantProvider');
  }

  return context;
}

/**
 * Custom hook that combines variant context and store
 * to provide a simplified interface for variant functionality
 *
 * @returns Variant utilities and state
 */
export function useVariants() {
  // Get data from variant context
  const {
    variants,
    activeVariantId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveVariant,
    clearError: clearContextError,
  } = useVariantContext();

  // Get additional actions from variant store
  const {
    fetchVariants,
    fetchVariant,
    createVariant,
    updateVariant,
    deleteVariant,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useVariantStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active variant
  const activeVariant = variants.find(
    (variant: Variant) => variant.id === activeVariantId
  ) || null;

  return {
    // State
    variants,
    activeVariantId,
    activeVariant,
    isLoading,
    error,
    isInitialized,

    // Variant actions
    fetchVariants,
    fetchVariant,
    createVariant,
    updateVariant,
    deleteVariant,
    setActiveVariant,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return variants.find((variant: Variant) => variant.id === id);
    },
    getByGeneId: (geneId: number) => {
      return variants.filter((variant: Variant) => variant.gene_id === geneId);
    },
    getByDbSnpId: (dbSnpId: string) => {
      return variants.find((variant: Variant) => variant.db_snp_id === dbSnpId);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListVariantsParams) => {
      return await fetchVariants(filters);
    },
    createWithData: async (data: CreateVariant) => {
      return await createVariant(data);
    },
    updateWithData: async (id: number, data: UpdateVariant) => {
      return await updateVariant(id, data);
    },
  };
}

export default useVariants;
