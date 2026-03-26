'use client';

import { useContext } from 'react';
import { CashFlowStatementContext, CashFlowStatementContextType } from '../../providers/financial/cash-flow-statement-provider';
import { useCashFlowStatementStore } from '../../store/financial/cash-flow-statement.store';
import {
  type CashFlowStatement,
  type CreateCashFlowStatement,
  type UpdateCashFlowStatement,
} from '../../schemas/financial/cash-flow-statement.schemas';
import { ListCashFlowStatementsParams } from '../../service/financial/cash-flow-statement.service';

/**
 * Hook to use the cash flow statements context
 * @throws Error if used outside of the provider
 */
export function useCashFlowStatementContext(): CashFlowStatementContextType {
  const context = useContext(CashFlowStatementContext);

  if (!context) {
    throw new Error('useCashFlowStatementContext must be used within a CashFlowStatementProvider');
  }

  return context;
}

/**
 * Custom hook that combines cash flow statements context and store
 * to provide a simplified interface for cash flow statements functionality
 *
 * @returns Cash Flow Statements utilities and state
 */
export function useCashFlowStatements() {
  // Get data from cash flow statement context
  const {
    cashFlowStatements,
    activeCashFlowStatementId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveCashFlowStatement,
    clearError: clearContextError,
  } = useCashFlowStatementContext();

  // Get additional actions from cash flow statement store
  const {
    fetchCashFlowStatements,
    fetchCashFlowStatement,
    createCashFlowStatement,
    updateCashFlowStatement,
    deleteCashFlowStatement,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useCashFlowStatementStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active cash flow statement
  const activeCashFlowStatement = cashFlowStatements.find((item: CashFlowStatement) => item.id === activeCashFlowStatementId) || null;

  return {
    // State
    cashFlowStatements,
    activeCashFlowStatementId,
    activeCashFlowStatement,
    isLoading,
    error,
    isInitialized,

    // Cash flow statement actions
    fetchCashFlowStatements,
    fetchCashFlowStatement,
    createCashFlowStatement,
    updateCashFlowStatement,
    deleteCashFlowStatement,
    setActiveCashFlowStatement,
    initialize,
    clearError,

    // Helper methods
    getCashFlowStatementById: (id: number) => {
      return cashFlowStatements.find((item: CashFlowStatement) => item.id === id);
    },
    getCashFlowStatementsByEntity: (entityId: number) => {
      return cashFlowStatements.filter((item: CashFlowStatement) => item.entity_id === entityId);
    },

    // Convenience wrapper functions
    fetchCashFlowStatementsWithFilters: async (filters: ListCashFlowStatementsParams) => {
      return await fetchCashFlowStatements(filters);
    },
    createCashFlowStatementWithData: async (data: CreateCashFlowStatement) => {
      return await createCashFlowStatement(data);
    },
    updateCashFlowStatementWithData: async (id: number, data: UpdateCashFlowStatement) => {
      return await updateCashFlowStatement(id, data);
    },
  };
}

export default useCashFlowStatements;
