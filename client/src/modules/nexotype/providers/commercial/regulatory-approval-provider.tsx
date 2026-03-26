'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useRegulatoryApprovalStore } from '@/modules/nexotype/store/commercial/regulatory-approval.store';
import { type RegulatoryApproval } from '@/modules/nexotype/schemas/commercial/regulatory-approval.schemas';

/**
 * Context type for the regulatory approvals provider
 */
export interface RegulatoryApprovalContextType {
  // State
  regulatoryApprovals: RegulatoryApproval[];
  activeRegulatoryApprovalId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveRegulatoryApproval: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const RegulatoryApprovalContext = createContext<RegulatoryApprovalContextType | null>(null);

/**
 * Provider component for regulatory approval-related state and actions
 */
export function RegulatoryApprovalProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    regulatoryApprovals,
    activeRegulatoryApprovalId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveRegulatoryApproval,
    clearError,
  } = useRegulatoryApprovalStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useRegulatoryApprovalStore.persist.rehydrate();
  }, []);

  // Initialize regulatory approvals on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing regulatory approvals:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<RegulatoryApprovalContextType>(() => ({
    regulatoryApprovals,
    activeRegulatoryApprovalId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveRegulatoryApproval,
    clearError,
  }), [
    regulatoryApprovals,
    activeRegulatoryApprovalId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveRegulatoryApproval,
    clearError,
  ]);

  return (
    <RegulatoryApprovalContext.Provider value={contextValue}>
      {children}
    </RegulatoryApprovalContext.Provider>
  );
}

/**
 * Default export
 */
export default RegulatoryApprovalProvider;
