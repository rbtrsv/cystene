'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useSyndicateTransactionsStore } from '../../store/entity/syndicate-transaction.store';
import { type SyndicateTransaction } from '../../schemas/entity/syndicate-transaction.schemas';
import { ListSyndicateTransactionsParams } from '../../service/entity/syndicate-transaction.service';

/**
 * Context type for the syndicate transactions provider
 */
export interface SyndicateTransactionsContextType {
  // State
  transactions: SyndicateTransaction[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: (params?: ListSyndicateTransactionsParams) => Promise<void>;
  clearError: () => void;
}

// Create the context
export const SyndicateTransactionsContext = createContext<SyndicateTransactionsContextType | null>(null);

/**
 * Provider component for syndicate transactions-related state and actions
 */
export function SyndicateTransactionsProvider({
  children,
  initialFetch = false,
  syndicateId,
  sellerEntityId,
  buyerEntityId,
  status
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
  syndicateId?: number;
  sellerEntityId?: number;
  buyerEntityId?: number;
  status?: string;
}) {
  // Get state and actions from the store
  const {
    transactions,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  } = useSyndicateTransactionsStore();

  // Initialize transactions on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      const params: ListSyndicateTransactionsParams = {};
      if (syndicateId) params.syndicate_id = syndicateId;
      if (sellerEntityId) params.seller_entity_id = sellerEntityId;
      if (buyerEntityId) params.buyer_entity_id = buyerEntityId;
      if (status) params.status = status;

      initialize(params).catch(error => {
        if (isMounted) {
          console.error('Error initializing syndicate transactions:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, syndicateId, sellerEntityId, buyerEntityId, status, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<SyndicateTransactionsContextType>(() => ({
    transactions,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  }), [
    transactions,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  ]);

  return (
    <SyndicateTransactionsContext.Provider value={contextValue}>
      {children}
    </SyndicateTransactionsContext.Provider>
  );
}

/**
 * Default export
 */
export default SyndicateTransactionsProvider;
