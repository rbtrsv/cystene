'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useIncomeStatementsStore } from '@/modules/assetmanager/store/income-statements.store';
import type { IncomeStatement } from '@/modules/assetmanager/schemas/income-statements.schemas';

export interface IncomeStatementsContextType {
  incomeStatements: IncomeStatement[];
  selectedIncomeStatement: IncomeStatement | null;
  isLoading: boolean;
  error: string | null;
  fetchIncomeStatements: (companyId?: number) => Promise<boolean>;
  fetchIncomeStatement: (id: number) => Promise<boolean>;
  setSelectedIncomeStatement: (incomeStatement: IncomeStatement | null) => void;
  clearError: () => void;
}

const IncomeStatementsContext = createContext<IncomeStatementsContextType | null>(null);

export function IncomeStatementsProvider({ 
  children,
  initialFetch = true,
  companyId
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
  companyId?: number;
}) {
  const {
    incomeStatements, selectedIncomeStatement, isLoading, error,
    fetchIncomeStatements, fetchIncomeStatement, setSelectedIncomeStatement, clearError
  } = useIncomeStatementsStore();
  
  useEffect(() => {
    let isMounted = true;
    if (initialFetch) {
      fetchIncomeStatements(companyId).catch(error => {
        if (isMounted) console.error('Error fetching income statements:', error);
      });
    }
    return () => { isMounted = false; };
  }, [initialFetch, companyId, fetchIncomeStatements]);
  
  const contextValue = useMemo<IncomeStatementsContextType>(() => ({
    incomeStatements, selectedIncomeStatement, isLoading, error,
    fetchIncomeStatements, fetchIncomeStatement, setSelectedIncomeStatement, clearError
  }), [incomeStatements, selectedIncomeStatement, isLoading, error, fetchIncomeStatements, fetchIncomeStatement, setSelectedIncomeStatement, clearError]);
  
  return (
    <IncomeStatementsContext.Provider value={contextValue}>
      {children}
    </IncomeStatementsContext.Provider>
  );
}

export function useIncomeStatementsContext(): IncomeStatementsContextType {
  const context = useContext(IncomeStatementsContext);
  if (!context) {
    throw new Error('useIncomeStatementsContext must be used within an IncomeStatementsProvider');
  }
  return context;
}