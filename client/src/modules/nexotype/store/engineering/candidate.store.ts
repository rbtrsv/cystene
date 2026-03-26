'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Candidate,
  CreateCandidate,
  UpdateCandidate,
} from '@/modules/nexotype/schemas/engineering/candidate.schemas';
import {
  getCandidates,
  getCandidate,
  createCandidate as apiCreateCandidate,
  updateCandidate as apiUpdateCandidate,
  deleteCandidate as apiDeleteCandidate,
  ListCandidatesParams,
} from '@/modules/nexotype/service/engineering/candidate.service';

/**
 * Candidate store state interface
 */
export interface CandidateState {
  // State
  candidates: Candidate[];
  activeCandidateId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchCandidates: (params?: ListCandidatesParams) => Promise<boolean>;
  fetchCandidate: (id: number) => Promise<Candidate | null>;
  createCandidate: (data: CreateCandidate) => Promise<boolean>;
  updateCandidate: (id: number, data: UpdateCandidate) => Promise<boolean>;
  deleteCandidate: (id: number) => Promise<boolean>;
  setActiveCandidate: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create candidate store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useCandidateStore = create<CandidateState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        candidates: [],
        activeCandidateId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize candidates state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getCandidates();

            if (response.success && response.data) {
              set((state) => {
                state.candidates = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize candidates',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize candidates',
            });
          }
        },

        /**
         * Fetch all candidates with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchCandidates: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getCandidates(params);

            if (response.success && response.data) {
              set((state) => {
                state.candidates = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch candidates',
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
         * Fetch a specific candidate by ID
         * @param id Candidate ID
         * @returns Promise with candidate or null
         */
        fetchCandidate: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getCandidate(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch candidate with ID ${id}`,
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
         * Create a new candidate
         * @param data Candidate creation data
         * @returns Success status
         */
        createCandidate: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateCandidate(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchCandidates();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create candidate',
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
         * Update an existing candidate
         * @param id Candidate ID
         * @param data Candidate update data
         * @returns Success status
         */
        updateCandidate: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateCandidate(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchCandidates();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update candidate with ID ${id}`,
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
         * Delete a candidate
         * @param id Candidate ID
         * @returns Success status
         */
        deleteCandidate: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteCandidate(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchCandidates();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete candidate with ID ${id}`,
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
         * Set active candidate
         * @param id ID of the active candidate or null
         */
        setActiveCandidate: (id) => {
          set((state) => {
            state.activeCandidateId = id;
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
            candidates: [],
            activeCandidateId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-candidate-storage',
        partialize: (state) => ({
          activeCandidateId: state.activeCandidateId,
        }),
        skipHydration: true,
      }
    ),
  ),
);

/**
 * Helper function to get candidate by ID from store
 * @param id Candidate ID
 * @returns The candidate or undefined if not found
 */
export const getCandidateById = (id: number): Candidate | undefined => {
  const { candidates } = useCandidateStore.getState();
  return candidates.find((candidate) => candidate.id === id);
};

/**
 * Get active candidate from store
 * @returns The active candidate or undefined if not set
 */
export const getActiveCandidate = (): Candidate | undefined => {
  const { candidates, activeCandidateId } = useCandidateStore.getState();
  return candidates.find((candidate) => candidate.id === activeCandidateId);
};
