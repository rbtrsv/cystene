'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type CashFlowStatement, 
  type CreateCashFlowStatementInput, 
  type UpdateCashFlowStatementInput,
  type FinancialScenario 
} from '@/modules/assetmanager/schemas/cash-flow-statements.schemas';
import {
  getCashFlowStatements,
  getCashFlowStatement,
  createCashFlowStatement as apiCreateCashFlowStatement,
  updateCashFlowStatement as apiUpdateCashFlowStatement
} from '@/modules/assetmanager/actions/cash-flow-statements.actions';

/**
 * Cash flow statements store state interface
 */
export interface CashFlowStatementsState {
  // State
  cashFlowStatements: CashFlowStatement[];
  selectedCashFlowStatement: CashFlowStatement | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCashFlowStatements: (companyId?: number) => Promise<boolean>;
  fetchCashFlowStatement: (id: number) => Promise<boolean>;
  createCashFlowStatement: (data: CreateCashFlowStatementInput) => Promise<boolean>;
  updateCashFlowStatement: (id: number, data: UpdateCashFlowStatementInput) => Promise<boolean>;
  setSelectedCashFlowStatement: (cashFlowStatement: CashFlowStatement | null) => void;
  clearError: () => void;
  reset: () => void;
  
  // Helper methods
  getCashFlowStatementsByCompany: (companyId: number) => CashFlowStatement[];
  getCashFlowStatementsByYear: (year: number) => CashFlowStatement[];
  getCashFlowStatementsByScenario: (scenario: FinancialScenario) => CashFlowStatement[];
}

/**
 * Create cash flow statements store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useCashFlowStatementsStore = create<CashFlowStatementsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        cashFlowStatements: [],
        selectedCashFlowStatement: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch cash flow statements (optionally filtered by company)
         */
        fetchCashFlowStatements: async (companyId?: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getCashFlowStatements(companyId);
            
            if (response.success && response.data) {
              set((state) => {
                state.cashFlowStatements = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch cash flow statements'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Fetch a single cash flow statement by ID
         */
        fetchCashFlowStatement: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getCashFlowStatement(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedCashFlowStatement = response.data!;
                
                // Update in the list if it exists
                const index = state.cashFlowStatements.findIndex(cfs => cfs.id === id);
                if (index !== -1) {
                  state.cashFlowStatements[index] = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch cash flow statement'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Create a new cash flow statement
         */
        createCashFlowStatement: async (data: CreateCashFlowStatementInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiCreateCashFlowStatement(data);
            
            if (response.success && response.data) {
              set((state) => {
                state.cashFlowStatements.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create cash flow statement'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Update an existing cash flow statement
         */
        updateCashFlowStatement: async (id: number, data: UpdateCashFlowStatementInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiUpdateCashFlowStatement(id, data);
            
            if (response.success && response.data) {
              set((state) => {
                // Update in the list
                const index = state.cashFlowStatements.findIndex(cfs => cfs.id === id);
                if (index !== -1) {
                  state.cashFlowStatements[index] = response.data!;
                }
                
                // Update selected if it's the same
                if (state.selectedCashFlowStatement?.id === id) {
                  state.selectedCashFlowStatement = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update cash flow statement'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Set the selected cash flow statement
         */
        setSelectedCashFlowStatement: (cashFlowStatement: CashFlowStatement | null) => {
          set({ selectedCashFlowStatement: cashFlowStatement });
        },
        
        /**
         * Clear any error state
         */
        clearError: () => {
          set({ error: null });
        },
        
        /**
         * Reset the entire store to initial state
         */
        reset: () => {
          set({ 
            cashFlowStatements: [], 
            selectedCashFlowStatement: null, 
            isLoading: false, 
            error: null 
          });
        },
        
        // Helper methods
        getCashFlowStatementsByCompany: (companyId: number) => {
          return get().cashFlowStatements.filter(cfs => cfs.companyId === companyId);
        },
        
        getCashFlowStatementsByYear: (year: number) => {
          return get().cashFlowStatements.filter(cfs => cfs.year === year);
        },
        
        getCashFlowStatementsByScenario: (scenario: FinancialScenario) => {
          return get().cashFlowStatements.filter(cfs => cfs.scenario === scenario);
        },
      })),
      {
        name: 'cash-flow-statements-storage',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    )
  )
);