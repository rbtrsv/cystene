'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  PatentClaim,
  CreatePatentClaim,
  UpdatePatentClaim,
} from '@/modules/nexotype/schemas/commercial/patent-claim.schemas';
import {
  getPatentClaims,
  getPatentClaim,
  createPatentClaim as apiCreatePatentClaim,
  updatePatentClaim as apiUpdatePatentClaim,
  deletePatentClaim as apiDeletePatentClaim,
  ListPatentClaimsParams,
} from '@/modules/nexotype/service/commercial/patent-claim.service';

/**
 * PatentClaim store state interface
 */
export interface PatentClaimState {
  // State
  patentClaims: PatentClaim[];
  activePatentClaimId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchPatentClaims: (params?: ListPatentClaimsParams) => Promise<boolean>;
  fetchPatentClaim: (id: number) => Promise<PatentClaim | null>;
  createPatentClaim: (data: CreatePatentClaim) => Promise<boolean>;
  updatePatentClaim: (id: number, data: UpdatePatentClaim) => Promise<boolean>;
  deletePatentClaim: (id: number) => Promise<boolean>;
  setActivePatentClaim: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create patent claim store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const usePatentClaimStore = create<PatentClaimState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        patentClaims: [],
        activePatentClaimId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize patent claims state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getPatentClaims();

            if (response.success && response.data) {
              set((state) => {
                state.patentClaims = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize patent claims',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize patent claims',
            });
          }
        },

        /**
         * Fetch all patent claims with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchPatentClaims: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getPatentClaims(params);

            if (response.success && response.data) {
              set((state) => {
                state.patentClaims = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch patent claims',
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
         * Fetch a specific patent claim by ID
         * @param id PatentClaim ID
         * @returns Promise with patent claim or null
         */
        fetchPatentClaim: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getPatentClaim(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch patent claim with ID ${id}`,
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
         * Create a new patent claim
         * @param data PatentClaim creation data
         * @returns Success status
         */
        createPatentClaim: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreatePatentClaim(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchPatentClaims();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create patent claim',
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
         * Update an existing patent claim
         * @param id PatentClaim ID
         * @param data PatentClaim update data
         * @returns Success status
         */
        updatePatentClaim: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdatePatentClaim(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchPatentClaims();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update patent claim with ID ${id}`,
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
         * Delete a patent claim
         * @param id PatentClaim ID
         * @returns Success status
         */
        deletePatentClaim: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeletePatentClaim(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchPatentClaims();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete patent claim with ID ${id}`,
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
         * Set active patent claim
         * @param id ID of the active patent claim or null
         */
        setActivePatentClaim: (id) => {
          set((state) => {
            state.activePatentClaimId = id;
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
            patentClaims: [],
            activePatentClaimId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-patent-claim-storage',
        partialize: (state) => ({
          activePatentClaimId: state.activePatentClaimId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get patent claim by ID from store
 * @param id PatentClaim ID
 * @returns The patent claim or undefined if not found
 */
export const getPatentClaimById = (id: number): PatentClaim | undefined => {
  const { patentClaims } = usePatentClaimStore.getState();
  return patentClaims.find((pc) => pc.id === id);
};

/**
 * Get active patent claim from store
 * @returns The active patent claim or undefined if not set
 */
export const getActivePatentClaim = (): PatentClaim | undefined => {
  const { patentClaims, activePatentClaimId } = usePatentClaimStore.getState();
  return patentClaims.find((pc) => pc.id === activePatentClaimId);
};
