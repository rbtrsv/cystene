'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type Fund, 
  type FundWithStakeholders,
  type FundWithRounds,
  type FundStatus
} from '../schemas/funds.schemas';
import {
  getFunds,
  getFund,
  getFundWithStakeholders,
  getFundWithRounds,
  createFund,
  updateFund,
  deleteFund
} from '../actions/funds.actions';

/**
 * Funds store state interface
 */
export interface FundsState {
  // State
  funds: Fund[];
  selectedFund: Fund | FundWithStakeholders | FundWithRounds | null;
  isLoading: boolean;
  error: string | null;
  
  // Fund actions
  fetchFunds: () => Promise<void>;
  fetchFund: (id: number) => Promise<void>;
  fetchFundWithStakeholders: (id: number) => Promise<void>;
  fetchFundWithRounds: (id: number) => Promise<void>;
  addFund: (name: string, description?: string | null, targetSize?: number | null, vintage?: number | null, status?: FundStatus) => Promise<boolean>;
  editFund: (id: number, name: string, description?: string | null, targetSize?: number | null, vintage?: number | null, status?: FundStatus) => Promise<boolean>;
  removeFund: (id: number) => Promise<boolean>;
  
  // Utility actions
  setSelectedFund: (fund: Fund | FundWithStakeholders | FundWithRounds | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create funds store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useFundsStore = create<FundsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        funds: [],
        selectedFund: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch all funds (for fund list page - denies stakeholders)
         */
        fetchFunds: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getFunds();

            if (response.success && response.data) {
              set((state) => {
                state.funds = response.data || [];
                state.isLoading = false;
              });
            } else {
              set({
                isLoading: false,
                error: response.error || 'Failed to fetch funds'
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
         * Fetch a single fund by ID
         */
        fetchFund: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getFund(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedFund = response.data;
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch fund'
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
         * Fetch a fund with its stakeholders
         * @param id - Fund ID
         */
        fetchFundWithStakeholders: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getFundWithStakeholders(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedFund = response.data;
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch fund with stakeholders'
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
         * Fetch a fund with its rounds
         * @param id - Fund ID
         */
        fetchFundWithRounds: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getFundWithRounds(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedFund = response.data;
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch fund with rounds'
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
         * Add a new fund
         * @param name - Fund name
         * @param description - Optional fund description
         * @param targetSize - Optional fund target size
         * @param vintage - Optional fund vintage year
         * @param status - Optional fund status
         * @returns Success status
         */
        addFund: async (name: string, description?: string | null, targetSize?: number | null, vintage?: number | null, status?: FundStatus) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await createFund({ 
              name, 
              description, 
              targetSize, 
              vintage, 
              status 
            });
            
            if (response.success && response.data) {
              // Add the new fund to the list
              set((state) => {
                state.funds.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create fund'
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
         * Edit an existing fund
         * @param id - Fund ID
         * @param name - Updated fund name
         * @param description - Optional updated fund description
         * @param targetSize - Optional updated fund target size
         * @param vintage - Optional updated fund vintage year
         * @param status - Optional updated fund status
         * @returns Success status
         */
        editFund: async (id: number, name: string, description?: string | null, targetSize?: number | null, vintage?: number | null, status?: FundStatus) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updateFund(id, { 
              name, 
              description, 
              targetSize, 
              vintage, 
              status 
            });
            
            if (response.success && response.data) {
              // Update the fund in the list
              set((state) => {
                const index = state.funds.findIndex(f => f.id === id);
                if (index !== -1) {
                  state.funds[index] = response.data!;
                }
                
                // Also update the selected fund if it's the same one
                if (state.selectedFund && state.selectedFund.id === id) {
                  // Preserve any extended properties (stakeholders, rounds)
                  let extendedProps = {};
                  if ('stakeholders' in state.selectedFund) {
                    extendedProps = { 
                      ...extendedProps, 
                      stakeholders: state.selectedFund.stakeholders 
                    };
                  }
                  if ('rounds' in state.selectedFund) {
                    extendedProps = { 
                      ...extendedProps, 
                      rounds: state.selectedFund.rounds 
                    };
                  }
                  
                  state.selectedFund = {
                    ...response.data!,
                    ...extendedProps
                  };
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update fund'
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
         * Remove a fund
         * @param id - Fund ID
         * @returns Success status
         */
        removeFund: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await deleteFund(id);
            
            if (response.success) {
              // Remove the fund from the list
              set((state) => {
                state.funds = state.funds.filter(f => f.id !== id);
                
                // Clear selected fund if it's the same one
                if (state.selectedFund && state.selectedFund.id === id) {
                  state.selectedFund = null;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete fund'
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
         * Set the selected fund
         * @param fund - Fund to select, or null to clear selection
         */
        setSelectedFund: (fund: Fund | FundWithStakeholders | FundWithRounds | null) => {
          set({ selectedFund: fund });
        },
        
        /**
         * Clear error message
         */
        clearError: () => {
          set({ error: null });
        },
        
        /**
         * Reset store to initial state
         */
        reset: () => {
          set({
            funds: [],
            selectedFund: null,
            isLoading: false,
            error: null
          });
        }
      })),
      {
        name: 'v7capital-funds-storage',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    )
  )
);
