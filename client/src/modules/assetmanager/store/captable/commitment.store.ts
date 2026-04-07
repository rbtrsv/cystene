'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Commitment,
  CommitmentDetail,
  CreateCommitment,
  RespondCommitment,
  ReviewCommitment,
} from '../../schemas/captable/commitment.schemas';
import {
  getCommitments,
  getCommitment,
  createCommitment as apiCreateCommitment,
  respondToCommitment as apiRespondToCommitment,
  reviewCommitment as apiReviewCommitment,
  generateTransactionFromCommitment as apiGenerateTransaction,
  deleteCommitment as apiDeleteCommitment,
  ListCommitmentsParams
} from '../../service/captable/commitment.service';

/**
 * Commitment store state interface
 */
export interface CommitmentState {
  // State
  commitments: CommitmentDetail[];
  activeCommitmentId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchCommitments: (params?: ListCommitmentsParams) => Promise<boolean>;
  fetchCommitment: (id: number) => Promise<CommitmentDetail | null>;
  createCommitment: (data: CreateCommitment, raise_amount: number) => Promise<boolean>;
  respondToCommitment: (id: number, data: RespondCommitment) => Promise<boolean>;
  reviewCommitment: (id: number, data: ReviewCommitment) => Promise<boolean>;
  generateTransaction: (id: number, data: { transaction_reference: string }) => Promise<boolean>;
  deleteCommitment: (id: number) => Promise<boolean>;
  setActiveCommitment: (commitmentId: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create commitment store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useCommitmentStore = create<CommitmentState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      commitments: [],
      activeCommitmentId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize commitments state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getCommitments();

          if (response.success && response.data) {
            set((state) => {
              state.commitments = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active commitment if not already set and commitments exist
              if (response.data && response.data.length > 0 && state.activeCommitmentId === null) {
                state.activeCommitmentId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize commitments'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize commitments'
          });
        }
      },

      /**
       * Fetch all commitments with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchCommitments: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getCommitments(params);

          if (response.success && response.data) {
            set((state) => {
              state.commitments = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch commitments'
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
       * Fetch a specific commitment by ID
       * @param id Commitment ID
       * @returns Promise with commitment or null
       */
      fetchCommitment: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getCommitment(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch commitment with ID ${id}`
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
       * Create a single commitment invitation.
       * One request per stakeholder — frontend iterates and calls this for each.
       * raise_amount is passed separately (query param, not on model/schema).
       *
       * @param data Commitment body data (entity_id, funding_round_id, stakeholder_id)
       * @param raise_amount Amount to raise — forwarded to backend as query param
       * @returns Success status
       */
      createCommitment: async (data, raise_amount) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateCommitment(data, raise_amount);

          if (response.success && response.data) {
            // After creating, refresh commitments list
            await get().fetchCommitments();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create commitment'
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
       * Respond to a commitment invitation
       * @param id Commitment ID
       * @param data Response data
       * @returns Success status
       */
      respondToCommitment: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiRespondToCommitment(id, data);

          if (response.success && response.data) {
            // After responding, refresh commitments list
            await get().fetchCommitments();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to respond to commitment with ID ${id}`
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
       * Review a committed commitment
       * @param id Commitment ID
       * @param data Review data
       * @returns Success status
       */
      reviewCommitment: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiReviewCommitment(id, data);

          if (response.success && response.data) {
            // After reviewing, refresh commitments list
            await get().fetchCommitments();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to review commitment with ID ${id}`
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
       * Generate ISSUANCE transaction from approved commitment.
       * security_id is already on the commitment — only transaction_reference is needed.
       * @param id Commitment ID
       * @param data Transaction data (transaction_reference only)
       * @returns Success status
       */
      generateTransaction: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiGenerateTransaction(id, data);

          if (response.success && response.data) {
            // After generating, refresh commitments list
            await get().fetchCommitments();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to generate transaction for commitment with ID ${id}`
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
       * Delete a commitment (soft delete)
       * @param id Commitment ID
       * @returns Success status
       */
      deleteCommitment: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteCommitment(id);

          if (response.success) {
            // After deleting, refresh commitments list
            await get().fetchCommitments();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete commitment with ID ${id}`
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
       * Set active commitment
       * @param commitmentId ID of the active commitment or null
       */
      setActiveCommitment: (commitmentId) => {
        set((state) => {
          state.activeCommitmentId = commitmentId;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset commitment state to initial values
       */
      reset: () => {
        set({
          commitments: [],
          activeCommitmentId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-commitment-storage',
        partialize: (state) => ({
          activeCommitmentId: state.activeCommitmentId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get commitment by ID from store
 * @param id Commitment ID
 * @returns The commitment or undefined if not found
 */
export const getCommitmentById = (id: number): CommitmentDetail | undefined => {
  const { commitments } = useCommitmentStore.getState();
  return commitments.find((commitment) => commitment.id === id);
};

/**
 * Get active commitment from store
 * @returns The active commitment or undefined if not set
 */
export const getActiveCommitment = (): CommitmentDetail | undefined => {
  const { commitments, activeCommitmentId } = useCommitmentStore.getState();
  return commitments.find((commitment) => commitment.id === activeCommitmentId);
};
