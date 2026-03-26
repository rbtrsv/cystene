'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  UserTreatmentLog,
  CreateUserTreatmentLog,
  UpdateUserTreatmentLog,
} from '@/modules/nexotype/schemas/user/user-treatment-log.schemas';
import {
  getUserTreatmentLogs,
  getUserTreatmentLog,
  createUserTreatmentLog as apiCreateUserTreatmentLog,
  updateUserTreatmentLog as apiUpdateUserTreatmentLog,
  deleteUserTreatmentLog as apiDeleteUserTreatmentLog,
  ListUserTreatmentLogsParams,
} from '@/modules/nexotype/service/user/user-treatment-log.service';

/**
 * UserTreatmentLog store state interface
 */
export interface UserTreatmentLogState {
  // State
  userTreatmentLogs: UserTreatmentLog[];
  activeUserTreatmentLogId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchUserTreatmentLogs: (params?: ListUserTreatmentLogsParams) => Promise<boolean>;
  fetchUserTreatmentLog: (id: number) => Promise<UserTreatmentLog | null>;
  createUserTreatmentLog: (data: CreateUserTreatmentLog) => Promise<boolean>;
  updateUserTreatmentLog: (id: number, data: UpdateUserTreatmentLog) => Promise<boolean>;
  deleteUserTreatmentLog: (id: number) => Promise<boolean>;
  setActiveUserTreatmentLog: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create user treatment log store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useUserTreatmentLogStore = create<UserTreatmentLogState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        userTreatmentLogs: [],
        activeUserTreatmentLogId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize user treatment logs state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getUserTreatmentLogs();

            if (response.success && response.data) {
              set((state) => {
                state.userTreatmentLogs = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize user treatment logs',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize user treatment logs',
            });
          }
        },

        /**
         * Fetch all user treatment logs with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchUserTreatmentLogs: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getUserTreatmentLogs(params);

            if (response.success && response.data) {
              set((state) => {
                state.userTreatmentLogs = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch user treatment logs',
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
         * Fetch a specific user treatment log by ID
         * @param id UserTreatmentLog ID
         * @returns Promise with user treatment log or null
         */
        fetchUserTreatmentLog: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getUserTreatmentLog(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch user treatment log with ID ${id}`,
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
         * Create a new user treatment log
         * @param data UserTreatmentLog creation data
         * @returns Success status
         */
        createUserTreatmentLog: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateUserTreatmentLog(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchUserTreatmentLogs();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create user treatment log',
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
         * Update an existing user treatment log
         * @param id UserTreatmentLog ID
         * @param data UserTreatmentLog update data
         * @returns Success status
         */
        updateUserTreatmentLog: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateUserTreatmentLog(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchUserTreatmentLogs();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update user treatment log with ID ${id}`,
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
         * Delete a user treatment log
         * @param id UserTreatmentLog ID
         * @returns Success status
         */
        deleteUserTreatmentLog: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteUserTreatmentLog(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchUserTreatmentLogs();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete user treatment log with ID ${id}`,
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
         * Set active user treatment log
         * @param id ID of the active user treatment log or null
         */
        setActiveUserTreatmentLog: (id) => {
          set((state) => {
            state.activeUserTreatmentLogId = id;
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
            userTreatmentLogs: [],
            activeUserTreatmentLogId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-user-treatment-log-storage',
        partialize: (state) => ({
          activeUserTreatmentLogId: state.activeUserTreatmentLogId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get user treatment log by ID from store
 * @param id UserTreatmentLog ID
 * @returns The user treatment log or undefined if not found
 */
export const getUserTreatmentLogById = (id: number): UserTreatmentLog | undefined => {
  const { userTreatmentLogs } = useUserTreatmentLogStore.getState();
  return userTreatmentLogs.find((utl) => utl.id === id);
};

/**
 * Get active user treatment log from store
 * @returns The active user treatment log or undefined if not set
 */
export const getActiveUserTreatmentLog = (): UserTreatmentLog | undefined => {
  const { userTreatmentLogs, activeUserTreatmentLogId } = useUserTreatmentLogStore.getState();
  return userTreatmentLogs.find((utl) => utl.id === activeUserTreatmentLogId);
};
