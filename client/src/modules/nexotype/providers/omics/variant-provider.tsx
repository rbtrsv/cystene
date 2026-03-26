'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useVariantStore } from '@/modules/nexotype/store/omics/variant.store';
import { type Variant } from '@/modules/nexotype/schemas/omics/variant.schemas';

/**
 * Context type for the variants provider
 */
export interface VariantContextType {
  // State
  variants: Variant[];
  activeVariantId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveVariant: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const VariantContext = createContext<VariantContextType | null>(null);

/**
 * Provider component for variant-related state and actions
 */
export function VariantProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    variants,
    activeVariantId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveVariant,
    clearError,
  } = useVariantStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useVariantStore.persist.rehydrate();
  }, []);

  // Initialize variants on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing variants:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<VariantContextType>(() => ({
    variants,
    activeVariantId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveVariant,
    clearError,
  }), [
    variants,
    activeVariantId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveVariant,
    clearError,
  ]);

  return (
    <VariantContext.Provider value={contextValue}>
      {children}
    </VariantContext.Provider>
  );
}

/**
 * Default export
 */
export default VariantProvider;
