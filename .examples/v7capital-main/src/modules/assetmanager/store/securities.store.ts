'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type Security, 
  type CreateSecurityInput,
  type UpdateSecurityInput
} from '../schemas/securities.schemas';
import {
  getSecurities,
  getSecuritiesByRound,
  getSecurity,
  createSecurity,
  updateSecurity,
  deleteSecurity
} from '../actions/securities.actions';

/**
 * Securities store state interface
 */
export interface SecuritiesState {
  // State
  securities: Security[];
  selectedSecurity: Security | null;
  isLoading: boolean;
  error: string | null;
  
  // Security actions
  fetchSecurities: () => Promise<void>;
  fetchSecuritiesByRound: (roundId: number) => Promise<void>;
  fetchSecurity: (id: number) => Promise<void>;
  addSecurity: (data: CreateSecurityInput) => Promise<boolean>;
  editSecurity: (id: number, data: UpdateSecurityInput) => Promise<boolean>;
  removeSecurity: (id: number) => Promise<boolean>;
  
  // Utility actions
  setSelectedSecurity: (security: Security | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create securities store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useSecuritiesStore = create<SecuritiesState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        securities: [],
        selectedSecurity: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch all securities
         */
        fetchSecurities: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getSecurities();
            
            if (response.success && response.data) {
              set((state) => {
                state.securities = response.data || [];
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch securities'
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
         * Fetch securities for a specific round
         * @param roundId - Round ID
         */
        fetchSecuritiesByRound: async (roundId: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getSecuritiesByRound(roundId);
            
            if (response.success && response.data) {
              set((state) => {
                state.securities = response.data || [];
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch securities by round'
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
         * Fetch a single security by ID
         * @param id - Security ID
         */
        fetchSecurity: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getSecurity(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedSecurity = response.data;
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch security'
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
         * Add a new security
         * @param data - Security data
         * @returns Success status
         */
        addSecurity: async (data: CreateSecurityInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await createSecurity(data);
            
            if (response.success && response.data) {
              // Add the new security to the list
              set((state) => {
                state.securities.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create security'
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
         * Edit an existing security
         * @param id - Security ID
         * @param data - Updated security data
         * @returns Success status
         */
        editSecurity: async (id: number, data: UpdateSecurityInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updateSecurity(id, data);
            
            if (response.success && response.data) {
              // Update the security in the list
              set((state) => {
                const index = state.securities.findIndex(s => s.id === id);
                if (index !== -1) {
                  state.securities[index] = response.data!;
                }
                
                // Also update the selected security if it's the same one
                if (state.selectedSecurity && state.selectedSecurity.id === id) {
                  state.selectedSecurity = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update security'
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
         * Remove a security
         * @param id - Security ID
         * @returns Success status
         */
        removeSecurity: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await deleteSecurity(id);
            
            if (response.success) {
              // Remove the security from the list
              set((state) => {
                state.securities = state.securities.filter(s => s.id !== id);
                
                // Clear selected security if it's the same one
                if (state.selectedSecurity && state.selectedSecurity.id === id) {
                  state.selectedSecurity = null;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete security'
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
         * Set the selected security
         * @param security - Security to select, or null to clear selection
         */
        setSelectedSecurity: (security) => {
          set({ selectedSecurity: security });
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
            securities: [],
            selectedSecurity: null,
            isLoading: false,
            error: null
          });
        }
      })),
      {
        name: 'v7capital-securities-storage',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    )
  )
);
