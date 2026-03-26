'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type BalanceSheet, 
  type CreateBalanceSheetInput, 
  type UpdateBalanceSheetInput,
  type FinancialScenario 
} from '@/modules/assetmanager/schemas/balance-sheets.schemas';
import {
  getBalanceSheets,
  getBalanceSheet,
  createBalanceSheet as apiCreateBalanceSheet,
  updateBalanceSheet as apiUpdateBalanceSheet,
  deleteBalanceSheet as apiDeleteBalanceSheet
} from '@/modules/assetmanager/actions/balance-sheets.actions';

/**
 * Balance sheets store state interface
 */
export interface BalanceSheetsState {
  // State
  balanceSheets: BalanceSheet[];
  selectedBalanceSheet: BalanceSheet | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchBalanceSheets: (companyId?: number) => Promise<boolean>;
  fetchBalanceSheet: (id: number) => Promise<boolean>;
  createBalanceSheet: (data: CreateBalanceSheetInput) => Promise<boolean>;
  updateBalanceSheet: (id: number, data: UpdateBalanceSheetInput) => Promise<boolean>;
  deleteBalanceSheet: (id: number) => Promise<boolean>;
  setSelectedBalanceSheet: (balanceSheet: BalanceSheet | null) => void;
  clearError: () => void;
  reset: () => void;
  
  // Helper methods
  getBalanceSheetsByCompany: (companyId: number) => BalanceSheet[];
  getBalanceSheetsByYear: (year: number) => BalanceSheet[];
  getBalanceSheetsByScenario: (scenario: FinancialScenario) => BalanceSheet[];
}

/**
 * Create balance sheets store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useBalanceSheetsStore = create<BalanceSheetsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        balanceSheets: [],
        selectedBalanceSheet: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch balance sheets (optionally filtered by company)
         */
        fetchBalanceSheets: async (companyId?: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getBalanceSheets(companyId);
            
            if (response.success && response.data) {
              set((state) => {
                state.balanceSheets = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch balance sheets'
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
         * Fetch a single balance sheet by ID
         */
        fetchBalanceSheet: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getBalanceSheet(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedBalanceSheet = response.data!;
                
                // Update in the list if it exists
                const index = state.balanceSheets.findIndex(bs => bs.id === id);
                if (index !== -1) {
                  state.balanceSheets[index] = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch balance sheet'
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
         * Create a new balance sheet
         */
        createBalanceSheet: async (data: CreateBalanceSheetInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiCreateBalanceSheet(data);
            
            if (response.success && response.data) {
              set((state) => {
                state.balanceSheets.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create balance sheet'
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
         * Update an existing balance sheet
         */
        updateBalanceSheet: async (id: number, data: UpdateBalanceSheetInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiUpdateBalanceSheet(id, data);
            
            if (response.success && response.data) {
              set((state) => {
                // Update in the list
                const index = state.balanceSheets.findIndex(bs => bs.id === id);
                if (index !== -1) {
                  state.balanceSheets[index] = response.data!;
                }
                
                // Update selected if it's the same
                if (state.selectedBalanceSheet?.id === id) {
                  state.selectedBalanceSheet = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update balance sheet'
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
         * Delete a balance sheet
         */
        deleteBalanceSheet: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiDeleteBalanceSheet(id);
            
            if (response.success) {
              set((state) => {
                // Remove from the list
                state.balanceSheets = state.balanceSheets.filter(bs => bs.id !== id);
                
                // Clear selected if it was the deleted one
                if (state.selectedBalanceSheet?.id === id) {
                  state.selectedBalanceSheet = null;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete balance sheet'
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
         * Set the selected balance sheet
         */
        setSelectedBalanceSheet: (balanceSheet: BalanceSheet | null) => {
          set({ selectedBalanceSheet: balanceSheet });
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
            balanceSheets: [], 
            selectedBalanceSheet: null, 
            isLoading: false, 
            error: null 
          });
        },
        
        // Helper methods
        getBalanceSheetsByCompany: (companyId: number) => {
          return get().balanceSheets.filter(bs => bs.companyId === companyId);
        },
        
        getBalanceSheetsByYear: (year: number) => {
          return get().balanceSheets.filter(bs => bs.year === year);
        },
        
        getBalanceSheetsByScenario: (scenario: FinancialScenario) => {
          return get().balanceSheets.filter(bs => bs.scenario === scenario);
        },
      })),
      {
        name: 'balance-sheets-storage',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    )
  )
);