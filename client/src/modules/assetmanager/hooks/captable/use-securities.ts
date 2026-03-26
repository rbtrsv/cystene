'use client';

import { useContext } from 'react';
import { SecurityContext, SecurityContextType } from '../../providers/captable/security-provider';
import { useSecurityStore } from '../../store/captable/security.store';
import {
  type Security,
  type CreateSecurity,
  type UpdateSecurity,
  type SecurityType,
  isStockSecurity,
  isConvertibleSecurity,
  isOptionSecurity,
  isWarrantSecurity,
  isBondSecurity,
  isSafeSecurity,
} from '../../schemas/captable/security.schemas';
import { ListSecuritiesParams } from '../../service/captable/security.service';

/**
 * Hook to use the security context
 * @throws Error if used outside of a SecurityProvider
 */
export function useSecurityContext(): SecurityContextType {
  const context = useContext(SecurityContext);

  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }

  return context;
}

/**
 * Custom hook that combines security context and store
 * to provide a simplified interface for security functionality
 *
 * @returns Security utilities and state
 */
export function useSecurities() {
  // Get data from security context
  const {
    securities,
    activeSecurityId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveSecurity,
    clearError: clearContextError
  } = useSecurityContext();

  // Get additional actions from security store
  const {
    fetchSecurities,
    fetchSecurity,
    createSecurity,
    updateSecurity,
    deleteSecurity,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useSecurityStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active security
  const activeSecurity = securities.find((s: Security) => s.id === activeSecurityId) || null;

  return {
    // State
    securities,
    activeSecurityId,
    activeSecurity,
    isLoading,
    error,
    isInitialized,

    // Security actions
    fetchSecurities,
    fetchSecurity,
    createSecurity,
    updateSecurity,
    deleteSecurity,
    setActiveSecurity,
    initialize,
    clearError,

    // Helper methods
    getSecurityById: (id: number) => {
      return securities.find((s: Security) => s.id === id);
    },
    getSecurityName: (id: number) => {
      const security = securities.find((s: Security) => s.id === id);
      return security ? security.security_name : 'Unknown Security';
    },
    getSecuritiesByType: (securityType: SecurityType) => {
      return securities.filter((s: Security) => s.security_type === securityType);
    },
    getSecuritiesByFundingRound: (fundingRoundId: number) => {
      return securities.filter((s: Security) => s.funding_round_id === fundingRoundId);
    },

    // Type guards re-exported for convenience
    isStockSecurity,
    isConvertibleSecurity,
    isOptionSecurity,
    isWarrantSecurity,
    isBondSecurity,
    isSafeSecurity,

    // Convenience wrapper functions
    fetchSecuritiesWithFilters: async (filters: ListSecuritiesParams) => {
      return await fetchSecurities(filters);
    },
    createSecurityWithData: async (data: CreateSecurity) => {
      return await createSecurity(data);
    },
    updateSecurityWithData: async (id: number, data: UpdateSecurity) => {
      return await updateSecurity(id, data);
    }
  };
}

export default useSecurities;
