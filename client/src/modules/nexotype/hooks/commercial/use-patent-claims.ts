'use client';

import { useContext } from 'react';
import { PatentClaimContext, PatentClaimContextType } from '@/modules/nexotype/providers/commercial/patent-claim-provider';
import { usePatentClaimStore } from '@/modules/nexotype/store/commercial/patent-claim.store';
import {
  type PatentClaim,
  type CreatePatentClaim,
  type UpdatePatentClaim,
} from '@/modules/nexotype/schemas/commercial/patent-claim.schemas';
import { ListPatentClaimsParams } from '@/modules/nexotype/service/commercial/patent-claim.service';

/**
 * Hook to use the patent claim context
 * @throws Error if used outside of a PatentClaimProvider
 */
export function usePatentClaimContext(): PatentClaimContextType {
  const context = useContext(PatentClaimContext);

  if (!context) {
    throw new Error('usePatentClaimContext must be used within a PatentClaimProvider');
  }

  return context;
}

/**
 * Custom hook that combines patent claim context and store
 * to provide a simplified interface for patent claim functionality
 *
 * @returns Patent claim utilities and state
 */
export function usePatentClaims() {
  // Get data from patent claim context
  const {
    patentClaims,
    activePatentClaimId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActivePatentClaim,
    clearError: clearContextError,
  } = usePatentClaimContext();

  // Get additional actions from patent claim store
  const {
    fetchPatentClaims,
    fetchPatentClaim,
    createPatentClaim,
    updatePatentClaim,
    deletePatentClaim,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = usePatentClaimStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active patent claim
  const activePatentClaim = patentClaims.find((item: PatentClaim) => item.id === activePatentClaimId) || null;

  return {
    // State
    patentClaims,
    activePatentClaimId,
    activePatentClaim,
    isLoading,
    error,
    isInitialized,

    // PatentClaim actions
    fetchPatentClaims,
    fetchPatentClaim,
    createPatentClaim,
    updatePatentClaim,
    deletePatentClaim,
    setActivePatentClaim,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return patentClaims.find((item: PatentClaim) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListPatentClaimsParams) => {
      return await fetchPatentClaims(filters);
    },
    createWithData: async (data: CreatePatentClaim) => {
      return await createPatentClaim(data);
    },
    updateWithData: async (id: number, data: UpdatePatentClaim) => {
      return await updatePatentClaim(id, data);
    },
  };
}

export default usePatentClaims;
