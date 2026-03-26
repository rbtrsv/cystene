'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  DrugInteraction,
  CreateDrugInteraction,
  UpdateDrugInteraction,
} from '@/modules/nexotype/schemas/knowledge_graph/drug-interaction.schemas';
import {
  getDrugInteractions,
  getDrugInteraction,
  createDrugInteraction as apiCreateDrugInteraction,
  updateDrugInteraction as apiUpdateDrugInteraction,
  deleteDrugInteraction as apiDeleteDrugInteraction,
  ListDrugInteractionsParams,
} from '@/modules/nexotype/service/knowledge_graph/drug-interaction.service';

/**
 * DrugInteraction store state interface
 */
export interface DrugInteractionState {
  // State
  drugInteractions: DrugInteraction[];
  activeDrugInteractionId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchDrugInteractions: (params?: ListDrugInteractionsParams) => Promise<boolean>;
  fetchDrugInteraction: (id: number) => Promise<DrugInteraction | null>;
  createDrugInteraction: (data: CreateDrugInteraction) => Promise<boolean>;
  updateDrugInteraction: (id: number, data: UpdateDrugInteraction) => Promise<boolean>;
  deleteDrugInteraction: (id: number) => Promise<boolean>;
  setActiveDrugInteraction: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create drug interaction store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useDrugInteractionStore = create<DrugInteractionState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        drugInteractions: [],
        activeDrugInteractionId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize drug interactions state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getDrugInteractions();

            if (response.success && response.data) {
              set((state) => {
                state.drugInteractions = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize drug interactions',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize drug interactions',
            });
          }
        },

        /**
         * Fetch all drug interactions with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchDrugInteractions: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getDrugInteractions(params);

            if (response.success && response.data) {
              set((state) => {
                state.drugInteractions = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch drug interactions',
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
         * Fetch a specific drug interaction by ID
         * @param id DrugInteraction ID
         * @returns Promise with drug interaction or null
         */
        fetchDrugInteraction: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getDrugInteraction(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch drug interaction with ID ${id}`,
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
         * Create a new drug interaction
         * @param data DrugInteraction creation data
         * @returns Success status
         */
        createDrugInteraction: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateDrugInteraction(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchDrugInteractions();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create drug interaction',
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
         * Update an existing drug interaction
         * @param id DrugInteraction ID
         * @param data DrugInteraction update data
         * @returns Success status
         */
        updateDrugInteraction: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateDrugInteraction(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchDrugInteractions();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update drug interaction with ID ${id}`,
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
         * Delete a drug interaction
         * @param id DrugInteraction ID
         * @returns Success status
         */
        deleteDrugInteraction: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteDrugInteraction(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchDrugInteractions();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete drug interaction with ID ${id}`,
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
         * Set active drug interaction
         * @param id ID of the active drug interaction or null
         */
        setActiveDrugInteraction: (id) => {
          set((state) => {
            state.activeDrugInteractionId = id;
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
            drugInteractions: [],
            activeDrugInteractionId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-drug-interaction-storage',
        partialize: (state) => ({
          activeDrugInteractionId: state.activeDrugInteractionId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get drug interaction by ID from store
 * @param id DrugInteraction ID
 * @returns The drug interaction or undefined if not found
 */
export const getDrugInteractionById = (id: number): DrugInteraction | undefined => {
  const { drugInteractions } = useDrugInteractionStore.getState();
  return drugInteractions.find((di) => di.id === id);
};

/**
 * Get active drug interaction from store
 * @returns The active drug interaction or undefined if not set
 */
export const getActiveDrugInteraction = (): DrugInteraction | undefined => {
  const { drugInteractions, activeDrugInteractionId } = useDrugInteractionStore.getState();
  return drugInteractions.find((di) => di.id === activeDrugInteractionId);
};
