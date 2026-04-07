'use client';

/**
 * Scan Template Store
 *
 * Zustand store for ScanTemplate model.
 * Uses immer middleware for easier state updates.
 * Uses devtools middleware for Redux DevTools integration.
 *
 * Backend: /server/apps/cybersecurity/subrouters/execution_subrouters/scan_template_subrouter.py
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ScanTemplate,
  CreateScanTemplate,
  UpdateScanTemplate,
} from '../../schemas/execution/scan-templates.schemas';
import {
  getScanTemplates,
  getScanTemplate,
  createScanTemplate as apiCreateScanTemplate,
  updateScanTemplate as apiUpdateScanTemplate,
  deleteScanTemplate as apiDeleteScanTemplate,
  ListScanTemplatesParams,
} from '../../service/execution/scan-templates.service';

/**
 * Scan template store state interface
 */
export interface ScanTemplateState {
  // State
  scanTemplates: ScanTemplate[];
  activeScanTemplateId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchScanTemplates: (params?: ListScanTemplatesParams) => Promise<boolean>;
  fetchScanTemplate: (id: number) => Promise<ScanTemplate | null>;
  createScanTemplate: (data: CreateScanTemplate) => Promise<boolean>;
  updateScanTemplate: (id: number, data: UpdateScanTemplate) => Promise<boolean>;
  deleteScanTemplate: (id: number) => Promise<boolean>;
  setActiveScanTemplate: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create scan template store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useScanTemplateStore = create<ScanTemplateState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      scanTemplates: [],
      activeScanTemplateId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize scan templates state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getScanTemplates();

          if (response.success && response.data) {
            set((state) => {
              state.scanTemplates = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize scan templates'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize scan templates'
          });
        }
      },

      /**
       * Fetch all scan templates with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchScanTemplates: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getScanTemplates(params);

          if (response.success && response.data) {
            set((state) => {
              state.scanTemplates = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch scan templates'
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
       * Fetch a specific scan template by ID
       * @param id Scan template ID
       * @returns Promise with scan template or null
       */
      fetchScanTemplate: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getScanTemplate(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch scan template with ID ${id}`
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
       * Create a new scan template
       * @param data Scan template creation data
       * @returns Success status
       */
      createScanTemplate: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateScanTemplate(data);

          if (response.success && response.data) {
            // After creating, refresh scan templates list
            await get().fetchScanTemplates();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create scan template'
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
       * Update an existing scan template
       * @param id Scan template ID
       * @param data Scan template update data
       * @returns Success status
       */
      updateScanTemplate: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateScanTemplate(id, data);

          if (response.success && response.data) {
            // After updating, refresh scan templates list
            await get().fetchScanTemplates();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update scan template with ID ${id}`
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
       * Delete a scan template
       * @param id Scan template ID
       * @returns Success status
       */
      deleteScanTemplate: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteScanTemplate(id);

          if (response.success) {
            // After deleting, refresh scan templates list
            await get().fetchScanTemplates();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete scan template with ID ${id}`
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
       * Set active scan template
       * @param id ID of the active scan template or null
       */
      setActiveScanTemplate: (id) => {
        set((state) => {
          state.activeScanTemplateId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset scan template state to initial values
       */
      reset: () => {
        set({
          scanTemplates: [],
          activeScanTemplateId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'cystene-scan-template-storage',
        partialize: (state) => ({
          activeScanTemplateId: state.activeScanTemplateId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get scan template by ID from store
 * @param id Scan template ID
 * @returns The scan template or undefined if not found
 */
export const getScanTemplateById = (id: number): ScanTemplate | undefined => {
  const { scanTemplates } = useScanTemplateStore.getState();
  return scanTemplates.find((item) => item.id === id);
};

/**
 * Get active scan template from store
 * @returns The active scan template or undefined if not set
 */
export const getActiveScanTemplate = (): ScanTemplate | undefined => {
  const { scanTemplates, activeScanTemplateId } = useScanTemplateStore.getState();
  return scanTemplates.find((item) => item.id === activeScanTemplateId);
};
