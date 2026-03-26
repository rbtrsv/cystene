'use client';

import { useBalanceSheetsContext } from '@/modules/assetmanager/providers/balance-sheets-provider';
import { useBalanceSheetsStore } from '@/modules/assetmanager/store/balance-sheets.store';
import type { BalanceSheet, FinancialScenario, CreateBalanceSheetInput, UpdateBalanceSheetInput } from '@/modules/assetmanager/schemas/balance-sheets.schemas';

export function useBalanceSheets() {
  // Get data from context
  const {
    balanceSheets, selectedBalanceSheet, isLoading: contextLoading, error: contextError,
    fetchBalanceSheets, fetchBalanceSheet, setSelectedBalanceSheet, clearError: clearContextError
  } = useBalanceSheetsContext();

  // Get actions from store
  const {
    createBalanceSheet, updateBalanceSheet, deleteBalanceSheet, error: storeError, isLoading: storeLoading,
    clearError: clearStoreError, getBalanceSheetsByCompany, getBalanceSheetsByYear, 
    getBalanceSheetsByScenario
  } = useBalanceSheetsStore();

  // Combine states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Wrapper functions for consistent API
  const addBalanceSheet = async (data: CreateBalanceSheetInput): Promise<boolean> => {
    return await createBalanceSheet(data);
  };

  const editBalanceSheet = async (id: number, data: UpdateBalanceSheetInput): Promise<boolean> => {
    return await updateBalanceSheet(id, data);
  };

  return {
    // State
    balanceSheets, selectedBalanceSheet, isLoading, error,
    
    // Actions
    fetchBalanceSheets, fetchBalanceSheet, addBalanceSheet, editBalanceSheet, deleteBalanceSheet,
    setSelectedBalanceSheet, clearError,
    
    // Helpers
    hasBalanceSheets: () => balanceSheets.length > 0,
    getBalanceSheetById: (id: number) => balanceSheets.find(bs => bs.id === id),
    getBalanceSheetsByCompany: (companyId: number) => getBalanceSheetsByCompany(companyId),
    getBalanceSheetsByYear: (year: number) => getBalanceSheetsByYear(year),
    getBalanceSheetsByScenario: (scenario: FinancialScenario) => getBalanceSheetsByScenario(scenario),
    
    // Utility methods
    formatCurrency: (amount: number, currency: string = 'USD'): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    },
    
    formatDate: (date: Date | string): string => {
      if (!date) return 'N/A';
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };
}