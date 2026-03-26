'use client';

import { useSecuritiesContext } from '../providers/securities-provider';
import { useSecuritiesStore } from '../store/securities.store';
import { 
  type Security,
  type CreateSecurityInput,
  type UpdateSecurityInput,
  type SecurityType,
  securityTypeEnum,
  isStockSecurity,
  isConvertibleSecurity,
  isOptionSecurity,
  isWarrantSecurity,
  isBondSecurity
} from '../schemas/securities.schemas';

/**
 * Convert Zod enum to a Record for form options
 */
export function enumToRecord<T extends string>(enumObj: { enum: Record<string, T> }): Record<T, T> {
  return Object.values(enumObj.enum).reduce((acc, value) => {
    acc[value] = value;
    return acc;
  }, {} as Record<T, T>);
}

// Create constants from the Zod enums
export const SECURITY_TYPES = enumToRecord(securityTypeEnum);

/**
 * Custom hook that combines securities context and store
 * to provide a simplified interface for securities functionality
 * 
 * @returns Securities utilities and state
 */
export function useSecurities() {
  // Get data from securities context
  const {
    securities,
    selectedSecurity,
    isLoading: contextLoading,
    error: contextError,
    fetchSecurities,
    fetchSecuritiesByRound,
    fetchSecurity,
    setSelectedSecurity,
    clearError: clearContextError,
    reset
  } = useSecuritiesContext();

  // Get additional actions from securities store
  const {
    addSecurity,
    editSecurity,
    removeSecurity,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useSecuritiesStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  
  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  return {
    // State
    securities,
    selectedSecurity,
    isLoading,
    error,
    
    // Securities actions
    fetchSecurities,
    fetchSecuritiesByRound,
    fetchSecurity,
    addSecurity,
    editSecurity,
    removeSecurity,
    setSelectedSecurity,
    
    // Utility actions
    clearError,
    reset,
    
    // Helper methods
    hasSecurities: () => securities.length > 0,
    getSecurityById: (id: number) => securities.find(s => s.id === id),
    getSecurityName: (id: number) => {
      const security = securities.find(s => s.id === id);
      return security ? security.securityName : 'Unknown Security';
    },
    getSecurityCode: (id: number) => {
      const security = securities.find(s => s.id === id);
      return security ? security.code : '';
    },
    getSecurityType: (id: number) => {
      const security = securities.find(s => s.id === id);
      return security ? security.securityType : null;
    },
    getSecuritiesByType: (type: SecurityType): Security[] => {
      return securities.filter(security => security.securityType === type);
    },
    getCommonShares: (): Security[] => {
      return securities.filter(security => security.securityType === SECURITY_TYPES['Common Shares']);
    },
    getPreferredShares: (): Security[] => {
      return securities.filter(security => security.securityType === SECURITY_TYPES['Preferred Shares']);
    },
    getConvertibles: (): Security[] => {
      return securities.filter(security => security.securityType === SECURITY_TYPES['Convertible']);
    },
    getOptions: (): Security[] => {
      return securities.filter(security => security.securityType === SECURITY_TYPES['Option']);
    },
    getWarrants: (): Security[] => {
      return securities.filter(security => security.securityType === SECURITY_TYPES['Warrant']);
    },
    getBonds: (): Security[] => {
      return securities.filter(security => security.securityType === SECURITY_TYPES['Bond']);
    },
    getSecuritiesByRoundId: (roundId: number): Security[] => {
      return securities.filter(security => security.roundId === roundId);
    },
    isStock: (security: Security): boolean => {
      return isStockSecurity(security);
    },
    isConvertible: (security: Security): boolean => {
      return isConvertibleSecurity(security);
    },
    isOption: (security: Security): boolean => {
      return isOptionSecurity(security);
    },
    isWarrant: (security: Security): boolean => {
      return isWarrantSecurity(security);
    },
    isBond: (security: Security): boolean => {
      return isBondSecurity(security);
    },
    // Export the security types for use in components
    securityTypes: SECURITY_TYPES
  };
}

export default useSecurities;
