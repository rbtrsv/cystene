'use client';

import { useContext } from 'react';
import { SmallMoleculeContext, SmallMoleculeContextType } from '@/modules/nexotype/providers/asset/small-molecule-provider';
import { useSmallMoleculeStore } from '@/modules/nexotype/store/asset/small-molecule.store';
import {
  type SmallMolecule,
  type CreateSmallMolecule,
  type UpdateSmallMolecule,
} from '@/modules/nexotype/schemas/asset/small-molecule.schemas';
import { ListSmallMoleculesParams } from '@/modules/nexotype/service/asset/small-molecule.service';

/**
 * Hook to use the small molecule context
 * @throws Error if used outside of a SmallMoleculeProvider
 */
export function useSmallMoleculeContext(): SmallMoleculeContextType {
  const context = useContext(SmallMoleculeContext);

  if (!context) {
    throw new Error('useSmallMoleculeContext must be used within a SmallMoleculeProvider');
  }

  return context;
}

/**
 * Custom hook that combines small molecule context and store
 * to provide a simplified interface for small molecule functionality
 *
 * @returns Small molecule utilities and state
 */
export function useSmallMolecules() {
  // Get data from small molecule context
  const {
    smallMolecules,
    activeSmallMoleculeId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveSmallMolecule,
    clearError: clearContextError,
  } = useSmallMoleculeContext();

  // Get additional actions from small molecule store
  const {
    fetchSmallMolecules,
    fetchSmallMolecule,
    createSmallMolecule,
    updateSmallMolecule,
    deleteSmallMolecule,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useSmallMoleculeStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active small molecule
  const activeSmallMolecule = smallMolecules.find(
    (molecule: SmallMolecule) => molecule.id === activeSmallMoleculeId
  ) || null;

  return {
    // State
    smallMolecules,
    activeSmallMoleculeId,
    activeSmallMolecule,
    isLoading,
    error,
    isInitialized,

    // Small molecule actions
    fetchSmallMolecules,
    fetchSmallMolecule,
    createSmallMolecule,
    updateSmallMolecule,
    deleteSmallMolecule,
    setActiveSmallMolecule,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return smallMolecules.find((molecule: SmallMolecule) => molecule.id === id);
    },
    getByName: (name: string) => {
      return smallMolecules.find((molecule: SmallMolecule) => molecule.name === name);
    },
    getByUid: (uid: string) => {
      return smallMolecules.find((molecule: SmallMolecule) => molecule.uid === uid);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListSmallMoleculesParams) => {
      return await fetchSmallMolecules(filters);
    },
    createWithData: async (data: CreateSmallMolecule) => {
      return await createSmallMolecule(data);
    },
    updateWithData: async (id: number, data: UpdateSmallMolecule) => {
      return await updateSmallMolecule(id, data);
    },
  };
}

export default useSmallMolecules;
