'use client';

import { useContext } from 'react';
import {
  UnitOfMeasureContext,
  UnitOfMeasureContextType,
} from '@/modules/nexotype/providers/standardization/unit-of-measure-provider';
import { useUnitOfMeasureStore } from '@/modules/nexotype/store/standardization/unit-of-measure.store';
import {
  type UnitOfMeasure,
  type CreateUnitOfMeasure,
  type UpdateUnitOfMeasure,
} from '@/modules/nexotype/schemas/standardization/unit-of-measure.schemas';
import { ListUnitsOfMeasureParams } from '@/modules/nexotype/service/standardization/unit-of-measure.service';

/**
 * Hook to use the unit of measure context
 * @throws Error if used outside of a UnitOfMeasureProvider
 */
export function useUnitOfMeasureContext(): UnitOfMeasureContextType {
  const context = useContext(UnitOfMeasureContext);

  if (!context) {
    throw new Error('useUnitOfMeasureContext must be used within a UnitOfMeasureProvider');
  }

  return context;
}

/**
 * Custom hook that combines unit of measure context and store
 * to provide a simplified interface for unit of measure functionality
 *
 * @returns UnitOfMeasure utilities and state
 */
export function useUnitsOfMeasure() {
  const {
    unitsOfMeasure,
    activeUnitOfMeasureId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveUnitOfMeasure,
    clearError: clearContextError,
  } = useUnitOfMeasureContext();

  const {
    fetchUnitsOfMeasure,
    fetchUnitOfMeasure,
    createUnitOfMeasure,
    updateUnitOfMeasure,
    deleteUnitOfMeasure,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useUnitOfMeasureStore();

  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  const activeUnitOfMeasure = unitsOfMeasure.find(
    (item: UnitOfMeasure) => item.id === activeUnitOfMeasureId
  ) || null;

  return {
    // State
    unitsOfMeasure,
    activeUnitOfMeasureId,
    activeUnitOfMeasure,
    isLoading,
    error,
    isInitialized,

    // UnitOfMeasure actions
    fetchUnitsOfMeasure,
    fetchUnitOfMeasure,
    createUnitOfMeasure,
    updateUnitOfMeasure,
    deleteUnitOfMeasure,
    setActiveUnitOfMeasure,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return unitsOfMeasure.find((item: UnitOfMeasure) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListUnitsOfMeasureParams) => {
      return await fetchUnitsOfMeasure(filters);
    },
    createWithData: async (data: CreateUnitOfMeasure) => {
      return await createUnitOfMeasure(data);
    },
    updateWithData: async (id: number, data: UpdateUnitOfMeasure) => {
      return await updateUnitOfMeasure(id, data);
    },
  };
}

export default useUnitsOfMeasure;
