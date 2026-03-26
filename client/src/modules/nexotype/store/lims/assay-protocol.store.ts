'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  AssayProtocol,
  CreateAssayProtocol,
  UpdateAssayProtocol,
} from '@/modules/nexotype/schemas/lims/assay-protocol.schemas';
import {
  getAssayProtocols,
  getAssayProtocol,
  createAssayProtocol as apiCreateAssayProtocol,
  updateAssayProtocol as apiUpdateAssayProtocol,
  deleteAssayProtocol as apiDeleteAssayProtocol,
  ListAssayProtocolsParams,
} from '@/modules/nexotype/service/lims/assay-protocol.service';

/**
 * Assay protocol store state interface
 */
export interface AssayProtocolState {
  // State
  assayProtocols: AssayProtocol[];
  activeAssayProtocolId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchAssayProtocols: (params?: ListAssayProtocolsParams) => Promise<boolean>;
  fetchAssayProtocol: (id: number) => Promise<AssayProtocol | null>;
  createAssayProtocol: (data: CreateAssayProtocol) => Promise<boolean>;
  updateAssayProtocol: (id: number, data: UpdateAssayProtocol) => Promise<boolean>;
  deleteAssayProtocol: (id: number) => Promise<boolean>;
  setActiveAssayProtocol: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create assay protocol store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useAssayProtocolStore = create<AssayProtocolState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        assayProtocols: [],
        activeAssayProtocolId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize assay protocols state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getAssayProtocols();

            if (response.success && response.data) {
              set((state) => {
                state.assayProtocols = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize assay protocols',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize assay protocols',
            });
          }
        },

        /**
         * Fetch all assay protocols with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchAssayProtocols: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getAssayProtocols(params);

            if (response.success && response.data) {
              set((state) => {
                state.assayProtocols = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch assay protocols',
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
         * Fetch a specific assay protocol by ID
         * @param id AssayProtocol ID
         * @returns Promise with assay protocol or null
         */
        fetchAssayProtocol: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getAssayProtocol(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch assay protocol with ID ${id}`,
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
         * Create a new assay protocol
         * @param data AssayProtocol creation data
         * @returns Success status
         */
        createAssayProtocol: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateAssayProtocol(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchAssayProtocols();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create assay protocol',
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
         * Update an existing assay protocol
         * @param id AssayProtocol ID
         * @param data AssayProtocol update data
         * @returns Success status
         */
        updateAssayProtocol: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateAssayProtocol(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchAssayProtocols();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update assay protocol with ID ${id}`,
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
         * Delete an assay protocol
         * @param id AssayProtocol ID
         * @returns Success status
         */
        deleteAssayProtocol: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteAssayProtocol(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchAssayProtocols();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete assay protocol with ID ${id}`,
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
         * Set active assay protocol
         * @param id ID of the active assay protocol or null
         */
        setActiveAssayProtocol: (id) => {
          set((state) => {
            state.activeAssayProtocolId = id;
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
            assayProtocols: [],
            activeAssayProtocolId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-assay-protocol-storage',
        partialize: (state) => ({
          activeAssayProtocolId: state.activeAssayProtocolId,
        }),
        skipHydration: true,
      },
    ),
  ),
);

/**
 * Helper function to get assay protocol by ID from store
 * @param id AssayProtocol ID
 * @returns The assay protocol or undefined if not found
 */
export const getAssayProtocolById = (id: number): AssayProtocol | undefined => {
  const { assayProtocols } = useAssayProtocolStore.getState();
  return assayProtocols.find((ap) => ap.id === id);
};

/**
 * Get active assay protocol from store
 * @returns The active assay protocol or undefined if not set
 */
export const getActiveAssayProtocol = (): AssayProtocol | undefined => {
  const { assayProtocols, activeAssayProtocolId } = useAssayProtocolStore.getState();
  return assayProtocols.find((ap) => ap.id === activeAssayProtocolId);
};
