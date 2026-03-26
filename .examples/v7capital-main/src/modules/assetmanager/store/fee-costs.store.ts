'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type FeeCost, 
  type CreateFeeCostInput, 
  type UpdateFeeCostInput 
} from '../schemas/fee-costs.schemas';
import {
  getFeeCosts,
  getFeeCost,
  createFeeCost,
  updateFeeCost,
  deleteFeeCost
} from '../actions/fee-costs.actions';

/**
 * Fee Costs store state interface
 */
export interface FeeCostsState {
  // State
  feeCosts: FeeCost[];
  selectedFeeCost: FeeCost | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchFeeCosts: () => Promise<boolean>;
  fetchFeeCost: (id: number) => Promise<boolean>;
  createFeeCost: (data: CreateFeeCostInput) => Promise<boolean>;
  updateFeeCost: (id: number, data: UpdateFeeCostInput) => Promise<boolean>;
  deleteFeeCost: (id: number) => Promise<boolean>;
  setSelectedFeeCost: (feeCost: FeeCost | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create fee costs store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useFeeCostsStore = create<FeeCostsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        feeCosts: [],
        selectedFeeCost: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch all fee costs
         */
        fetchFeeCosts: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getFeeCosts();
            
            if (response.success && response.data) {
              set((state) => {
                state.feeCosts = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch fee costs'
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
         * Fetch a single fee cost by ID
         */
        fetchFeeCost: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getFeeCost(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedFeeCost = response.data!;
                
                // Update in the list if it exists
                const index = state.feeCosts.findIndex(fc => fc.id === id);
                if (index !== -1) {
                  state.feeCosts[index] = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch fee cost'
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
         * Create a new fee cost
         */
        createFeeCost: async (data: CreateFeeCostInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await createFeeCost(data);
            
            if (response.success && response.data) {
              set((state) => {
                state.feeCosts.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create fee cost'
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
         * Update an existing fee cost
         */
        updateFeeCost: async (id: number, data: UpdateFeeCostInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updateFeeCost(id, data);
            
            if (response.success && response.data) {
              set((state) => {
                // Update in the list
                const index = state.feeCosts.findIndex(fc => fc.id === id);
                if (index !== -1) {
                  state.feeCosts[index] = response.data!;
                }
                
                // Update selected if it's the same
                if (state.selectedFeeCost?.id === id) {
                  state.selectedFeeCost = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update fee cost'
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
         * Delete a fee cost
         */
        deleteFeeCost: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await deleteFeeCost(id);
            
            if (response.success) {
              set((state) => {
                state.feeCosts = state.feeCosts.filter(fc => fc.id !== id);
                
                // Clear selected if it's the same
                if (state.selectedFeeCost?.id === id) {
                  state.selectedFeeCost = null;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete fee cost'
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
         * Set the selected fee cost
         */
        setSelectedFeeCost: (feeCost: FeeCost | null) => {
          set({ selectedFeeCost: feeCost });
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
            feeCosts: [], 
            selectedFeeCost: null, 
            isLoading: false, 
            error: null 
          });
        }
      })),
      {
        name: 'fee-costs-storage',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    )
  )
);