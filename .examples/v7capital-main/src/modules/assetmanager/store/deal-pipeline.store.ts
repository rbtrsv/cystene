'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type DealPipeline, 
  type CreateDealPipelineInput, 
  type UpdateDealPipelineInput 
} from '../schemas/deal-pipeline.schemas';
import {
  getDealPipelines,
  getDealPipeline,
  createDealPipeline,
  updateDealPipeline,
  deleteDealPipeline
} from '../actions/deal-pipeline.actions';

/**
 * Deal Pipeline store state interface
 */
export interface DealPipelineState {
  // State
  dealPipelines: DealPipeline[];
  selectedDealPipeline: DealPipeline | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchDealPipelines: () => Promise<boolean>;
  fetchDealPipeline: (id: number) => Promise<boolean>;
  createDealPipeline: (data: CreateDealPipelineInput) => Promise<boolean>;
  updateDealPipeline: (id: number, data: UpdateDealPipelineInput) => Promise<boolean>;
  deleteDealPipeline: (id: number) => Promise<boolean>;
  setSelectedDealPipeline: (dealPipeline: DealPipeline | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create deal pipeline store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useDealPipelineStore = create<DealPipelineState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        dealPipelines: [],
        selectedDealPipeline: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch all deal pipelines
         */
        fetchDealPipelines: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getDealPipelines();
            
            if (response.success && response.data) {
              set((state) => {
                state.dealPipelines = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch deal pipelines'
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
         * Fetch a single deal pipeline by ID
         */
        fetchDealPipeline: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getDealPipeline(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedDealPipeline = response.data!;
                
                // Update in the list if it exists
                const index = state.dealPipelines.findIndex(dp => dp.id === id);
                if (index !== -1) {
                  state.dealPipelines[index] = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch deal pipeline'
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
         * Create a new deal pipeline
         */
        createDealPipeline: async (data: CreateDealPipelineInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await createDealPipeline(data);
            
            if (response.success && response.data) {
              set((state) => {
                state.dealPipelines.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create deal pipeline'
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
         * Update an existing deal pipeline
         */
        updateDealPipeline: async (id: number, data: UpdateDealPipelineInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updateDealPipeline(id, data);
            
            if (response.success && response.data) {
              set((state) => {
                // Update in the list
                const index = state.dealPipelines.findIndex(dp => dp.id === id);
                if (index !== -1) {
                  state.dealPipelines[index] = response.data!;
                }
                
                // Update selected if it's the same
                if (state.selectedDealPipeline?.id === id) {
                  state.selectedDealPipeline = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update deal pipeline'
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
         * Delete a deal pipeline
         */
        deleteDealPipeline: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await deleteDealPipeline(id);
            
            if (response.success) {
              set((state) => {
                state.dealPipelines = state.dealPipelines.filter(dp => dp.id !== id);
                
                // Clear selected if it's the same
                if (state.selectedDealPipeline?.id === id) {
                  state.selectedDealPipeline = null;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete deal pipeline'
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
         * Set the selected deal pipeline
         */
        setSelectedDealPipeline: (dealPipeline: DealPipeline | null) => {
          set({ selectedDealPipeline: dealPipeline });
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
            dealPipelines: [], 
            selectedDealPipeline: null, 
            isLoading: false, 
            error: null 
          });
        }
      })),
      {
        name: 'deal-pipeline-storage',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    )
  )
);