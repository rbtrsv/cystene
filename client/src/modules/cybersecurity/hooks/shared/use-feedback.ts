'use client';

import { useContext } from 'react';
import { FeedbackContext, FeedbackContextType } from '../../providers/shared/feedback-provider';
import { useFeedbackStore } from '../../store/shared/feedback.store';

/**
 * Hook to use the feedback context
 * @throws Error if used outside of a FeedbackProvider
 */
export function useFeedbackContext(): FeedbackContextType {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error('useFeedbackContext must be used within a FeedbackProvider');
  }

  return context;
}

/**
 * Custom hook that combines feedback context (state) and store (actions) into a
 * single simplified interface for the feedback page.
 *
 * @returns Feedback state + CRUD actions
 */
export function useFeedback() {
  // State from the context (provider)
  const {
    feedbacks,
    activeFeedbackId,
    isLoading,
    error,
    setActiveFeedback,
    clearError,
  } = useFeedbackContext();

  // Actions from the store
  const {
    fetchFeedbackList,
    fetchFeedback,
    createFeedback,
    updateFeedback,
    adminUpdateFeedback,
    deleteFeedback,
  } = useFeedbackStore();

  // The currently-selected feedback (for the detail dialog), resolved from the list
  const activeFeedback = feedbacks.find((item) => item.id === activeFeedbackId) || null;

  return {
    // State
    feedbacks,
    activeFeedbackId,
    activeFeedback,
    isLoading,
    error,

    // Actions
    fetchFeedbackList,
    fetchFeedback,
    createFeedback,
    updateFeedback,
    adminUpdateFeedback,
    deleteFeedback,
    setActiveFeedback,
    clearError,
  };
}
