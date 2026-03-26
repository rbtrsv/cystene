'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type IncomeStatement, 
  type CreateIncomeStatementInput, 
  type UpdateIncomeStatementInput,
  type FinancialScenario 
} from '@/modules/assetmanager/schemas/income-statements.schemas';
import {
  getIncomeStatements,
  getIncomeStatement,
  createIncomeStatement as apiCreateIncomeStatement,
  updateIncomeStatement as apiUpdateIncomeStatement
} from '@/modules/assetmanager/actions/income-statements.actions';

/**
 * Income statements store state interface
 */
export interface IncomeStatementsState {
  // State
  incomeStatements: IncomeStatement[];
  selectedIncomeStatement: IncomeStatement | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchIncomeStatements: (companyId?: number) => Promise<boolean>;
  fetchIncomeStatement: (id: number) => Promise<boolean>;
  createIncomeStatement: (data: CreateIncomeStatementInput) => Promise<boolean>;
  updateIncomeStatement: (id: number, data: UpdateIncomeStatementInput) => Promise<boolean>;
  setSelectedIncomeStatement: (incomeStatement: IncomeStatement | null) => void;
  clearError: () => void;
  reset: () => void;
  
  // Helper methods
  getIncomeStatementsByCompany: (companyId: number) => IncomeStatement[];
  getIncomeStatementsByYear: (year: number) => IncomeStatement[];
  getIncomeStatementsByScenario: (scenario: FinancialScenario) => IncomeStatement[];
}

/**
 * Create income statements store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useIncomeStatementsStore = create<IncomeStatementsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        incomeStatements: [],
        selectedIncomeStatement: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch income statements (optionally filtered by company)
         */
        fetchIncomeStatements: async (companyId?: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getIncomeStatements(companyId);
            
            if (response.success && response.data) {
              set((state) => {
                state.incomeStatements = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch income statements'
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
         * Fetch a single income statement by ID
         */
        fetchIncomeStatement: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getIncomeStatement(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedIncomeStatement = response.data!;
                
                // Update in the list if it exists
                const index = state.incomeStatements.findIndex(is => is.id === id);
                if (index !== -1) {
                  state.incomeStatements[index] = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch income statement'
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
         * Create a new income statement
         */
        createIncomeStatement: async (data: CreateIncomeStatementInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiCreateIncomeStatement(data);
            
            if (response.success && response.data) {
              set((state) => {
                state.incomeStatements.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create income statement'
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
         * Update an existing income statement
         */
        updateIncomeStatement: async (id: number, data: UpdateIncomeStatementInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiUpdateIncomeStatement(id, data);
            
            if (response.success && response.data) {
              set((state) => {
                // Update in the list
                const index = state.incomeStatements.findIndex(is => is.id === id);
                if (index !== -1) {
                  state.incomeStatements[index] = response.data!;
                }
                
                // Update selected if it's the same
                if (state.selectedIncomeStatement?.id === id) {
                  state.selectedIncomeStatement = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update income statement'
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
         * Set the selected income statement
         */
        setSelectedIncomeStatement: (incomeStatement: IncomeStatement | null) => {
          set({ selectedIncomeStatement: incomeStatement });
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
            incomeStatements: [], 
            selectedIncomeStatement: null, 
            isLoading: false, 
            error: null 
          });
        },
        
        // Helper methods
        getIncomeStatementsByCompany: (companyId: number) => {
          return get().incomeStatements.filter(is => is.companyId === companyId);
        },
        
        getIncomeStatementsByYear: (year: number) => {
          return get().incomeStatements.filter(is => is.year === year);
        },
        
        getIncomeStatementsByScenario: (scenario: FinancialScenario) => {
          return get().incomeStatements.filter(is => is.scenario === scenario);
        },
      })),
      {
        name: 'income-statements-storage',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    )
  )
);