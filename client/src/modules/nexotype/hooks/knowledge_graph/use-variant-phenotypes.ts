'use client';

import { useContext } from 'react';
import { VariantPhenotypeContext, VariantPhenotypeContextType } from '@/modules/nexotype/providers/knowledge_graph/variant-phenotype-provider';
import { useVariantPhenotypeStore } from '@/modules/nexotype/store/knowledge_graph/variant-phenotype.store';
import {
  type VariantPhenotype,
  type CreateVariantPhenotype,
  type UpdateVariantPhenotype,
} from '@/modules/nexotype/schemas/knowledge_graph/variant-phenotype.schemas';
import { ListVariantPhenotypesParams } from '@/modules/nexotype/service/knowledge_graph/variant-phenotype.service';

/**
 * Hook to use the variant phenotype context
 * @throws Error if used outside of a VariantPhenotypeProvider
 */
export function useVariantPhenotypeContext(): VariantPhenotypeContextType {
  const context = useContext(VariantPhenotypeContext);

  if (!context) {
    throw new Error('useVariantPhenotypeContext must be used within a VariantPhenotypeProvider');
  }

  return context;
}

/**
 * Custom hook that combines variant phenotype context and store
 * to provide a simplified interface for variant phenotype functionality
 *
 * @returns Variant phenotype utilities and state
 */
export function useVariantPhenotypes() {
  // Get data from variant phenotype context
  const {
    variantPhenotypes,
    activeVariantPhenotypeId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveVariantPhenotype,
    clearError: clearContextError,
  } = useVariantPhenotypeContext();

  // Get additional actions from variant phenotype store
  const {
    fetchVariantPhenotypes,
    fetchVariantPhenotype,
    createVariantPhenotype,
    updateVariantPhenotype,
    deleteVariantPhenotype,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useVariantPhenotypeStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active variant phenotype
  const activeVariantPhenotype = variantPhenotypes.find((item: VariantPhenotype) => item.id === activeVariantPhenotypeId) || null;

  return {
    // State
    variantPhenotypes,
    activeVariantPhenotypeId,
    activeVariantPhenotype,
    isLoading,
    error,
    isInitialized,

    // VariantPhenotype actions
    fetchVariantPhenotypes,
    fetchVariantPhenotype,
    createVariantPhenotype,
    updateVariantPhenotype,
    deleteVariantPhenotype,
    setActiveVariantPhenotype,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return variantPhenotypes.find((item: VariantPhenotype) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListVariantPhenotypesParams) => {
      return await fetchVariantPhenotypes(filters);
    },
    createWithData: async (data: CreateVariantPhenotype) => {
      return await createVariantPhenotype(data);
    },
    updateWithData: async (id: number, data: UpdateVariantPhenotype) => {
      return await updateVariantPhenotype(id, data);
    },
  };
}

export default useVariantPhenotypes;
