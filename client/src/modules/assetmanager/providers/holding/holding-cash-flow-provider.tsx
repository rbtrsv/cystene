'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useHoldingCashFlowStore } from '../../store/holding/holding-cash-flow.store';
import { type HoldingCashFlow } from '../../schemas/holding/holding-cash-flow.schemas';

/**
 * Context type for the holding cash flow provider
 */
export interface HoldingCashFlowContextType {
  // State
  holdingCashFlows: HoldingCashFlow[];
  activeHoldingCashFlowId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveHoldingCashFlow: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const HoldingCashFlowContext = createContext<HoldingCashFlowContextType | null>(null);

/**
 * Provider component for holding cash flow-related state and actions
 */
export function HoldingCashFlowProvider({
  children,
  initialFetch = true,
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    holdingCashFlows,
    activeHoldingCashFlowId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveHoldingCashFlow,
    clearError,
  } = useHoldingCashFlowStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useHoldingCashFlowStore.persist.rehydrate();
  }, []);

  // Initialize holding cash flows on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing holding cash flows:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<HoldingCashFlowContextType>(() => ({
    holdingCashFlows,
    activeHoldingCashFlowId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveHoldingCashFlow,
    clearError,
  }), [
    holdingCashFlows,
    activeHoldingCashFlowId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveHoldingCashFlow,
    clearError,
  ]);

  return (
    <HoldingCashFlowContext.Provider value={contextValue}>
      {children}
    </HoldingCashFlowContext.Provider>
  );
}

/**
 * Default export
 */
export default HoldingCashFlowProvider;
