'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useCredentialStore } from '../../store/infrastructure/credentials.store';
import { type Credential } from '../../schemas/infrastructure/credentials.schemas';

/**
 * Context type for the credentials provider
 */
export interface CredentialContextType {
  // State
  credentials: Credential[];
  activeCredentialId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveCredential: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const CredentialContext = createContext<CredentialContextType | null>(null);

/**
 * Provider component for credential-related state and actions
 */
export function CredentialProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    credentials,
    activeCredentialId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveCredential,
    clearError
  } = useCredentialStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useCredentialStore.persist.rehydrate();
  }, []);

  // Initialize credentials on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing credentials:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<CredentialContextType>(() => ({
    credentials,
    activeCredentialId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveCredential,
    clearError
  }), [
    credentials,
    activeCredentialId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveCredential,
    clearError
  ]);

  return (
    <CredentialContext.Provider value={contextValue}>
      {children}
    </CredentialContext.Provider>
  );
}

/**
 * Default export
 */
export default CredentialProvider;
