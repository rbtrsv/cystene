'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useLicensingAgreementStore } from '@/modules/nexotype/store/commercial/licensing-agreement.store';
import { type LicensingAgreement } from '@/modules/nexotype/schemas/commercial/licensing-agreement.schemas';

/**
 * Context type for the licensing agreements provider
 */
export interface LicensingAgreementContextType {
  // State
  licensingAgreements: LicensingAgreement[];
  activeLicensingAgreementId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveLicensingAgreement: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const LicensingAgreementContext = createContext<LicensingAgreementContextType | null>(null);

/**
 * Provider component for licensing agreement-related state and actions
 */
export function LicensingAgreementProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    licensingAgreements,
    activeLicensingAgreementId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveLicensingAgreement,
    clearError,
  } = useLicensingAgreementStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useLicensingAgreementStore.persist.rehydrate();
  }, []);

  // Initialize licensing agreements on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing licensing agreements:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<LicensingAgreementContextType>(() => ({
    licensingAgreements,
    activeLicensingAgreementId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveLicensingAgreement,
    clearError,
  }), [
    licensingAgreements,
    activeLicensingAgreementId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveLicensingAgreement,
    clearError,
  ]);

  return (
    <LicensingAgreementContext.Provider value={contextValue}>
      {children}
    </LicensingAgreementContext.Provider>
  );
}

/**
 * Default export
 */
export default LicensingAgreementProvider;
