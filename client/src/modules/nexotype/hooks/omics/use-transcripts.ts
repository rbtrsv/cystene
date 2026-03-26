'use client';

import { useContext } from 'react';
import { TranscriptContext, TranscriptContextType } from '@/modules/nexotype/providers/omics/transcript-provider';
import { useTranscriptStore } from '@/modules/nexotype/store/omics/transcript.store';
import {
  type Transcript,
  type CreateTranscript,
  type UpdateTranscript,
} from '@/modules/nexotype/schemas/omics/transcript.schemas';
import { ListTranscriptsParams } from '@/modules/nexotype/service/omics/transcript.service';

/**
 * Hook to use the transcript context
 * @throws Error if used outside of a TranscriptProvider
 */
export function useTranscriptContext(): TranscriptContextType {
  const context = useContext(TranscriptContext);

  if (!context) {
    throw new Error('useTranscriptContext must be used within a TranscriptProvider');
  }

  return context;
}

/**
 * Custom hook that combines transcript context and store
 * to provide a simplified interface for transcript functionality
 *
 * @returns Transcript utilities and state
 */
export function useTranscripts() {
  // Get data from transcript context
  const {
    transcripts,
    activeTranscriptId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveTranscript,
    clearError: clearContextError,
  } = useTranscriptContext();

  // Get additional actions from transcript store
  const {
    fetchTranscripts,
    fetchTranscript,
    createTranscript,
    updateTranscript,
    deleteTranscript,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useTranscriptStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active transcript
  const activeTranscript = transcripts.find(
    (t: Transcript) => t.id === activeTranscriptId
  ) || null;

  return {
    // State
    transcripts,
    activeTranscriptId,
    activeTranscript,
    isLoading,
    error,
    isInitialized,

    // Transcript actions
    fetchTranscripts,
    fetchTranscript,
    createTranscript,
    updateTranscript,
    deleteTranscript,
    setActiveTranscript,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return transcripts.find((t: Transcript) => t.id === id);
    },
    getByName: (id: number) => {
      const t = transcripts.find((tr: Transcript) => tr.id === id);
      return t ? t.ensembl_transcript_id : 'Unknown Transcript';
    },
    getByEnsemblTranscriptId: (ensemblTranscriptId: string) => {
      return transcripts.find((t: Transcript) => t.ensembl_transcript_id === ensemblTranscriptId);
    },
    getByGeneId: (geneId: number) => {
      return transcripts.filter((t: Transcript) => t.gene_id === geneId);
    },
    getCanonical: () => {
      return transcripts.filter((t: Transcript) => t.is_canonical);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListTranscriptsParams) => {
      return await fetchTranscripts(filters);
    },
    createWithData: async (data: CreateTranscript) => {
      return await createTranscript(data);
    },
    updateWithData: async (id: number, data: UpdateTranscript) => {
      return await updateTranscript(id, data);
    },
  };
}

export default useTranscripts;
