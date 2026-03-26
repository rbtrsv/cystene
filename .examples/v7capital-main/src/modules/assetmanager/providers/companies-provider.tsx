'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useCompaniesStore } from '../store/companies.store';
import { type Company, type CompanyWithUsers, type CompanyUserWithProfile } from '../schemas/companies.schemas';

/**
 * Context type for the companies provider
 */
export interface CompaniesContextType {
  // State
  companies: Company[];
  selectedCompany: CompanyWithUsers | null;
  companyUsers: CompanyUserWithProfile[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCompanies: () => Promise<void>;
  fetchCompany: (id: number) => Promise<void>;
  setSelectedCompany: (company: Company | null) => void;
  clearError: () => void;
}

// Create the context
export const CompaniesContext = createContext<CompaniesContextType | null>(null);

/**
 * Provider component for companies-related state and actions
 */
export function CompaniesProvider({ 
  children,
  initialFetch = true
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    companies,
    selectedCompany,
    companyUsers,
    isLoading,
    error,
    fetchCompanies,
    fetchCompany,
    setSelectedCompany,
    clearError
  } = useCompaniesStore();
  
  // Fetch companies on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch) {
      fetchCompanies().catch(error => {
        if (isMounted) {
          console.error('Error fetching companies:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialFetch, fetchCompanies]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<CompaniesContextType>(() => ({
    companies,
    selectedCompany,
    companyUsers,
    isLoading,
    error,
    fetchCompanies,
    fetchCompany,
    setSelectedCompany,
    clearError
  }), [
    companies,
    selectedCompany,
    companyUsers,
    isLoading,
    error,
    fetchCompanies,
    fetchCompany,
    setSelectedCompany,
    clearError
  ]);
  
  return (
    <CompaniesContext.Provider value={contextValue}>
      {children}
    </CompaniesContext.Provider>
  );
}

/**
 * Hook to use the companies context
 * @throws Error if used outside of a CompaniesProvider
 */
export function useCompaniesContext(): CompaniesContextType {
  const context = useContext(CompaniesContext);
  
  if (!context) {
    throw new Error('useCompaniesContext must be used within a CompaniesProvider');
  }
  
  return context;
}
