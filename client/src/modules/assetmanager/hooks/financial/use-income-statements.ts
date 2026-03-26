'use client';

import { useContext } from 'react';
import { IncomeStatementContext, IncomeStatementContextType } from '../../providers/financial/income-statement-provider';
import { useIncomeStatementStore } from '../../store/financial/income-statement.store';
import {
  type IncomeStatement,
  type CreateIncomeStatement,
  type UpdateIncomeStatement,
} from '../../schemas/financial/income-statement.schemas';
import { ListIncomeStatementsParams } from '../../service/financial/income-statement.service';

/**
 * Hook to use the income statements context
 * @throws Error if used outside of the provider
 */
export function useIncomeStatementContext(): IncomeStatementContextType {
  const context = useContext(IncomeStatementContext);

  if (!context) {
    throw new Error('useIncomeStatementContext must be used within a IncomeStatementProvider');
  }

  return context;
}

/**
 * Custom hook that combines income statements context and store
 * to provide a simplified interface for income statements functionality
 *
 * @returns Income Statements utilities and state
 */
export function useIncomeStatements() {
  // Get data from income statement context
  const {
    incomeStatements,
    activeIncomeStatementId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveIncomeStatement,
    clearError: clearContextError,
  } = useIncomeStatementContext();

  // Get additional actions from income statement store
  const {
    fetchIncomeStatements,
    fetchIncomeStatement,
    createIncomeStatement,
    updateIncomeStatement,
    deleteIncomeStatement,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useIncomeStatementStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active income statement
  const activeIncomeStatement = incomeStatements.find((item: IncomeStatement) => item.id === activeIncomeStatementId) || null;

  return {
    // State
    incomeStatements,
    activeIncomeStatementId,
    activeIncomeStatement,
    isLoading,
    error,
    isInitialized,

    // Income statement actions
    fetchIncomeStatements,
    fetchIncomeStatement,
    createIncomeStatement,
    updateIncomeStatement,
    deleteIncomeStatement,
    setActiveIncomeStatement,
    initialize,
    clearError,

    // Helper methods
    getIncomeStatementById: (id: number) => {
      return incomeStatements.find((item: IncomeStatement) => item.id === id);
    },
    getIncomeStatementsByEntity: (entityId: number) => {
      return incomeStatements.filter((item: IncomeStatement) => item.entity_id === entityId);
    },

    // Convenience wrapper functions
    fetchIncomeStatementsWithFilters: async (filters: ListIncomeStatementsParams) => {
      return await fetchIncomeStatements(filters);
    },
    createIncomeStatementWithData: async (data: CreateIncomeStatement) => {
      return await createIncomeStatement(data);
    },
    updateIncomeStatementWithData: async (id: number, data: UpdateIncomeStatement) => {
      return await updateIncomeStatement(id, data);
    },
  };
}

export default useIncomeStatements;
