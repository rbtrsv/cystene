'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Entity,
  CreateEntity,
  UpdateEntity,
  EntityDiscoveryResult,
} from '../../schemas/entity/entity.schemas';
import {
  getEntities,
  getEntity,
  createEntity as apiCreateEntity,
  updateEntity as apiUpdateEntity,
  deleteEntity as apiDeleteEntity,
  discoverEntities as apiDiscoverEntities,
  generateInviteCode as apiGenerateInviteCode,
  revokeInviteCode as apiRevokeInviteCode,
  joinByInviteCode as apiJoinByInviteCode,
  ListEntitiesParams
} from '../../service/entity/entity.service';

/**
 * Entity store state interface
 */
export interface EntityState {
  // State
  entities: Entity[];
  activeEntityId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchEntities: (params?: ListEntitiesParams) => Promise<boolean>;
  fetchEntity: (id: number) => Promise<Entity | null>;
  createEntity: (data: CreateEntity) => Promise<boolean>;
  updateEntity: (id: number, data: UpdateEntity) => Promise<boolean>;
  deleteEntity: (id: number) => Promise<boolean>;
  discoverEntities: (q: string, organizationId: number, entityType?: string) => Promise<EntityDiscoveryResult[]>;
  generateInviteCode: (entityId: number) => Promise<boolean>;
  revokeInviteCode: (entityId: number) => Promise<boolean>;
  joinByInviteCode: (code: string, organizationId: number) => Promise<{ success: boolean; message?: string; error?: string }>;
  setActiveEntity: (entityId: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create entity store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useEntityStore = create<EntityState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      entities: [],
      activeEntityId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize entities state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getEntities();

          if (response.success && response.data) {
            set((state) => {
              state.entities = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active entity if not already set and entities exist
              if (response.data && response.data.length > 0 && state.activeEntityId === null) {
                state.activeEntityId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize entities'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize entities'
          });
        }
      },

      /**
       * Fetch all entities with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchEntities: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getEntities(params);

          if (response.success && response.data) {
            set((state) => {
              state.entities = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch entities'
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
       * Fetch a specific entity by ID
       * @param id Entity ID
       * @returns Promise with entity or null
       */
      fetchEntity: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getEntity(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch entity with ID ${id}`
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
       * Create a new entity
       * @param data Entity creation data
       * @returns Success status
       */
      createEntity: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateEntity(data);

          if (response.success && response.data) {
            // After creating, refresh entities list
            await get().fetchEntities();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create entity'
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
       * Update an existing entity
       * @param id Entity ID
       * @param data Entity update data
       * @returns Success status
       */
      updateEntity: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateEntity(id, data);

          if (response.success && response.data) {
            // After updating, refresh entities list
            await get().fetchEntities();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update entity with ID ${id}`
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
       * Delete an entity
       * @param id Entity ID
       * @returns Success status
       */
      deleteEntity: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteEntity(id);

          if (response.success) {
            // After deleting, refresh entities list
            await get().fetchEntities();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete entity with ID ${id}`
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
       * Search for discoverable entities across the platform (cross-org)
       * Why: enables cross-org stakeholder creation via discovery search
       * @param q Search query (min 2 chars)
       * @param entityType Optional entity type filter
       * @returns List of minimal entity results (id, name, entity_type)
       */
      discoverEntities: async (q, organizationId, entityType) => {
        return await apiDiscoverEntities(q, organizationId, entityType);
      },

      /**
       * Generate an invite code for an entity
       */
      generateInviteCode: async (entityId) => {
        const response = await apiGenerateInviteCode(entityId);
        if (response.success && response.data) {
          // Update entity in store with new invite_code
          set((state) => {
            const idx = state.entities.findIndex(e => e.id === entityId);
            if (idx !== -1) state.entities[idx] = response.data!;
          });
          return true;
        }
        set({ error: response.error || 'Failed to generate invite code' });
        return false;
      },

      /**
       * Revoke the invite code for an entity
       */
      revokeInviteCode: async (entityId) => {
        const response = await apiRevokeInviteCode(entityId);
        if (response.success && response.data) {
          // Update entity in store with null invite_code
          set((state) => {
            const idx = state.entities.findIndex(e => e.id === entityId);
            if (idx !== -1) state.entities[idx] = response.data!;
          });
          return true;
        }
        set({ error: response.error || 'Failed to revoke invite code' });
        return false;
      },

      /**
       * Join an entity using an invite code
       */
      joinByInviteCode: async (code, organizationId) => {
        return await apiJoinByInviteCode(code, organizationId);
      },

      /**
       * Set active entity
       * @param entityId ID of the active entity or null
       */
      setActiveEntity: (entityId) => {
        set((state) => {
          state.activeEntityId = entityId;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset entity state to initial values
       */
      reset: () => {
        set({
          entities: [],
          activeEntityId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-entity-storage',
        partialize: (state) => ({
          activeEntityId: state.activeEntityId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get entity by ID from store
 * @param id Entity ID
 * @returns The entity or undefined if not found
 */
export const getEntityById = (id: number): Entity | undefined => {
  const { entities } = useEntityStore.getState();
  return entities.find((entity) => entity.id === id);
};

/**
 * Get active entity from entity store
 * @returns The active entity or undefined if not set
 */
export const getActiveEntity = (): Entity | undefined => {
  const { entities, activeEntityId } = useEntityStore.getState();
  return entities.find((entity) => entity.id === activeEntityId);
};
