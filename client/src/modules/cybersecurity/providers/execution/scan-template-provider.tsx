'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useScanTemplateStore } from '../../store/execution/scan-templates.store';
import { type ScanTemplate } from '../../schemas/execution/scan-templates.schemas';

/**
 * Context type for the scan templates provider
 */
export interface ScanTemplateContextType {
  // State
  scanTemplates: ScanTemplate[];
  activeScanTemplateId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveScanTemplate: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const ScanTemplateContext = createContext<ScanTemplateContextType | null>(null);

/**
 * Provider component for scan template-related state and actions
 */
export function ScanTemplateProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    scanTemplates,
    activeScanTemplateId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveScanTemplate,
    clearError
  } = useScanTemplateStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useScanTemplateStore.persist.rehydrate();
  }, []);

  // Initialize scan templates on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing scan templates:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ScanTemplateContextType>(() => ({
    scanTemplates,
    activeScanTemplateId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveScanTemplate,
    clearError
  }), [
    scanTemplates,
    activeScanTemplateId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveScanTemplate,
    clearError
  ]);

  return (
    <ScanTemplateContext.Provider value={contextValue}>
      {children}
    </ScanTemplateContext.Provider>
  );
}

/**
 * Default export
 */
export default ScanTemplateProvider;
