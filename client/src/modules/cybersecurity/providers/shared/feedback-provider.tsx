'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useFeedbackStore } from '../../store/shared/feedback.store';
import { type Feedback } from '../../schemas/shared/feedback.schemas';

/**
 * Context type for the feedback provider
 */
export interface FeedbackContextType {
  // State
  feedbacks: Feedback[];
  activeFeedbackId: number | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveFeedback: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const FeedbackContext = createContext<FeedbackContextType | null>(null);

/**
 * Provider component for feedback-related state and actions.
 *
 * Feedback is page-level and un-gated, so it does NOT auto-fetch on app boot
 * (initialFetch defaults to false) — the feedback page triggers the first load.
 */
export function FeedbackProvider({
  children,
  initialFetch = false,
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    feedbacks,
    activeFeedbackId,
    isLoading,
    error,
    setActiveFeedback,
    clearError,
    fetchFeedbackList,
  } = useFeedbackStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useFeedbackStore.persist.rehydrate();
  }, []);

  // Optionally load the list on mount (off by default — the page fetches lazily)
  useEffect(() => {
    let isMounted = true;

    if (initialFetch) {
      fetchFeedbackList().catch((err) => {
        if (isMounted) {
          console.error('Error fetching feedback:', err);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, fetchFeedbackList]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<FeedbackContextType>(() => ({
    feedbacks,
    activeFeedbackId,
    isLoading,
    error,
    setActiveFeedback,
    clearError,
  }), [
    feedbacks,
    activeFeedbackId,
    isLoading,
    error,
    setActiveFeedback,
    clearError,
  ]);

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
    </FeedbackContext.Provider>
  );
}

/**
 * Default export
 */
export default FeedbackProvider;
