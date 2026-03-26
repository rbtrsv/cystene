'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useBalanceSheetsStore } from '@/modules/assetmanager/store/balance-sheets.store';
import type { BalanceSheet } from '@/modules/assetmanager/schemas/balance-sheets.schemas';

export interface BalanceSheetsContextType {
  balanceSheets: BalanceSheet[];
  selectedBalanceSheet: BalanceSheet | null;
  isLoading: boolean;
  error: string | null;
  fetchBalanceSheets: (companyId?: number) => Promise<boolean>;
  fetchBalanceSheet: (id: number) => Promise<boolean>;
  setSelectedBalanceSheet: (balanceSheet: BalanceSheet | null) => void;
  clearError: () => void;
}

const BalanceSheetsContext = createContext<BalanceSheetsContextType | null>(null);

export function BalanceSheetsProvider({ 
  children,
  initialFetch = true,
  companyId
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
  companyId?: number;
}) {
  const {
    balanceSheets, selectedBalanceSheet, isLoading, error,
    fetchBalanceSheets, fetchBalanceSheet, setSelectedBalanceSheet, clearError
  } = useBalanceSheetsStore();
  
  useEffect(() => {
    let isMounted = true;
    if (initialFetch) {
      fetchBalanceSheets(companyId).catch(error => {
        if (isMounted) console.error('Error fetching balance sheets:', error);
      });
    }
    return () => { isMounted = false; };
  }, [initialFetch, companyId, fetchBalanceSheets]);
  
  const contextValue = useMemo<BalanceSheetsContextType>(() => ({
    balanceSheets, selectedBalanceSheet, isLoading, error,
    fetchBalanceSheets, fetchBalanceSheet, setSelectedBalanceSheet, clearError
  }), [balanceSheets, selectedBalanceSheet, isLoading, error, fetchBalanceSheets, fetchBalanceSheet, setSelectedBalanceSheet, clearError]);
  
  return (
    <BalanceSheetsContext.Provider value={contextValue}>
      {children}
    </BalanceSheetsContext.Provider>
  );
}

export function useBalanceSheetsContext(): BalanceSheetsContextType {
  const context = useContext(BalanceSheetsContext);
  if (!context) {
    throw new Error('useBalanceSheetsContext must be used within a BalanceSheetsProvider');
  }
  return context;
}