'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useTranscriptStore } from '@/modules/nexotype/store/omics/transcript.store';
import { type Transcript } from '@/modules/nexotype/schemas/omics/transcript.schemas';

/**
 * Context type for the transcripts provider
 */
export interface TranscriptContextType {
  // State
  transcripts: Transcript[];
  activeTranscriptId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveTranscript: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const TranscriptContext = createContext<TranscriptContextType | null>(null);

/**
 * Provider component for transcript-related state and actions
 */
export function TranscriptProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    transcripts,
    activeTranscriptId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTranscript,
    clearError,
  } = useTranscriptStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useTranscriptStore.persist.rehydrate();
  }, []);

  // Initialize transcripts on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing transcripts:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<TranscriptContextType>(() => ({
    transcripts,
    activeTranscriptId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTranscript,
    clearError,
  }), [
    transcripts,
    activeTranscriptId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTranscript,
    clearError,
  ]);

  return (
    <TranscriptContext.Provider value={contextValue}>
      {children}
    </TranscriptContext.Provider>
  );
}

/**
 * Default export
 */
export default TranscriptProvider;
