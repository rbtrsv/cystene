'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useSecurityStore } from '../../store/captable/security.store';
import { type Security } from '../../schemas/captable/security.schemas';

/**
 * Context type for the securities provider
 */
export interface SecurityContextType {
  // State
  securities: Security[];
  activeSecurityId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveSecurity: (securityId: number | null) => void;
  clearError: () => void;
}

// Create the context
export const SecurityContext = createContext<SecurityContextType | null>(null);

/**
 * Provider component for security related state and actions
 */
export function SecurityProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    securities,
    activeSecurityId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveSecurity,
    clearError
  } = useSecurityStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useSecurityStore.persist.rehydrate();
  }, []);

  // Initialize securities on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing securities:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<SecurityContextType>(() => ({
    securities,
    activeSecurityId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveSecurity,
    clearError
  }), [
    securities,
    activeSecurityId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveSecurity,
    clearError
  ]);

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
}

/**
 * Default export
 */
export default SecurityProvider;
