'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useIndicationStore } from '@/modules/nexotype/store/clinical/indication.store';
import { type Indication } from '@/modules/nexotype/schemas/clinical/indication.schemas';

/**
 * Context type for the indications provider
 */
export interface IndicationContextType {
  // State
  indications: Indication[];
  activeIndicationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveIndication: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const IndicationContext = createContext<IndicationContextType | null>(null);

/**
 * Provider component for indication-related state and actions
 */
export function IndicationProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    indications,
    activeIndicationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveIndication,
    clearError,
  } = useIndicationStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useIndicationStore.persist.rehydrate();
  }, []);

  // Initialize indications on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing indications:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<IndicationContextType>(() => ({
    indications,
    activeIndicationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveIndication,
    clearError,
  }), [
    indications,
    activeIndicationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveIndication,
    clearError,
  ]);

  return (
    <IndicationContext.Provider value={contextValue}>
      {children}
    </IndicationContext.Provider>
  );
}

/**
 * Default export
 */
export default IndicationProvider;
