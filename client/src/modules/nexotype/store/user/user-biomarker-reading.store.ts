'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  UserBiomarkerReading,
  CreateUserBiomarkerReading,
  UpdateUserBiomarkerReading,
} from '@/modules/nexotype/schemas/user/user-biomarker-reading.schemas';
import {
  getUserBiomarkerReadings,
  getUserBiomarkerReading,
  createUserBiomarkerReading as apiCreateUserBiomarkerReading,
  updateUserBiomarkerReading as apiUpdateUserBiomarkerReading,
  deleteUserBiomarkerReading as apiDeleteUserBiomarkerReading,
  ListUserBiomarkerReadingsParams,
} from '@/modules/nexotype/service/user/user-biomarker-reading.service';

/**
 * UserBiomarkerReading store state interface
 */
export interface UserBiomarkerReadingState {
  // State
  userBiomarkerReadings: UserBiomarkerReading[];
  activeUserBiomarkerReadingId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchUserBiomarkerReadings: (params?: ListUserBiomarkerReadingsParams) => Promise<boolean>;
  fetchUserBiomarkerReading: (id: number) => Promise<UserBiomarkerReading | null>;
  createUserBiomarkerReading: (data: CreateUserBiomarkerReading) => Promise<boolean>;
  updateUserBiomarkerReading: (id: number, data: UpdateUserBiomarkerReading) => Promise<boolean>;
  deleteUserBiomarkerReading: (id: number) => Promise<boolean>;
  setActiveUserBiomarkerReading: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create user biomarker reading store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useUserBiomarkerReadingStore = create<UserBiomarkerReadingState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        userBiomarkerReadings: [],
        activeUserBiomarkerReadingId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize user biomarker readings state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getUserBiomarkerReadings();

            if (response.success && response.data) {
              set((state) => {
                state.userBiomarkerReadings = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize user biomarker readings',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize user biomarker readings',
            });
          }
        },

        /**
         * Fetch all user biomarker readings with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchUserBiomarkerReadings: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getUserBiomarkerReadings(params);

            if (response.success && response.data) {
              set((state) => {
                state.userBiomarkerReadings = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch user biomarker readings',
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
         * Fetch a specific user biomarker reading by ID
         * @param id UserBiomarkerReading ID
         * @returns Promise with user biomarker reading or null
         */
        fetchUserBiomarkerReading: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getUserBiomarkerReading(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch user biomarker reading with ID ${id}`,
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
         * Create a new user biomarker reading
         * @param data UserBiomarkerReading creation data
         * @returns Success status
         */
        createUserBiomarkerReading: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateUserBiomarkerReading(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchUserBiomarkerReadings();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create user biomarker reading',
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
         * Update an existing user biomarker reading
         * @param id UserBiomarkerReading ID
         * @param data UserBiomarkerReading update data
         * @returns Success status
         */
        updateUserBiomarkerReading: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateUserBiomarkerReading(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchUserBiomarkerReadings();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update user biomarker reading with ID ${id}`,
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
         * Delete a user biomarker reading
         * @param id UserBiomarkerReading ID
         * @returns Success status
         */
        deleteUserBiomarkerReading: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteUserBiomarkerReading(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchUserBiomarkerReadings();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete user biomarker reading with ID ${id}`,
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
         * Set active user biomarker reading
         * @param id ID of the active user biomarker reading or null
         */
        setActiveUserBiomarkerReading: (id) => {
          set((state) => {
            state.activeUserBiomarkerReadingId = id;
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
            userBiomarkerReadings: [],
            activeUserBiomarkerReadingId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-user-biomarker-reading-storage',
        partialize: (state) => ({
          activeUserBiomarkerReadingId: state.activeUserBiomarkerReadingId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get user biomarker reading by ID from store
 * @param id UserBiomarkerReading ID
 * @returns The user biomarker reading or undefined if not found
 */
export const getUserBiomarkerReadingById = (id: number): UserBiomarkerReading | undefined => {
  const { userBiomarkerReadings } = useUserBiomarkerReadingStore.getState();
  return userBiomarkerReadings.find((ubr) => ubr.id === id);
};

/**
 * Get active user biomarker reading from store
 * @returns The active user biomarker reading or undefined if not set
 */
export const getActiveUserBiomarkerReading = (): UserBiomarkerReading | undefined => {
  const { userBiomarkerReadings, activeUserBiomarkerReadingId } = useUserBiomarkerReadingStore.getState();
  return userBiomarkerReadings.find((ubr) => ubr.id === activeUserBiomarkerReadingId);
};
