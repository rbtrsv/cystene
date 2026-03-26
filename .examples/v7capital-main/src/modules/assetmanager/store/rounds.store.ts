'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type Round, 
  type RoundWithFund,
  type RoundWithSecurities,
  type RoundWithDetails,
  type RoundType
} from '../schemas/rounds.schemas';
import {
  getRounds,
  getRoundsByFund,
  getRound,
  getRoundWithFund,
  getRoundWithSecurities,
  getRoundWithDetails,
  createRound,
  updateRound,
  deleteRound
} from '../actions/rounds.actions';

/**
 * Rounds store state interface
 */
export interface RoundsState {
  // State
  rounds: Round[];
  selectedRound: Round | RoundWithFund | RoundWithSecurities | RoundWithDetails | null;
  isLoading: boolean;
  error: string | null;
  
  // Round actions
  fetchRounds: () => Promise<void>;
  fetchRoundsByFund: (fundId: number) => Promise<void>;
  fetchRound: (id: number) => Promise<void>;
  fetchRoundWithFund: (id: number) => Promise<void>;
  fetchRoundWithSecurities: (id: number) => Promise<void>;
  fetchRoundWithDetails: (id: number) => Promise<void>;
  addRound: (
    fundId: number,
    roundName: string,
    roundType: RoundType,
    roundDate: string | Date,
    targetAmount: number,
    raisedAmount: number,
    preMoneyValuation?: number | null,
    postMoneyValuation?: number | null
  ) => Promise<boolean>;
  editRound: (
    id: number,
    roundName: string,
    roundType?: RoundType,
    roundDate?: string | Date,
    targetAmount?: number,
    raisedAmount?: number,
    preMoneyValuation?: number | null,
    postMoneyValuation?: number | null
  ) => Promise<boolean>;
  removeRound: (id: number) => Promise<boolean>;
  
  // Utility actions
  setSelectedRound: (round: Round | RoundWithFund | RoundWithSecurities | RoundWithDetails | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create rounds store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useRoundsStore = create<RoundsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        rounds: [],
        selectedRound: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch all rounds
         */
        fetchRounds: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getRounds();
            
            if (response.success && response.data) {
              set((state) => {
                state.rounds = response.data || [];
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch rounds'
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
         * Fetch rounds for a specific fund (for rounds list page - denies stakeholders)
         */
        fetchRoundsByFund: async (fundId: number) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getRoundsByFund(fundId);

            if (response.success && response.data) {
              set((state) => {
                state.rounds = response.data || [];
                state.isLoading = false;
              });
            } else {
              set({
                isLoading: false,
                error: response.error || 'Failed to fetch rounds by fund'
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
         * Fetch a single round by ID
         */
        fetchRound: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getRound(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedRound = response.data;
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch round'
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
         * Fetch a round with its fund
         * @param id - Round ID
         */
        fetchRoundWithFund: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getRoundWithFund(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedRound = response.data;
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch round with fund'
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
         * Fetch a round with its securities
         * @param id - Round ID
         */
        fetchRoundWithSecurities: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getRoundWithSecurities(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedRound = response.data;
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch round with securities'
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
         * Fetch a round with all its details
         * @param id - Round ID
         */
        fetchRoundWithDetails: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getRoundWithDetails(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedRound = response.data;
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch round with details'
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
         * Add a new round
         * @param fundId - Fund ID
         * @param roundName - Round name
         * @param roundType - Round type
         * @param roundDate - Round date
         * @param targetAmount - Target amount
         * @param raisedAmount - Raised amount
         * @param preMoneyValuation - Pre-money valuation
         * @param postMoneyValuation - Post-money valuation
         * @returns Success status
         */
        addRound: async (
          fundId: number,
          roundName: string,
          roundType: RoundType,
          roundDate: string | Date,
          targetAmount: number,
          raisedAmount: number,
          preMoneyValuation?: number | null,
          postMoneyValuation?: number | null
        ) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await createRound({ 
              fundId,
              roundName,
              roundType,
              roundDate,
              targetAmount,
              raisedAmount,
              preMoneyValuation,
              postMoneyValuation
            });
            
            if (response.success && response.data) {
              // Add the new round to the list
              set((state) => {
                state.rounds.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create round'
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
         * Edit an existing round
         * @param id - Round ID
         * @param roundName - Updated round name
         * @param roundType - Optional updated round type
         * @param roundDate - Optional updated round date
         * @param targetAmount - Optional updated target amount
         * @param raisedAmount - Optional updated raised amount
         * @param preMoneyValuation - Optional updated pre-money valuation
         * @param postMoneyValuation - Optional updated post-money valuation
         * @returns Success status
         */
        editRound: async (
          id: number,
          roundName: string,
          roundType?: RoundType,
          roundDate?: string | Date,
          targetAmount?: number,
          raisedAmount?: number,
          preMoneyValuation?: number | null,
          postMoneyValuation?: number | null
        ) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updateRound(id, { 
              roundName,
              roundType,
              roundDate,
              targetAmount,
              raisedAmount,
              preMoneyValuation,
              postMoneyValuation
            });
            
            if (response.success && response.data) {
              // Update the round in the list
              set((state) => {
                const index = state.rounds.findIndex(r => r.id === id);
                if (index !== -1) {
                  state.rounds[index] = response.data!;
                }
                
                // Also update the selected round if it's the same one
                if (state.selectedRound && state.selectedRound.id === id) {
                  // Preserve any extended properties
                  let extendedProps = {};
                  
                  if ('fund' in state.selectedRound) {
                    extendedProps = { 
                      ...extendedProps, 
                      fund: state.selectedRound.fund 
                    };
                  }
                  
                  if ('securities' in state.selectedRound) {
                    extendedProps = { 
                      ...extendedProps, 
                      securities: state.selectedRound.securities 
                    };
                  }
                  
                  state.selectedRound = {
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
                error: response.error || 'Failed to update round'
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
         * Remove a round
         * @param id - Round ID
         * @returns Success status
         */
        removeRound: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await deleteRound(id);
            
            if (response.success) {
              // Remove the round from the list
              set((state) => {
                state.rounds = state.rounds.filter(r => r.id !== id);
                
                // Clear selected round if it's the same one
                if (state.selectedRound && state.selectedRound.id === id) {
                  state.selectedRound = null;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete round'
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
         * Set the selected round
         * @param round - Round to select, or null to clear selection
         */
        setSelectedRound: (round: Round | RoundWithFund | RoundWithSecurities | RoundWithDetails | null) => {
          set({ selectedRound: round });
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
            rounds: [],
            selectedRound: null,
            isLoading: false,
            error: null
          });
        }
      })),
      {
        name: 'v7capital-rounds-storage',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    )
  )
);
