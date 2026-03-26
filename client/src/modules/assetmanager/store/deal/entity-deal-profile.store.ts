'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  EntityDealProfile,
  CreateEntityDealProfile,
  UpdateEntityDealProfile,
} from '../../schemas/deal/entity-deal-profile.schemas';
import {
  getEntityDealProfiles,
  getEntityDealProfile,
  createEntityDealProfile as apiCreateEntityDealProfile,
  updateEntityDealProfile as apiUpdateEntityDealProfile,
  deleteEntityDealProfile as apiDeleteEntityDealProfile,
  ListEntityDealProfilesParams
} from '../../service/deal/entity-deal-profile.service';

/**
 * EntityDealProfile store state interface
 */
export interface EntityDealProfileState {
  // State
  entityDealProfiles: EntityDealProfile[];
  activeEntityDealProfileId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchEntityDealProfiles: (params?: ListEntityDealProfilesParams) => Promise<boolean>;
  fetchEntityDealProfile: (id: number) => Promise<EntityDealProfile | null>;
  createEntityDealProfile: (data: CreateEntityDealProfile) => Promise<boolean>;
  updateEntityDealProfile: (id: number, data: UpdateEntityDealProfile) => Promise<boolean>;
  deleteEntityDealProfile: (id: number) => Promise<boolean>;
  setActiveEntityDealProfile: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create entity deal profile store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useEntityDealProfileStore = create<EntityDealProfileState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      entityDealProfiles: [],
      activeEntityDealProfileId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize entity deal profiles state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getEntityDealProfiles();

          if (response.success && response.data) {
            set((state) => {
              state.entityDealProfiles = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active entity deal profile if not already set and entity deal profiles exist
              if (response.data && response.data.length > 0 && state.activeEntityDealProfileId === null) {
                state.activeEntityDealProfileId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize entity deal profiles'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize entity deal profiles'
          });
        }
      },

      /**
       * Fetch all entity deal profiles with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchEntityDealProfiles: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getEntityDealProfiles(params);

          if (response.success && response.data) {
            set((state) => {
              state.entityDealProfiles = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch entity deal profiles'
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
       * Fetch a specific entity deal profile by ID
       * @param id EntityDealProfile ID
       * @returns Promise with entity deal profile or null
       */
      fetchEntityDealProfile: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getEntityDealProfile(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch entity deal profile with ID ${id}`
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
       * Create a new entity deal profile
       * @param data EntityDealProfile creation data
       * @returns Success status
       */
      createEntityDealProfile: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateEntityDealProfile(data);

          if (response.success && response.data) {
            // After creating, refresh entity deal profiles list
            await get().fetchEntityDealProfiles();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create entity deal profile'
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
       * Update an existing entity deal profile
       * @param id EntityDealProfile ID
       * @param data EntityDealProfile update data
       * @returns Success status
       */
      updateEntityDealProfile: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateEntityDealProfile(id, data);

          if (response.success && response.data) {
            // After updating, refresh entity deal profiles list
            await get().fetchEntityDealProfiles();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update entity deal profile with ID ${id}`
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
       * Delete an entity deal profile
       * @param id EntityDealProfile ID
       * @returns Success status
       */
      deleteEntityDealProfile: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteEntityDealProfile(id);

          if (response.success) {
            // After deleting, refresh entity deal profiles list
            await get().fetchEntityDealProfiles();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete entity deal profile with ID ${id}`
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
       * Set active entity deal profile
       * @param id ID of the active entity deal profile or null
       */
      setActiveEntityDealProfile: (id) => {
        set((state) => {
          state.activeEntityDealProfileId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset entity deal profile state to initial values
       */
      reset: () => {
        set({
          entityDealProfiles: [],
          activeEntityDealProfileId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-entity-deal-profile-storage',
        partialize: (state) => ({
          activeEntityDealProfileId: state.activeEntityDealProfileId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get entity deal profile by ID from store
 * @param id EntityDealProfile ID
 * @returns The entity deal profile or undefined if not found
 */
export const getEntityDealProfileById = (id: number): EntityDealProfile | undefined => {
  const { entityDealProfiles } = useEntityDealProfileStore.getState();
  return entityDealProfiles.find((profile) => profile.id === id);
};

/**
 * Get active entity deal profile from store
 * @returns The active entity deal profile or undefined if not set
 */
export const getActiveEntityDealProfile = (): EntityDealProfile | undefined => {
  const { entityDealProfiles, activeEntityDealProfileId } = useEntityDealProfileStore.getState();
  return entityDealProfiles.find((profile) => profile.id === activeEntityDealProfileId);
};
