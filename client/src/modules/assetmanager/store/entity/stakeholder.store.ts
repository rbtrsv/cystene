'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Stakeholder,
  CreateStakeholder,
  UpdateStakeholder,
} from '../../schemas/entity/stakeholder.schemas';
import {
  getStakeholders,
  getStakeholder,
  createStakeholder as apiCreateStakeholder,
  updateStakeholder as apiUpdateStakeholder,
  deleteStakeholder as apiDeleteStakeholder,
  ListStakeholdersParams
} from '../../service/entity/stakeholder.service';

/**
 * Stakeholder store state interface
 */
export interface StakeholderState {
  // State
  stakeholders: Stakeholder[];
  activeStakeholderId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchStakeholders: (params?: ListStakeholdersParams) => Promise<boolean>;
  fetchStakeholder: (id: number) => Promise<Stakeholder | null>;
  createStakeholder: (data: CreateStakeholder) => Promise<boolean>;
  updateStakeholder: (id: number, data: UpdateStakeholder) => Promise<boolean>;
  deleteStakeholder: (id: number) => Promise<boolean>;
  setActiveStakeholder: (stakeholderId: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create stakeholder store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useStakeholderStore = create<StakeholderState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      stakeholders: [],
      activeStakeholderId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize stakeholders state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getStakeholders();

          if (response.success && response.data) {
            set((state) => {
              state.stakeholders = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active stakeholder if not already set and stakeholders exist
              if (response.data && response.data.length > 0 && state.activeStakeholderId === null) {
                state.activeStakeholderId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize stakeholders'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize stakeholders'
          });
        }
      },

      /**
       * Fetch all stakeholders with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchStakeholders: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getStakeholders(params);

          if (response.success && response.data) {
            set((state) => {
              state.stakeholders = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch stakeholders'
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
       * Fetch a specific stakeholder by ID
       * @param id Stakeholder ID
       * @returns Promise with stakeholder or null
       */
      fetchStakeholder: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getStakeholder(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch stakeholder with ID ${id}`
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
       * Create a new stakeholder
       * @param data Stakeholder creation data
       * @returns Success status
       */
      createStakeholder: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateStakeholder(data);

          if (response.success && response.data) {
            // After creating, refresh stakeholders list
            await get().fetchStakeholders();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create stakeholder'
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
       * Update an existing stakeholder
       * @param id Stakeholder ID
       * @param data Stakeholder update data
       * @returns Success status
       */
      updateStakeholder: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateStakeholder(id, data);

          if (response.success && response.data) {
            // After updating, refresh stakeholders list
            await get().fetchStakeholders();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update stakeholder with ID ${id}`
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
       * Delete a stakeholder
       * @param id Stakeholder ID
       * @returns Success status
       */
      deleteStakeholder: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteStakeholder(id);

          if (response.success) {
            // After deleting, refresh stakeholders list
            await get().fetchStakeholders();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete stakeholder with ID ${id}`
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
       * Set active stakeholder
       * @param stakeholderId ID of the active stakeholder or null
       */
      setActiveStakeholder: (stakeholderId) => {
        set((state) => {
          state.activeStakeholderId = stakeholderId;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset stakeholder state to initial values
       */
      reset: () => {
        set({
          stakeholders: [],
          activeStakeholderId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-stakeholder-storage',
        partialize: (state) => ({
          activeStakeholderId: state.activeStakeholderId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get stakeholder by ID from store
 * @param id Stakeholder ID
 * @returns The stakeholder or undefined if not found
 */
export const getStakeholderById = (id: number): Stakeholder | undefined => {
  const { stakeholders } = useStakeholderStore.getState();
  return stakeholders.find((stakeholder) => stakeholder.id === id);
};

/**
 * Get active stakeholder from stakeholder store
 * @returns The active stakeholder or undefined if not set
 */
export const getActiveStakeholder = (): Stakeholder | undefined => {
  const { stakeholders, activeStakeholderId } = useStakeholderStore.getState();
  return stakeholders.find((stakeholder) => stakeholder.id === activeStakeholderId);
};
