'use client';

import { useContext, useCallback } from 'react';
import { InfrastructureContext, InfrastructureContextType } from '../../providers/infrastructure/infrastructure-provider';
import { useInfrastructureStore } from '../../store/infrastructure/infrastructure.store';
import {
  type Infrastructure,
  type CreateInfrastructure,
  type UpdateInfrastructure,
  type InfraType
} from '../../schemas/infrastructure/infrastructure.schemas';
import { ListInfrastructureParams } from '../../service/infrastructure/infrastructure.service';

/**
 * Hook to use the infrastructure context
 * @throws Error if used outside of an InfrastructureProvider
 */
export function useInfrastructureContext(): InfrastructureContextType {
  const context = useContext(InfrastructureContext);

  if (!context) {
    throw new Error('useInfrastructureContext must be used within an InfrastructureProvider');
  }

  return context;
}

/**
 * Custom hook that combines infrastructure context and store
 * to provide a simplified interface for infrastructure functionality
 *
 * @returns Infrastructure utilities and state
 */
export function useInfrastructures() {
  // Get data from infrastructure context
  const {
    infrastructures,
    activeInfrastructureId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveInfrastructure,
    clearError: clearContextError
  } = useInfrastructureContext();

  // Get additional actions from infrastructure store
  const {
    fetchInfrastructures,
    fetchInfrastructure,
    createInfrastructure,
    updateInfrastructure,
    deleteInfrastructure,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useInfrastructureStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active infrastructure
  const activeInfrastructure = infrastructures.find((item: Infrastructure) => item.id === activeInfrastructureId) || null;

  return {
    // State
    infrastructures,
    activeInfrastructureId,
    activeInfrastructure,
    isLoading,
    error,
    isInitialized,

    // Infrastructure actions
    fetchInfrastructures,
    fetchInfrastructure,
    createInfrastructure,
    updateInfrastructure,
    deleteInfrastructure,
    setActiveInfrastructure,
    initialize,
    clearError,

    // Helper methods — memoized so they can be used in useMemo dependency arrays
    getInfrastructureById: useCallback((id: number) => {
      return infrastructures.find((item: Infrastructure) => item.id === id);
    }, [infrastructures]),
    getInfrastructureName: useCallback((id: number) => {
      const item = infrastructures.find((i: Infrastructure) => i.id === id);
      return item ? item.name : 'Unknown Infrastructure';
    }, [infrastructures]),
    getInfrastructuresByType: useCallback((infraType: InfraType) => {
      return infrastructures.filter((i: Infrastructure) => i.infra_type === infraType);
    }, [infrastructures]),

    // Convenience wrapper functions
    fetchInfrastructuresWithFilters: async (filters: ListInfrastructureParams) => {
      return await fetchInfrastructures(filters);
    },
    createInfrastructureWithData: async (data: CreateInfrastructure) => {
      return await createInfrastructure(data);
    },
    updateInfrastructureWithData: async (id: number, data: UpdateInfrastructure) => {
      return await updateInfrastructure(id, data);
    }
  };
}

export default useInfrastructures;
