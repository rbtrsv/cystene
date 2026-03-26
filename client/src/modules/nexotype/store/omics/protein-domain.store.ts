'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ProteinDomain,
  CreateProteinDomain,
  UpdateProteinDomain,
} from '@/modules/nexotype/schemas/omics/protein-domain.schemas';
import {
  getProteinDomains,
  getProteinDomain,
  createProteinDomain as apiCreateProteinDomain,
  updateProteinDomain as apiUpdateProteinDomain,
  deleteProteinDomain as apiDeleteProteinDomain,
  ListProteinDomainsParams,
} from '@/modules/nexotype/service/omics/protein-domain.service';

/**
 * Protein domain store state interface
 */
export interface ProteinDomainState {
  // State
  proteinDomains: ProteinDomain[];
  activeProteinDomainId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchProteinDomains: (params?: ListProteinDomainsParams) => Promise<boolean>;
  fetchProteinDomain: (id: number) => Promise<ProteinDomain | null>;
  createProteinDomain: (data: CreateProteinDomain) => Promise<boolean>;
  updateProteinDomain: (id: number, data: UpdateProteinDomain) => Promise<boolean>;
  deleteProteinDomain: (id: number) => Promise<boolean>;
  setActiveProteinDomain: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create protein domain store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useProteinDomainStore = create<ProteinDomainState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      proteinDomains: [],
      activeProteinDomainId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize protein domains state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getProteinDomains();

          if (response.success && response.data) {
            set((state) => {
              state.proteinDomains = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize protein domains',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize protein domains',
          });
        }
      },

      /**
       * Fetch all protein domains with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchProteinDomains: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getProteinDomains(params);

          if (response.success && response.data) {
            set((state) => {
              state.proteinDomains = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch protein domains',
          });
          return false;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
          return false;
        }
      },

      /**
       * Fetch a specific protein domain by ID
       * @param id Protein domain ID
       * @returns Promise with protein domain or null
       */
      fetchProteinDomain: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getProteinDomain(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch protein domain with ID ${id}`,
          });
          return null;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
          return null;
        }
      },

      /**
       * Create a new protein domain
       * @param data Protein domain creation data
       * @returns Success status
       */
      createProteinDomain: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateProteinDomain(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchProteinDomains();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create protein domain',
          });
          return false;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
          return false;
        }
      },

      /**
       * Update an existing protein domain
       * @param id Protein domain ID
       * @param data Protein domain update data
       * @returns Success status
       */
      updateProteinDomain: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateProteinDomain(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchProteinDomains();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update protein domain with ID ${id}`,
          });
          return false;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
          return false;
        }
      },

      /**
       * Delete a protein domain
       * @param id Protein domain ID
       * @returns Success status
       */
      deleteProteinDomain: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteProteinDomain(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchProteinDomains();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete protein domain with ID ${id}`,
          });
          return false;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
          return false;
        }
      },

      /**
       * Set active protein domain
       * @param id ID of the active protein domain or null
       */
      setActiveProteinDomain: (id) => {
        set((state) => {
          state.activeProteinDomainId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset state to initial values
       */
      reset: () => {
        set({
          proteinDomains: [],
          activeProteinDomainId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-protein-domain-storage',
        partialize: (state) => ({
          activeProteinDomainId: state.activeProteinDomainId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get protein domain by ID from store
 * @param id Protein domain ID
 * @returns The protein domain or undefined if not found
 */
export const getProteinDomainById = (id: number): ProteinDomain | undefined => {
  const { proteinDomains } = useProteinDomainStore.getState();
  return proteinDomains.find((pd) => pd.id === id);
};

/**
 * Get active protein domain from store
 * @returns The active protein domain or undefined if not set
 */
export const getActiveProteinDomain = (): ProteinDomain | undefined => {
  const { proteinDomains, activeProteinDomainId } = useProteinDomainStore.getState();
  return proteinDomains.find((pd) => pd.id === activeProteinDomainId);
};
