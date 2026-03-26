'use client';

import { useContext } from 'react';
import { ProteinDomainContext, ProteinDomainContextType } from '@/modules/nexotype/providers/omics/protein-domain-provider';
import { useProteinDomainStore } from '@/modules/nexotype/store/omics/protein-domain.store';
import {
  type ProteinDomain,
  type CreateProteinDomain,
  type UpdateProteinDomain,
} from '@/modules/nexotype/schemas/omics/protein-domain.schemas';
import { ListProteinDomainsParams } from '@/modules/nexotype/service/omics/protein-domain.service';

/**
 * Hook to use the protein domain context
 * @throws Error if used outside of a ProteinDomainProvider
 */
export function useProteinDomainContext(): ProteinDomainContextType {
  const context = useContext(ProteinDomainContext);

  if (!context) {
    throw new Error('useProteinDomainContext must be used within a ProteinDomainProvider');
  }

  return context;
}

/**
 * Custom hook that combines protein domain context and store
 * to provide a simplified interface for protein domain functionality
 *
 * @returns Protein domain utilities and state
 */
export function useProteinDomains() {
  // Get data from protein domain context
  const {
    proteinDomains,
    activeProteinDomainId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveProteinDomain,
    clearError: clearContextError,
  } = useProteinDomainContext();

  // Get additional actions from protein domain store
  const {
    fetchProteinDomains,
    fetchProteinDomain,
    createProteinDomain,
    updateProteinDomain,
    deleteProteinDomain,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useProteinDomainStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active protein domain
  const activeProteinDomain = proteinDomains.find(
    (pd: ProteinDomain) => pd.id === activeProteinDomainId
  ) || null;

  return {
    // State
    proteinDomains,
    activeProteinDomainId,
    activeProteinDomain,
    isLoading,
    error,
    isInitialized,

    // Protein domain actions
    fetchProteinDomains,
    fetchProteinDomain,
    createProteinDomain,
    updateProteinDomain,
    deleteProteinDomain,
    setActiveProteinDomain,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return proteinDomains.find((pd: ProteinDomain) => pd.id === id);
    },
    getByName: (id: number) => {
      const pd = proteinDomains.find((d: ProteinDomain) => d.id === id);
      return pd ? pd.name : 'Unknown Domain';
    },
    getByPfamId: (pfamId: string) => {
      return proteinDomains.find((pd: ProteinDomain) => pd.pfam_id === pfamId);
    },
    getByProteinId: (proteinId: number) => {
      return proteinDomains.filter((pd: ProteinDomain) => pd.protein_id === proteinId);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListProteinDomainsParams) => {
      return await fetchProteinDomains(filters);
    },
    createWithData: async (data: CreateProteinDomain) => {
      return await createProteinDomain(data);
    },
    updateWithData: async (id: number, data: UpdateProteinDomain) => {
      return await updateProteinDomain(id, data);
    },
  };
}

export default useProteinDomains;
