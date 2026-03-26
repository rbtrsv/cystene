'use client';

import { useIncomeStatementsContext } from '@/modules/assetmanager/providers/income-statements-provider';
import { useIncomeStatementsStore } from '@/modules/assetmanager/store/income-statements.store';
import type { IncomeStatement, FinancialScenario, CreateIncomeStatementInput, UpdateIncomeStatementInput } from '@/modules/assetmanager/schemas/income-statements.schemas';

export function useIncomeStatements() {
  // Get data from context
  const {
    incomeStatements, selectedIncomeStatement, isLoading: contextLoading, error: contextError,
    fetchIncomeStatements, fetchIncomeStatement, setSelectedIncomeStatement, clearError: clearContextError
  } = useIncomeStatementsContext();

  // Get actions from store
  const {
    createIncomeStatement, updateIncomeStatement, error: storeError, isLoading: storeLoading,
    clearError: clearStoreError, getIncomeStatementsByCompany, getIncomeStatementsByYear, 
    getIncomeStatementsByScenario
  } = useIncomeStatementsStore();

  // Combine states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Wrapper functions for consistent API
  const addIncomeStatement = async (data: CreateIncomeStatementInput): Promise<boolean> => {
    return await createIncomeStatement(data);
  };

  const editIncomeStatement = async (id: number, data: UpdateIncomeStatementInput): Promise<boolean> => {
    return await updateIncomeStatement(id, data);
  };

  return {
    // State
    incomeStatements, selectedIncomeStatement, isLoading, error,
    
    // Actions
    fetchIncomeStatements, fetchIncomeStatement, addIncomeStatement, editIncomeStatement, 
    setSelectedIncomeStatement, clearError,
    
    // Helpers
    hasIncomeStatements: () => incomeStatements.length > 0,
    getIncomeStatementById: (id: number) => incomeStatements.find(is => is.id === id),
    getIncomeStatementsByCompany: (companyId: number) => getIncomeStatementsByCompany(companyId),
    getIncomeStatementsByYear: (year: number) => getIncomeStatementsByYear(year),
    getIncomeStatementsByScenario: (scenario: FinancialScenario) => getIncomeStatementsByScenario(scenario)
  };
}