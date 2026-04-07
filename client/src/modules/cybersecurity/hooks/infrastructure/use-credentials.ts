'use client';

import { useContext, useCallback } from 'react';
import { CredentialContext, CredentialContextType } from '../../providers/infrastructure/credential-provider';
import { useCredentialStore } from '../../store/infrastructure/credentials.store';
import {
  type Credential,
  type CreateCredential,
  type UpdateCredential,
  type CredentialType
} from '../../schemas/infrastructure/credentials.schemas';
import { ListCredentialsParams } from '../../service/infrastructure/credentials.service';

/**
 * Hook to use the credential context
 * @throws Error if used outside of a CredentialProvider
 */
export function useCredentialContext(): CredentialContextType {
  const context = useContext(CredentialContext);

  if (!context) {
    throw new Error('useCredentialContext must be used within a CredentialProvider');
  }

  return context;
}

/**
 * Custom hook that combines credential context and store
 * to provide a simplified interface for credential functionality
 *
 * @returns Credential utilities and state
 */
export function useCredentials() {
  // Get data from credential context
  const {
    credentials,
    activeCredentialId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveCredential,
    clearError: clearContextError
  } = useCredentialContext();

  // Get additional actions from credential store
  const {
    fetchCredentials,
    fetchCredential,
    createCredential,
    updateCredential,
    deleteCredential,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useCredentialStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active credential
  const activeCredential = credentials.find((item: Credential) => item.id === activeCredentialId) || null;

  return {
    // State
    credentials,
    activeCredentialId,
    activeCredential,
    isLoading,
    error,
    isInitialized,

    // Credential actions
    fetchCredentials,
    fetchCredential,
    createCredential,
    updateCredential,
    deleteCredential,
    setActiveCredential,
    initialize,
    clearError,

    // Helper methods — memoized so they can be used in useMemo dependency arrays
    getCredentialById: useCallback((id: number) => {
      return credentials.find((item: Credential) => item.id === id);
    }, [credentials]),
    getCredentialName: useCallback((id: number) => {
      const item = credentials.find((c: Credential) => c.id === id);
      return item ? item.name : 'Unknown Credential';
    }, [credentials]),
    getCredentialsByType: useCallback((credType: CredentialType) => {
      return credentials.filter((c: Credential) => c.cred_type === credType);
    }, [credentials]),
    getCredentialsByInfrastructure: useCallback((infrastructureId: number) => {
      return credentials.filter((c: Credential) => c.infrastructure_id === infrastructureId);
    }, [credentials]),

    // Convenience wrapper functions
    fetchCredentialsWithFilters: async (filters: ListCredentialsParams) => {
      return await fetchCredentials(filters);
    },
    createCredentialWithData: async (data: CreateCredential) => {
      return await createCredential(data);
    },
    updateCredentialWithData: async (id: number, data: UpdateCredential) => {
      return await updateCredential(id, data);
    }
  };
}

export default useCredentials;
