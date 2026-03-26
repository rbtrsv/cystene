'use client';

import { useCompaniesContext } from '../providers/companies-provider';
import { useCompaniesStore } from '../store/companies.store';
import {
  type Company,
  type CompanyWithUsers,
  type CompanyUserWithProfile,
  type CompanyRole
} from '../schemas/companies.schemas';

/**
 * Custom hook that combines company context and store
 * to provide a simplified interface for company functionality
 * 
 * @returns Company utilities and state
 */
export function useCompanies() {
  // Get data from company context
  const {
    companies,
    selectedCompany,
    companyUsers,
    isLoading: contextLoading,
    error: contextError,
    fetchCompanies,
    fetchCompany,
    setSelectedCompany,
    clearError: clearContextError
  } = useCompaniesContext();

  // Get additional actions from company store
  const {
    addCompany,
    editCompany,
    removeCompany,
    fetchCompanyUsers,
    addUserToCompany,
    updateUserRole,
    removeUserFromCompany,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useCompaniesStore();

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
    companies,
    selectedCompany,
    companyUsers,
    isLoading,
    error,
    
    // Company actions
    fetchCompanies,
    fetchCompany,
    addCompany,
    editCompany,
    removeCompany,
    setSelectedCompany,
    
    // Company user actions
    fetchCompanyUsers,
    addUserToCompany,
    updateUserRole,
    removeUserFromCompany,
    
    // Utility actions
    clearError,
    
    // Helper methods
    hasCompanies: () => companies.length > 0,
    getCompanyById: (id: number) => companies.find(c => c.id === id),
    getCompanyName: (id: number) => {
      const company = companies.find(c => c.id === id);
      return company ? company.name : 'Unknown Company';
    },
    getUserRole: (companyId: number, userProfileId: number): CompanyRole | null => {
      // If we have the selected company and it matches the requested ID
      if (selectedCompany && selectedCompany.id === companyId) {
        const user = selectedCompany.users?.find(u => u.userProfileId === userProfileId);
        return user ? user.role : null;
      }
      
      // Otherwise, check the companyUsers array
      const user = companyUsers.find(
        u => u.companyId === companyId && u.userProfileId === userProfileId
      );
      return user ? user.role : null;
    },
    isUserInCompany: (companyId: number, userProfileId: number): boolean => {
      // If we have the selected company and it matches the requested ID
      if (selectedCompany && selectedCompany.id === companyId) {
        return selectedCompany.users?.some(u => u.userProfileId === userProfileId) || false;
      }
      
      // Otherwise, check the companyUsers array
      return companyUsers.some(
        u => u.companyId === companyId && u.userProfileId === userProfileId
      );
    }
  };
}

export default useCompanies;
