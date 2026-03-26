'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type PortfolioCashFlow, 
  type PortfolioCashFlowWithRelations,
  type CreatePortfolioCashFlowInput,
  type UpdatePortfolioCashFlowInput
} from '../schemas/portfolio-cash-flow.schemas';
import {
  getPortfolioCashFlows,
  getPortfolioCashFlowsWithRelations,
  getPortfolioCashFlow,
  createPortfolioCashFlow,
  updatePortfolioCashFlow,
  deletePortfolioCashFlow,
  getPortfolioCashFlowsByCompany,
  getPortfolioCashFlowsByFund,
  getPortfolioCashFlowsByRound
} from '../actions/portfolio-cash-flow.actions';

/**
 * Portfolio Cash Flow store state interface
 */
export interface PortfolioCashFlowState {
  // State
  cashFlows: PortfolioCashFlow[];
  cashFlowsWithRelations: PortfolioCashFlowWithRelations[];
  selectedCashFlow: PortfolioCashFlow | null;
  isLoading: boolean;
  error: string | null;
  
  // Cash flow actions
  fetchCashFlows: () => Promise<void>;
  fetchCashFlowsWithRelations: () => Promise<void>;
  fetchCashFlow: (id: number) => Promise<void>;
  addCashFlow: (data: CreatePortfolioCashFlowInput) => Promise<boolean>;
  editCashFlow: (id: number, data: UpdatePortfolioCashFlowInput) => Promise<boolean>;
  removeCashFlow: (id: number) => Promise<boolean>;
  
  // Filter actions
  fetchCashFlowsByCompany: (companyId: number) => Promise<void>;
  fetchCashFlowsByFund: (fundId: number) => Promise<void>;
  fetchCashFlowsByRound: (roundId: number) => Promise<void>;
  
  // Utility actions
  setSelectedCashFlow: (cashFlow: PortfolioCashFlow | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create portfolio cash flow store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const usePortfolioCashFlowStore = create<PortfolioCashFlowState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        cashFlows: [],
        cashFlowsWithRelations: [],
        selectedCashFlow: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch all portfolio cash flows
         */
        fetchCashFlows: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getPortfolioCashFlows();
            
            if (response.success && response.data) {
              set((state) => {
                state.cashFlows = response.data || [];
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch portfolio cash flows'
              });
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
          }
        },
        
        /**
         * Fetch all portfolio cash flows with relations (company, fund, round details)
         */
        fetchCashFlowsWithRelations: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getPortfolioCashFlowsWithRelations();
            
            if (response.success && response.data) {
              set((state) => {
                state.cashFlowsWithRelations = response.data || [];
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch portfolio cash flows with relations'
              });
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
          }
        },
        
        /**
         * Fetch a single portfolio cash flow by ID
         */
        fetchCashFlow: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getPortfolioCashFlow(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedCashFlow = response.data || null;
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch portfolio cash flow'
              });
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
          }
        },
        
        /**
         * Create a new portfolio cash flow
         */
        addCashFlow: async (data: CreatePortfolioCashFlowInput): Promise<boolean> => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await createPortfolioCashFlow(data);
            
            if (response.success && response.data) {
              set((state) => {
                state.cashFlows.push(response.data);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create portfolio cash flow'
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
         * Update an existing portfolio cash flow
         */
        editCashFlow: async (id: number, data: UpdatePortfolioCashFlowInput): Promise<boolean> => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updatePortfolioCashFlow(id, data);
            
            if (response.success && response.data) {
              set((state) => {
                const index = state.cashFlows.findIndex(cf => cf.id === id);
                if (index !== -1) {
                  state.cashFlows[index] = response.data;
                }
                if (state.selectedCashFlow?.id === id) {
                  state.selectedCashFlow = response.data;
                }
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update portfolio cash flow'
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
         * Delete a portfolio cash flow
         */
        removeCashFlow: async (id: number): Promise<boolean> => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await deletePortfolioCashFlow(id);
            
            if (response.success) {
              set((state) => {
                state.cashFlows = state.cashFlows.filter(cf => cf.id !== id);
                if (state.selectedCashFlow?.id === id) {
                  state.selectedCashFlow = null;
                }
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete portfolio cash flow'
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
         * Fetch portfolio cash flows by company
         */
        fetchCashFlowsByCompany: async (companyId: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getPortfolioCashFlowsByCompany(companyId);
            
            if (response.success && response.data) {
              set((state) => {
                state.cashFlows = response.data || [];
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch portfolio cash flows by company'
              });
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
          }
        },
        
        /**
         * Fetch portfolio cash flows by fund
         */
        fetchCashFlowsByFund: async (fundId: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getPortfolioCashFlowsByFund(fundId);
            
            if (response.success && response.data) {
              set((state) => {
                state.cashFlows = response.data || [];
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch portfolio cash flows by fund'
              });
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
          }
        },
        
        /**
         * Fetch portfolio cash flows by round
         */
        fetchCashFlowsByRound: async (roundId: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getPortfolioCashFlowsByRound(roundId);
            
            if (response.success && response.data) {
              set((state) => {
                state.cashFlows = response.data || [];
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch portfolio cash flows by round'
              });
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
          }
        },
        
        /**
         * Set the selected portfolio cash flow
         */
        setSelectedCashFlow: (cashFlow: PortfolioCashFlow | null) => {
          set({ selectedCashFlow: cashFlow });
        },
        
        /**
         * Clear any errors
         */
        clearError: () => {
          set({ error: null });
        },
        
        /**
         * Reset the store to initial state
         */
        reset: () => {
          set({
            cashFlows: [],
            cashFlowsWithRelations: [],
            selectedCashFlow: null,
            isLoading: false,
            error: null
          });
        }
      })),
      {
        name: 'portfolio-cash-flow-store',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    ),
    {
      name: 'Portfolio Cash Flow Store'
    }
  )
);
