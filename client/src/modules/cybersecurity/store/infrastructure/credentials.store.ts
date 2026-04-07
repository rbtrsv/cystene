'use client';

/**
 * Credential Store
 *
 * Zustand store for Credential model.
 * Uses immer middleware for easier state updates.
 * Uses devtools middleware for Redux DevTools integration.
 *
 * Backend: /server/apps/cybersecurity/subrouters/infrastructure_subrouters/credential_subrouter.py
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Credential,
  CreateCredential,
  UpdateCredential,
} from '../../schemas/infrastructure/credentials.schemas';
import {
  getCredentials,
  getCredential,
  createCredential as apiCreateCredential,
  updateCredential as apiUpdateCredential,
  deleteCredential as apiDeleteCredential,
  ListCredentialsParams,
} from '../../service/infrastructure/credentials.service';

/**
 * Credential store state interface
 */
export interface CredentialState {
  // State
  credentials: Credential[];
  activeCredentialId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchCredentials: (params?: ListCredentialsParams) => Promise<boolean>;
  fetchCredential: (id: number) => Promise<Credential | null>;
  createCredential: (data: CreateCredential) => Promise<boolean>;
  updateCredential: (id: number, data: UpdateCredential) => Promise<boolean>;
  deleteCredential: (id: number) => Promise<boolean>;
  setActiveCredential: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create credential store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useCredentialStore = create<CredentialState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      credentials: [],
      activeCredentialId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize credentials state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getCredentials();

          if (response.success && response.data) {
            set((state) => {
              state.credentials = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize credentials'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize credentials'
          });
        }
      },

      /**
       * Fetch all credentials with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchCredentials: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getCredentials(params);

          if (response.success && response.data) {
            set((state) => {
              state.credentials = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch credentials'
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
       * Fetch a specific credential by ID
       * @param id Credential ID
       * @returns Promise with credential or null
       */
      fetchCredential: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getCredential(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch credential with ID ${id}`
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
       * Create a new credential
       * @param data Credential creation data
       * @returns Success status
       */
      createCredential: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateCredential(data);

          if (response.success && response.data) {
            // After creating, refresh credentials list
            await get().fetchCredentials();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create credential'
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
       * Update an existing credential
       * @param id Credential ID
       * @param data Credential update data
       * @returns Success status
       */
      updateCredential: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateCredential(id, data);

          if (response.success && response.data) {
            // After updating, refresh credentials list
            await get().fetchCredentials();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update credential with ID ${id}`
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
       * Delete a credential
       * @param id Credential ID
       * @returns Success status
       */
      deleteCredential: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteCredential(id);

          if (response.success) {
            // After deleting, refresh credentials list
            await get().fetchCredentials();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete credential with ID ${id}`
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
       * Set active credential
       * @param id ID of the active credential or null
       */
      setActiveCredential: (id) => {
        set((state) => {
          state.activeCredentialId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset credential state to initial values
       */
      reset: () => {
        set({
          credentials: [],
          activeCredentialId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'cystene-credential-storage',
        partialize: (state) => ({
          activeCredentialId: state.activeCredentialId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get credential by ID from store
 * @param id Credential ID
 * @returns The credential or undefined if not found
 */
export const getCredentialById = (id: number): Credential | undefined => {
  const { credentials } = useCredentialStore.getState();
  return credentials.find((item) => item.id === id);
};

/**
 * Get active credential from store
 * @returns The active credential or undefined if not set
 */
export const getActiveCredential = (): Credential | undefined => {
  const { credentials, activeCredentialId } = useCredentialStore.getState();
  return credentials.find((item) => item.id === activeCredentialId);
};
