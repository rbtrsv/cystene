'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { usePatentClaimStore } from '@/modules/nexotype/store/commercial/patent-claim.store';
import { type PatentClaim } from '@/modules/nexotype/schemas/commercial/patent-claim.schemas';

/**
 * Context type for the patent claims provider
 */
export interface PatentClaimContextType {
  // State
  patentClaims: PatentClaim[];
  activePatentClaimId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActivePatentClaim: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const PatentClaimContext = createContext<PatentClaimContextType | null>(null);

/**
 * Provider component for patent claim-related state and actions
 */
export function PatentClaimProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    patentClaims,
    activePatentClaimId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePatentClaim,
    clearError,
  } = usePatentClaimStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    usePatentClaimStore.persist.rehydrate();
  }, []);

  // Initialize patent claims on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing patent claims:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<PatentClaimContextType>(() => ({
    patentClaims,
    activePatentClaimId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePatentClaim,
    clearError,
  }), [
    patentClaims,
    activePatentClaimId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePatentClaim,
    clearError,
  ]);

  return (
    <PatentClaimContext.Provider value={contextValue}>
      {children}
    </PatentClaimContext.Provider>
  );
}

/**
 * Default export
 */
export default PatentClaimProvider;
