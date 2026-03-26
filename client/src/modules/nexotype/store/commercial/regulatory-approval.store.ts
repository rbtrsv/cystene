'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  RegulatoryApproval,
  CreateRegulatoryApproval,
  UpdateRegulatoryApproval,
} from '@/modules/nexotype/schemas/commercial/regulatory-approval.schemas';
import {
  getRegulatoryApprovals,
  getRegulatoryApproval,
  createRegulatoryApproval as apiCreateRegulatoryApproval,
  updateRegulatoryApproval as apiUpdateRegulatoryApproval,
  deleteRegulatoryApproval as apiDeleteRegulatoryApproval,
  ListRegulatoryApprovalsParams,
} from '@/modules/nexotype/service/commercial/regulatory-approval.service';

/**
 * RegulatoryApproval store state interface
 */
export interface RegulatoryApprovalState {
  // State
  regulatoryApprovals: RegulatoryApproval[];
  activeRegulatoryApprovalId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchRegulatoryApprovals: (params?: ListRegulatoryApprovalsParams) => Promise<boolean>;
  fetchRegulatoryApproval: (id: number) => Promise<RegulatoryApproval | null>;
  createRegulatoryApproval: (data: CreateRegulatoryApproval) => Promise<boolean>;
  updateRegulatoryApproval: (id: number, data: UpdateRegulatoryApproval) => Promise<boolean>;
  deleteRegulatoryApproval: (id: number) => Promise<boolean>;
  setActiveRegulatoryApproval: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create regulatory approval store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useRegulatoryApprovalStore = create<RegulatoryApprovalState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        regulatoryApprovals: [],
        activeRegulatoryApprovalId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize regulatory approvals state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getRegulatoryApprovals();

            if (response.success && response.data) {
              set((state) => {
                state.regulatoryApprovals = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize regulatory approvals',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize regulatory approvals',
            });
          }
        },

        /**
         * Fetch all regulatory approvals with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchRegulatoryApprovals: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getRegulatoryApprovals(params);

            if (response.success && response.data) {
              set((state) => {
                state.regulatoryApprovals = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch regulatory approvals',
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
         * Fetch a specific regulatory approval by ID
         * @param id RegulatoryApproval ID
         * @returns Promise with regulatory approval or null
         */
        fetchRegulatoryApproval: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getRegulatoryApproval(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch regulatory approval with ID ${id}`,
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
         * Create a new regulatory approval
         * @param data RegulatoryApproval creation data
         * @returns Success status
         */
        createRegulatoryApproval: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateRegulatoryApproval(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchRegulatoryApprovals();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create regulatory approval',
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
         * Update an existing regulatory approval
         * @param id RegulatoryApproval ID
         * @param data RegulatoryApproval update data
         * @returns Success status
         */
        updateRegulatoryApproval: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateRegulatoryApproval(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchRegulatoryApprovals();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update regulatory approval with ID ${id}`,
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
         * Delete a regulatory approval
         * @param id RegulatoryApproval ID
         * @returns Success status
         */
        deleteRegulatoryApproval: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteRegulatoryApproval(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchRegulatoryApprovals();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete regulatory approval with ID ${id}`,
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
         * Set active regulatory approval
         * @param id ID of the active regulatory approval or null
         */
        setActiveRegulatoryApproval: (id) => {
          set((state) => {
            state.activeRegulatoryApprovalId = id;
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
            regulatoryApprovals: [],
            activeRegulatoryApprovalId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-regulatory-approval-storage',
        partialize: (state) => ({
          activeRegulatoryApprovalId: state.activeRegulatoryApprovalId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get regulatory approval by ID from store
 * @param id RegulatoryApproval ID
 * @returns The regulatory approval or undefined if not found
 */
export const getRegulatoryApprovalById = (id: number): RegulatoryApproval | undefined => {
  const { regulatoryApprovals } = useRegulatoryApprovalStore.getState();
  return regulatoryApprovals.find((ra) => ra.id === id);
};

/**
 * Get active regulatory approval from store
 * @returns The active regulatory approval or undefined if not set
 */
export const getActiveRegulatoryApproval = (): RegulatoryApproval | undefined => {
  const { regulatoryApprovals, activeRegulatoryApprovalId } = useRegulatoryApprovalStore.getState();
  return regulatoryApprovals.find((ra) => ra.id === activeRegulatoryApprovalId);
};
