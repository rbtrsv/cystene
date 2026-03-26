'use client';

import { useCashFlowStatementsContext } from '@/modules/assetmanager/providers/cash-flow-statements-provider';
import { useCashFlowStatementsStore } from '@/modules/assetmanager/store/cash-flow-statements.store';
import type { CashFlowStatement, FinancialScenario, CreateCashFlowStatementInput, UpdateCashFlowStatementInput } from '@/modules/assetmanager/schemas/cash-flow-statements.schemas';

export function useCashFlowStatements() {
  // Get data from context
  const {
    cashFlowStatements, selectedCashFlowStatement, isLoading: contextLoading, error: contextError,
    fetchCashFlowStatements, fetchCashFlowStatement, setSelectedCashFlowStatement, clearError: clearContextError
  } = useCashFlowStatementsContext();

  // Get actions from store
  const {
    createCashFlowStatement, updateCashFlowStatement, error: storeError, isLoading: storeLoading,
    clearError: clearStoreError, getCashFlowStatementsByCompany, getCashFlowStatementsByYear, 
    getCashFlowStatementsByScenario
  } = useCashFlowStatementsStore();

  // Combine states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Wrapper functions for consistent API
  const addCashFlowStatement = async (data: CreateCashFlowStatementInput): Promise<boolean> => {
    return await createCashFlowStatement(data);
  };

  const editCashFlowStatement = async (id: number, data: UpdateCashFlowStatementInput): Promise<boolean> => {
    return await updateCashFlowStatement(id, data);
  };

  return {
    // State
    cashFlowStatements, selectedCashFlowStatement, isLoading, error,
    
    // Actions
    fetchCashFlowStatements, fetchCashFlowStatement, addCashFlowStatement, editCashFlowStatement, 
    setSelectedCashFlowStatement, clearError,
    
    // Helpers
    hasCashFlowStatements: () => cashFlowStatements.length > 0,
    getCashFlowStatementById: (id: number) => cashFlowStatements.find(cfs => cfs.id === id),
    getCashFlowStatementsByCompany: (companyId: number) => getCashFlowStatementsByCompany(companyId),
    getCashFlowStatementsByYear: (year: number) => getCashFlowStatementsByYear(year),
    getCashFlowStatementsByScenario: (scenario: FinancialScenario) => getCashFlowStatementsByScenario(scenario)
  };
}