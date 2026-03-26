'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Security,
  CreateSecurity,
  UpdateSecurity,
} from '../../schemas/captable/security.schemas';
import {
  getSecurities,
  getSecurity,
  createSecurity as apiCreateSecurity,
  updateSecurity as apiUpdateSecurity,
  deleteSecurity as apiDeleteSecurity,
  ListSecuritiesParams
} from '../../service/captable/security.service';

/**
 * Security store state interface
 */
export interface SecurityState {
  // State
  securities: Security[];
  activeSecurityId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchSecurities: (params?: ListSecuritiesParams) => Promise<boolean>;
  fetchSecurity: (id: number) => Promise<Security | null>;
  createSecurity: (data: CreateSecurity) => Promise<boolean>;
  updateSecurity: (id: number, data: UpdateSecurity) => Promise<boolean>;
  deleteSecurity: (id: number) => Promise<boolean>;
  setActiveSecurity: (securityId: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create security store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useSecurityStore = create<SecurityState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      securities: [],
      activeSecurityId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize securities state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSecurities();

          if (response.success && response.data) {
            set((state) => {
              state.securities = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active security if not already set and securities exist
              if (response.data && response.data.length > 0 && state.activeSecurityId === null) {
                state.activeSecurityId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize securities'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize securities'
          });
        }
      },

      /**
       * Fetch all securities with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchSecurities: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSecurities(params);

          if (response.success && response.data) {
            set((state) => {
              state.securities = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch securities'
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
       * Fetch a specific security by ID
       * @param id Security ID
       * @returns Promise with security or null
       */
      fetchSecurity: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSecurity(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch security with ID ${id}`
            });
            return null;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return null;
        }
      },

      /**
       * Create a new security
       * @param data Security creation data
       * @returns Success status
       */
      createSecurity: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateSecurity(data);

          if (response.success && response.data) {
            // After creating, refresh securities list
            await get().fetchSecurities();

            set({ isLoading: false });
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
       * Update an existing security
       * @param id Security ID
       * @param data Security update data
       * @returns Success status
       */
      updateSecurity: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateSecurity(id, data);

          if (response.success && response.data) {
            // After updating, refresh securities list
            await get().fetchSecurities();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update security with ID ${id}`
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
       * Delete a security
       * @param id Security ID
       * @returns Success status
       */
      deleteSecurity: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteSecurity(id);

          if (response.success) {
            // After deleting, refresh securities list
            await get().fetchSecurities();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete security with ID ${id}`
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
       * Set active security
       * @param securityId ID of the active security or null
       */
      setActiveSecurity: (securityId) => {
        set((state) => {
          state.activeSecurityId = securityId;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset security state to initial values
       */
      reset: () => {
        set({
          securities: [],
          activeSecurityId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-security-storage',
        partialize: (state) => ({
          activeSecurityId: state.activeSecurityId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get security by ID from store
 * @param id Security ID
 * @returns The security or undefined if not found
 */
export const getSecurityById = (id: number): Security | undefined => {
  const { securities } = useSecurityStore.getState();
  return securities.find((security) => security.id === id);
};

/**
 * Get active security from store
 * @returns The active security or undefined if not set
 */
export const getActiveSecurity = (): Security | undefined => {
  const { securities, activeSecurityId } = useSecurityStore.getState();
  return securities.find((security) => security.id === activeSecurityId);
};
