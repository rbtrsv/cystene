'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type FinancialRatios, 
  type CreateFinancialRatiosInput, 
  type UpdateFinancialRatiosInput 
} from '../schemas/financial-ratios.schemas';
import {
  getFinancialRatios,
  getFinancialRatio,
  createFinancialRatios,
  updateFinancialRatios,
  deleteFinancialRatios
} from '../actions/financial-ratios.actions';

/**
 * Financial Ratios store state interface
 */
export interface FinancialRatiosState {
  // State
  financialRatios: FinancialRatios[];
  selectedFinancialRatio: FinancialRatios | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchFinancialRatios: (companyId?: number) => Promise<boolean>;
  fetchFinancialRatio: (id: number) => Promise<boolean>;
  createFinancialRatio: (data: CreateFinancialRatiosInput) => Promise<boolean>;
  updateFinancialRatio: (id: number, data: UpdateFinancialRatiosInput) => Promise<boolean>;
  deleteFinancialRatio: (id: number) => Promise<boolean>;
  setSelectedFinancialRatio: (financialRatio: FinancialRatios | null) => void;
  clearError: () => void;
  reset: () => void;
  
  // Helper methods
  getFinancialRatiosByCompany: (companyId: number) => FinancialRatios[];
}

/**
 * Create financial ratios store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useFinancialRatiosStore = create<FinancialRatiosState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        financialRatios: [],
        selectedFinancialRatio: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch financial ratios (optionally filtered by company)
         */
        fetchFinancialRatios: async (companyId?: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getFinancialRatios(companyId);
            
            if (response.success && response.data) {
              set((state) => {
                state.financialRatios = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch financial ratios'
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
         * Fetch a single financial ratio by ID
         */
        fetchFinancialRatio: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getFinancialRatio(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedFinancialRatio = response.data!;
                
                // Update in the list if it exists
                const index = state.financialRatios.findIndex(fr => fr.id === id);
                if (index !== -1) {
                  state.financialRatios[index] = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch financial ratio'
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
         * Create a new financial ratio
         */
        createFinancialRatio: async (data: CreateFinancialRatiosInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await createFinancialRatios(data);
            
            if (response.success && response.data) {
              set((state) => {
                state.financialRatios.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create financial ratio'
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
         * Update an existing financial ratio
         */
        updateFinancialRatio: async (id: number, data: UpdateFinancialRatiosInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updateFinancialRatios(id, data);
            
            if (response.success && response.data) {
              set((state) => {
                // Update in the list
                const index = state.financialRatios.findIndex(fr => fr.id === id);
                if (index !== -1) {
                  state.financialRatios[index] = response.data!;
                }
                
                // Update selected if it's the same
                if (state.selectedFinancialRatio?.id === id) {
                  state.selectedFinancialRatio = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update financial ratio'
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
         * Delete a financial ratio
         */
        deleteFinancialRatio: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await deleteFinancialRatios(id);
            
            if (response.success) {
              set((state) => {
                state.financialRatios = state.financialRatios.filter(fr => fr.id !== id);
                
                // Clear selected if it's the same
                if (state.selectedFinancialRatio?.id === id) {
                  state.selectedFinancialRatio = null;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete financial ratio'
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
         * Set the selected financial ratio
         */
        setSelectedFinancialRatio: (financialRatio: FinancialRatios | null) => {
          set({ selectedFinancialRatio: financialRatio });
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
            financialRatios: [], 
            selectedFinancialRatio: null, 
            isLoading: false, 
            error: null 
          });
        },
        
        // Helper methods
        getFinancialRatiosByCompany: (companyId: number) => {
          return get().financialRatios.filter(fr => fr.companyId === companyId);
        }
      })),
      {
        name: 'financial-ratios-storage',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    )
  )
);