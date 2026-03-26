'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Transcript,
  CreateTranscript,
  UpdateTranscript,
} from '@/modules/nexotype/schemas/omics/transcript.schemas';
import {
  getTranscripts,
  getTranscript,
  createTranscript as apiCreateTranscript,
  updateTranscript as apiUpdateTranscript,
  deleteTranscript as apiDeleteTranscript,
  ListTranscriptsParams,
} from '@/modules/nexotype/service/omics/transcript.service';

/**
 * Transcript store state interface
 */
export interface TranscriptState {
  // State
  transcripts: Transcript[];
  activeTranscriptId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchTranscripts: (params?: ListTranscriptsParams) => Promise<boolean>;
  fetchTranscript: (id: number) => Promise<Transcript | null>;
  createTranscript: (data: CreateTranscript) => Promise<boolean>;
  updateTranscript: (id: number, data: UpdateTranscript) => Promise<boolean>;
  deleteTranscript: (id: number) => Promise<boolean>;
  setActiveTranscript: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create transcript store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useTranscriptStore = create<TranscriptState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      transcripts: [],
      activeTranscriptId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize transcripts state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getTranscripts();

          if (response.success && response.data) {
            set((state) => {
              state.transcripts = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize transcripts',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize transcripts',
          });
        }
      },

      /**
       * Fetch all transcripts with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchTranscripts: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getTranscripts(params);

          if (response.success && response.data) {
            set((state) => {
              state.transcripts = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch transcripts',
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
       * Fetch a specific transcript by ID
       * @param id Transcript ID
       * @returns Promise with transcript or null
       */
      fetchTranscript: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getTranscript(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch transcript with ID ${id}`,
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
       * Create a new transcript
       * @param data Transcript creation data
       * @returns Success status
       */
      createTranscript: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateTranscript(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchTranscripts();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create transcript',
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
       * Update an existing transcript
       * @param id Transcript ID
       * @param data Transcript update data
       * @returns Success status
       */
      updateTranscript: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateTranscript(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchTranscripts();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update transcript with ID ${id}`,
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
       * Delete a transcript
       * @param id Transcript ID
       * @returns Success status
       */
      deleteTranscript: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteTranscript(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchTranscripts();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete transcript with ID ${id}`,
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
       * Set active transcript
       * @param id ID of the active transcript or null
       */
      setActiveTranscript: (id) => {
        set((state) => {
          state.activeTranscriptId = id;
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
          transcripts: [],
          activeTranscriptId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-transcript-storage',
        partialize: (state) => ({
          activeTranscriptId: state.activeTranscriptId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get transcript by ID from store
 * @param id Transcript ID
 * @returns The transcript or undefined if not found
 */
export const getTranscriptById = (id: number): Transcript | undefined => {
  const { transcripts } = useTranscriptStore.getState();
  return transcripts.find((t) => t.id === id);
};

/**
 * Get active transcript from store
 * @returns The active transcript or undefined if not set
 */
export const getActiveTranscript = (): Transcript | undefined => {
  const { transcripts, activeTranscriptId } = useTranscriptStore.getState();
  return transcripts.find((t) => t.id === activeTranscriptId);
};
