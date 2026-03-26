'use client';

import { useContext } from 'react';
import { LicensingAgreementContext, LicensingAgreementContextType } from '@/modules/nexotype/providers/commercial/licensing-agreement-provider';
import { useLicensingAgreementStore } from '@/modules/nexotype/store/commercial/licensing-agreement.store';
import {
  type LicensingAgreement,
  type CreateLicensingAgreement,
  type UpdateLicensingAgreement,
} from '@/modules/nexotype/schemas/commercial/licensing-agreement.schemas';
import { ListLicensingAgreementsParams } from '@/modules/nexotype/service/commercial/licensing-agreement.service';

/**
 * Hook to use the licensing agreement context
 * @throws Error if used outside of a LicensingAgreementProvider
 */
export function useLicensingAgreementContext(): LicensingAgreementContextType {
  const context = useContext(LicensingAgreementContext);

  if (!context) {
    throw new Error('useLicensingAgreementContext must be used within a LicensingAgreementProvider');
  }

  return context;
}

/**
 * Custom hook that combines licensing agreement context and store
 * to provide a simplified interface for licensing agreement functionality
 *
 * @returns Licensing agreement utilities and state
 */
export function useLicensingAgreements() {
  // Get data from licensing agreement context
  const {
    licensingAgreements,
    activeLicensingAgreementId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveLicensingAgreement,
    clearError: clearContextError,
  } = useLicensingAgreementContext();

  // Get additional actions from licensing agreement store
  const {
    fetchLicensingAgreements,
    fetchLicensingAgreement,
    createLicensingAgreement,
    updateLicensingAgreement,
    deleteLicensingAgreement,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useLicensingAgreementStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active licensing agreement
  const activeLicensingAgreement = licensingAgreements.find((item: LicensingAgreement) => item.id === activeLicensingAgreementId) || null;

  return {
    // State
    licensingAgreements,
    activeLicensingAgreementId,
    activeLicensingAgreement,
    isLoading,
    error,
    isInitialized,

    // LicensingAgreement actions
    fetchLicensingAgreements,
    fetchLicensingAgreement,
    createLicensingAgreement,
    updateLicensingAgreement,
    deleteLicensingAgreement,
    setActiveLicensingAgreement,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return licensingAgreements.find((item: LicensingAgreement) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListLicensingAgreementsParams) => {
      return await fetchLicensingAgreements(filters);
    },
    createWithData: async (data: CreateLicensingAgreement) => {
      return await createLicensingAgreement(data);
    },
    updateWithData: async (id: number, data: UpdateLicensingAgreement) => {
      return await updateLicensingAgreement(id, data);
    },
  };
}

export default useLicensingAgreements;
