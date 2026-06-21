'use client';

/**
 * Feedback Store
 *
 * Zustand store for in-app feedback (bug reports, feature requests, questions).
 * Non-admins only ever load their own; admins load all (enforced server-side).
 *
 * Backend: /server/apps/cybersecurity/subrouters/shared/feedback_subrouter.py
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Feedback,
  CreateFeedback,
  UpdateFeedbackContent,
  UpdateFeedback,
} from '../../schemas/shared/feedback.schemas';
import {
  getFeedbackList,
  getFeedback,
  createFeedback as apiCreateFeedback,
  updateFeedback as apiUpdateFeedback,
  adminUpdateFeedback as apiAdminUpdateFeedback,
  deleteFeedback as apiDeleteFeedback,
  ListFeedbackParams,
} from '../../service/shared/feedback.service';

/**
 * Feedback store state interface
 */
export interface FeedbackState {
  // State
  feedbacks: Feedback[];
  activeFeedbackId: number | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchFeedbackList: (params?: ListFeedbackParams) => Promise<boolean>;
  fetchFeedback: (id: number) => Promise<Feedback | null>;
  createFeedback: (data: CreateFeedback) => Promise<boolean>;
  updateFeedback: (id: number, data: UpdateFeedbackContent) => Promise<boolean>;
  adminUpdateFeedback: (id: number, data: UpdateFeedback) => Promise<boolean>;
  deleteFeedback: (id: number) => Promise<boolean>;
  setActiveFeedback: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create feedback store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useFeedbackStore = create<FeedbackState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        feedbacks: [],
        activeFeedbackId: null,
        isLoading: false,
        error: null,

        /**
         * Fetch the feedback the user can see (own for members, all for admins)
         * @param params Optional status filter
         * @returns Success status
         */
        fetchFeedbackList: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getFeedbackList(params);

            if (response.success && response.data) {
              set((state) => {
                state.feedbacks = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({
                isLoading: false,
                error: response.error || 'Failed to fetch feedback',
              });
              return false;
            }
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return false;
          }
        },

        /**
         * Fetch a single feedback item by ID
         * @param id Feedback ID
         * @returns The feedback or null if not found / not allowed
         */
        fetchFeedback: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getFeedback(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            } else {
              set({
                isLoading: false,
                error: response.error || 'Failed to fetch feedback',
              });
              return null;
            }
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return null;
          }
        },

        /**
         * Submit new feedback, then refresh the list
         * @param data Feedback create payload
         * @returns Success status
         */
        createFeedback: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateFeedback(data);

            if (response.success && response.data) {
              // After creating, refresh the list so the new row appears
              await get().fetchFeedbackList();
              set({ isLoading: false });
              return true;
            } else {
              set({
                isLoading: false,
                error: response.error || 'Failed to submit feedback',
              });
              return false;
            }
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return false;
          }
        },

        /**
         * Edit feedback content (category/title/description), then refresh the list
         * @param id Feedback ID
         * @param data Content update payload
         * @returns Success status
         */
        updateFeedback: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateFeedback(id, data);

            if (response.success && response.data) {
              await get().fetchFeedbackList();
              set({ isLoading: false });
              return true;
            } else {
              set({
                isLoading: false,
                error: response.error || 'Failed to update feedback',
              });
              return false;
            }
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return false;
          }
        },

        /**
         * Admin triage update (status + admin_notes), then refresh the list
         * @param id Feedback ID
         * @param data Triage update payload
         * @returns Success status
         */
        adminUpdateFeedback: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiAdminUpdateFeedback(id, data);

            if (response.success && response.data) {
              await get().fetchFeedbackList();
              set({ isLoading: false });
              return true;
            } else {
              set({
                isLoading: false,
                error: response.error || 'Failed to triage feedback',
              });
              return false;
            }
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return false;
          }
        },

        /**
         * Delete feedback (soft delete), then refresh the list
         * @param id Feedback ID
         * @returns Success status
         */
        deleteFeedback: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteFeedback(id);

            if (response.success) {
              await get().fetchFeedbackList();
              set({ isLoading: false });
              return true;
            } else {
              set({
                isLoading: false,
                error: response.error || 'Failed to delete feedback',
              });
              return false;
            }
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return false;
          }
        },

        /**
         * Set the active feedback (for the detail dialog)
         * @param id Feedback ID or null to clear
         */
        setActiveFeedback: (id) => {
          set({ activeFeedbackId: id });
        },

        /**
         * Clear the current error
         */
        clearError: () => {
          set({ error: null });
        },

        /**
         * Reset the store to its initial state
         */
        reset: () => {
          set({
            feedbacks: [],
            activeFeedbackId: null,
            isLoading: false,
            error: null,
          });
        },
      })),
      {
        name: 'cystene-feedback-storage',
        partialize: (state) => ({
          activeFeedbackId: state.activeFeedbackId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get feedback by ID from store
 * @param id Feedback ID
 * @returns The feedback or undefined if not found
 */
export const getFeedbackById = (id: number): Feedback | undefined => {
  const { feedbacks } = useFeedbackStore.getState();
  return feedbacks.find((item) => item.id === id);
};
