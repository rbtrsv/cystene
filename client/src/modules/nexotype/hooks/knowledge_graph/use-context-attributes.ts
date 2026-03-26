'use client';

import { useContext } from 'react';
import { ContextAttributeContext, ContextAttributeContextType } from '@/modules/nexotype/providers/knowledge_graph/context-attribute-provider';
import { useContextAttributeStore } from '@/modules/nexotype/store/knowledge_graph/context-attribute.store';
import {
  type ContextAttribute,
  type CreateContextAttribute,
  type UpdateContextAttribute,
} from '@/modules/nexotype/schemas/knowledge_graph/context-attribute.schemas';
import { ListContextAttributesParams } from '@/modules/nexotype/service/knowledge_graph/context-attribute.service';

/**
 * Hook to use the context attribute context
 * @throws Error if used outside of a ContextAttributeProvider
 */
export function useContextAttributeContext(): ContextAttributeContextType {
  const context = useContext(ContextAttributeContext);
  if (!context) {
    throw new Error('useContextAttributeContext must be used within a ContextAttributeProvider');
  }
  return context;
}

/**
 * Custom hook that combines context attribute context and store
 * to provide a simplified interface for context attribute functionality.
 *
 * @returns Context attribute utilities and state
 */
export function useContextAttributes() {
  // Get data from context attribute context
  const {
    contextAttributes,
    activeContextAttributeId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveContextAttribute,
    clearError: clearContextError,
  } = useContextAttributeContext();

  // Get additional actions from context attribute store
  const {
    fetchContextAttributes,
    fetchContextAttribute,
    createContextAttribute,
    updateContextAttribute,
    deleteContextAttribute,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useContextAttributeStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active context attribute
  const activeContextAttribute = contextAttributes.find(
    (contextAttribute: ContextAttribute) => contextAttribute.id === activeContextAttributeId
  ) || null;

  return {
    // State
    contextAttributes,
    activeContextAttributeId,
    activeContextAttribute,
    isLoading,
    error,
    isInitialized,
    fetchContextAttributes,
    fetchContextAttribute,
    createContextAttribute,
    updateContextAttribute,
    deleteContextAttribute,
    setActiveContextAttribute,
    initialize,
    clearError,
    // Helper methods
    getById: (id: number) => {
      return contextAttributes.find((contextAttribute: ContextAttribute) => contextAttribute.id === id);
    },
    // entity-specific helpers — filter context attributes by evidence assertion
    getByEvidenceId: (evidenceId: number) => {
      return contextAttributes.filter((contextAttribute: ContextAttribute) => contextAttribute.evidence_id === evidenceId);
    },
    fetchWithFilters: async (filters: ListContextAttributesParams) => {
      return await fetchContextAttributes(filters);
    },
    createWithData: async (data: CreateContextAttribute) => {
      return await createContextAttribute(data);
    },
    updateWithData: async (id: number, data: UpdateContextAttribute) => {
      return await updateContextAttribute(id, data);
    },
  };
}

export default useContextAttributes;
