'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ContextAttribute,
  CreateContextAttribute,
  UpdateContextAttribute,
} from '@/modules/nexotype/schemas/knowledge_graph/context-attribute.schemas';
import {
  getContextAttributes,
  getContextAttribute,
  createContextAttribute as apiCreateContextAttribute,
  updateContextAttribute as apiUpdateContextAttribute,
  deleteContextAttribute as apiDeleteContextAttribute,
  ListContextAttributesParams,
} from '@/modules/nexotype/service/knowledge_graph/context-attribute.service';

// Zustand state + action contract for this entity.
export interface ContextAttributeState {
  // State
  contextAttributes: ContextAttribute[];
  activeContextAttributeId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchContextAttributes: (params?: ListContextAttributesParams) => Promise<boolean>;
  fetchContextAttribute: (id: number) => Promise<ContextAttribute | null>;
  createContextAttribute: (data: CreateContextAttribute) => Promise<boolean>;
  updateContextAttribute: (id: number, data: UpdateContextAttribute) => Promise<boolean>;
  deleteContextAttribute: (id: number) => Promise<boolean>;
  setActiveContextAttribute: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Store implementation used by provider + hook layers.
export const useContextAttributeStore = create<ContextAttributeState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      contextAttributes: [],
      activeContextAttributeId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      // Bootstrap initial list state for first-load screens.
      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await getContextAttributes();
          if (response.success && response.data) {
            set((state) => {
              state.contextAttributes = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize context attributes',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize context attributes',
          });
        }
      },

      // Load list data with optional filters.
      fetchContextAttributes: async (params) => {
        set({ isLoading: true, error: null });
        try {
          const response = await getContextAttributes(params);
          if (response.success && response.data) {
            set((state) => {
              state.contextAttributes = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch context attributes',
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

      // Load one record for details pages and deep-links.
      fetchContextAttribute: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await getContextAttribute(id);
          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch context attribute with ID ${id}`,
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

      // Create and refresh list so UI remains consistent.
      createContextAttribute: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiCreateContextAttribute(data);
          if (response.success && response.data) {
            await get().fetchContextAttributes();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create context attribute',
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

      // Update and refresh list so UI remains consistent.
      updateContextAttribute: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiUpdateContextAttribute(id, data);
          if (response.success && response.data) {
            await get().fetchContextAttributes();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update context attribute with ID ${id}`,
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

      // Soft-delete and refresh list so archived rows are hidden.
      deleteContextAttribute: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiDeleteContextAttribute(id);
          if (response.success) {
            await get().fetchContextAttributes();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete context attribute with ID ${id}`,
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

      setActiveContextAttribute: (id) => {
        set((state) => {
          state.activeContextAttributeId = id;
        });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          contextAttributes: [],
          activeContextAttributeId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-context-attribute-storage',
        partialize: (state) => ({
          activeContextAttributeId: state.activeContextAttributeId,
        }),
        skipHydration: true,
      }
    ),
  ),
);

/**
 * Helper function to get context attribute by ID from store
 * @param id ContextAttribute ID
 * @returns The context attribute or undefined if not found
 */
export const getContextAttributeById = (id: number): ContextAttribute | undefined => {
  const { contextAttributes } = useContextAttributeStore.getState();
  return contextAttributes.find((contextAttribute) => contextAttribute.id === id);
};

/**
 * Get active context attribute from store
 * @returns The active context attribute or undefined if not set
 */
export const getActiveContextAttribute = (): ContextAttribute | undefined => {
  const { contextAttributes, activeContextAttributeId } = useContextAttributeStore.getState();
  return contextAttributes.find((contextAttribute) => contextAttribute.id === activeContextAttributeId);
};
