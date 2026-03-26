'use client';

import { useContext } from 'react';
import { BalanceSheetContext, BalanceSheetContextType } from '../../providers/financial/balance-sheet-provider';
import { useBalanceSheetStore } from '../../store/financial/balance-sheet.store';
import {
  type BalanceSheet,
  type CreateBalanceSheet,
  type UpdateBalanceSheet,
} from '../../schemas/financial/balance-sheet.schemas';
import { ListBalanceSheetsParams } from '../../service/financial/balance-sheet.service';

/**
 * Hook to use the balance sheets context
 * @throws Error if used outside of the provider
 */
export function useBalanceSheetContext(): BalanceSheetContextType {
  const context = useContext(BalanceSheetContext);

  if (!context) {
    throw new Error('useBalanceSheetContext must be used within a BalanceSheetProvider');
  }

  return context;
}

/**
 * Custom hook that combines balance sheets context and store
 * to provide a simplified interface for balance sheets functionality
 *
 * @returns Balance Sheets utilities and state
 */
export function useBalanceSheets() {
  // Get data from balance sheet context
  const {
    balanceSheets,
    activeBalanceSheetId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveBalanceSheet,
    clearError: clearContextError,
  } = useBalanceSheetContext();

  // Get additional actions from balance sheet store
  const {
    fetchBalanceSheets,
    fetchBalanceSheet,
    createBalanceSheet,
    updateBalanceSheet,
    deleteBalanceSheet,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useBalanceSheetStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active balance sheet
  const activeBalanceSheet = balanceSheets.find((item: BalanceSheet) => item.id === activeBalanceSheetId) || null;

  return {
    // State
    balanceSheets,
    activeBalanceSheetId,
    activeBalanceSheet,
    isLoading,
    error,
    isInitialized,

    // Balance sheet actions
    fetchBalanceSheets,
    fetchBalanceSheet,
    createBalanceSheet,
    updateBalanceSheet,
    deleteBalanceSheet,
    setActiveBalanceSheet,
    initialize,
    clearError,

    // Helper methods
    getBalanceSheetById: (id: number) => {
      return balanceSheets.find((item: BalanceSheet) => item.id === id);
    },
    getBalanceSheetsByEntity: (entityId: number) => {
      return balanceSheets.filter((item: BalanceSheet) => item.entity_id === entityId);
    },

    // Convenience wrapper functions
    fetchBalanceSheetsWithFilters: async (filters: ListBalanceSheetsParams) => {
      return await fetchBalanceSheets(filters);
    },
    createBalanceSheetWithData: async (data: CreateBalanceSheet) => {
      return await createBalanceSheet(data);
    },
    updateBalanceSheetWithData: async (id: number, data: UpdateBalanceSheet) => {
      return await updateBalanceSheet(id, data);
    },
  };
}

export default useBalanceSheets;
