'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useCashFlowStatementsStore } from '@/modules/assetmanager/store/cash-flow-statements.store';
import type { CashFlowStatement } from '@/modules/assetmanager/schemas/cash-flow-statements.schemas';

export interface CashFlowStatementsContextType {
  cashFlowStatements: CashFlowStatement[];
  selectedCashFlowStatement: CashFlowStatement | null;
  isLoading: boolean;
  error: string | null;
  fetchCashFlowStatements: (companyId?: number) => Promise<boolean>;
  fetchCashFlowStatement: (id: number) => Promise<boolean>;
  setSelectedCashFlowStatement: (cashFlowStatement: CashFlowStatement | null) => void;
  clearError: () => void;
}

const CashFlowStatementsContext = createContext<CashFlowStatementsContextType | null>(null);

export function CashFlowStatementsProvider({ 
  children,
  initialFetch = true,
  companyId
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
  companyId?: number;
}) {
  const {
    cashFlowStatements, selectedCashFlowStatement, isLoading, error,
    fetchCashFlowStatements, fetchCashFlowStatement, setSelectedCashFlowStatement, clearError
  } = useCashFlowStatementsStore();
  
  useEffect(() => {
    let isMounted = true;
    if (initialFetch) {
      fetchCashFlowStatements(companyId).catch(error => {
        if (isMounted) console.error('Error fetching cash flow statements:', error);
      });
    }
    return () => { isMounted = false; };
  }, [initialFetch, companyId, fetchCashFlowStatements]);
  
  const contextValue = useMemo<CashFlowStatementsContextType>(() => ({
    cashFlowStatements, selectedCashFlowStatement, isLoading, error,
    fetchCashFlowStatements, fetchCashFlowStatement, setSelectedCashFlowStatement, clearError
  }), [cashFlowStatements, selectedCashFlowStatement, isLoading, error, fetchCashFlowStatements, fetchCashFlowStatement, setSelectedCashFlowStatement, clearError]);
  
  return (
    <CashFlowStatementsContext.Provider value={contextValue}>
      {children}
    </CashFlowStatementsContext.Provider>
  );
}

export function useCashFlowStatementsContext(): CashFlowStatementsContextType {
  const context = useContext(CashFlowStatementsContext);
  if (!context) {
    throw new Error('useCashFlowStatementsContext must be used within a CashFlowStatementsProvider');
  }
  return context;
}