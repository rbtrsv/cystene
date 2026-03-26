'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type Company, 
  type CompanyUser,
  type CompanyWithUsers,
  type CompanyUserWithProfile,
  type CompanyRole
} from '../schemas/companies.schemas';
import {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyUsers,
  addCompanyUser,
  updateCompanyUser,
  removeCompanyUser
} from '../actions/companies.actions';

/**
 * Companies store state interface
 */
export interface CompaniesState {
  // State
  companies: Company[];
  selectedCompany: CompanyWithUsers | null;
  companyUsers: CompanyUserWithProfile[];
  isLoading: boolean;
  error: string | null;
  
  // Company actions
  fetchCompanies: () => Promise<void>;
  fetchCompany: (id: number) => Promise<void>;
  addCompany: (name: string, website?: string | null, country?: string | null, initialRole?: CompanyRole) => Promise<boolean>;
  editCompany: (id: number, name: string, website?: string | null, country?: string | null) => Promise<boolean>;
  removeCompany: (id: number) => Promise<boolean>;
  
  // Company user actions
  fetchCompanyUsers: (companyId: number) => Promise<void>;
  addUserToCompany: (userProfileId: number, companyId: number, role: CompanyRole) => Promise<boolean>;
  updateUserRole: (userProfileId: number, companyId: number, role: CompanyRole) => Promise<boolean>;
  removeUserFromCompany: (userProfileId: number, companyId: number) => Promise<boolean>;
  
  // Utility actions
  setSelectedCompany: (company: Company | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create companies store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useCompaniesStore = create<CompaniesState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        companies: [],
        selectedCompany: null,
        companyUsers: [],
        isLoading: false,
        error: null,
        
        /**
         * Fetch all companies for the current user
         */
        fetchCompanies: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getCompanies();
            
            if (response.success && response.data) {
              set((state) => {
                state.companies = response.data || [];
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch companies'
              });
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
          }
        },
        
        /**
         * Fetch a single company by ID
         * @param id - Company ID
         */
        fetchCompany: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            // Fetch company details
            const companyResponse = await getCompany(id);
            
            if (!companyResponse.success || !companyResponse.data) {
              set({ 
                isLoading: false, 
                error: companyResponse.error || 'Failed to fetch company'
              });
              return;
            }
            
            // Fetch company users
            const usersResponse = await getCompanyUsers(id);
            
            if (usersResponse.success) {
              // Combine company with its users
              const companyWithUsers: CompanyWithUsers = {
                ...companyResponse.data,
                users: usersResponse.data || []
              };
              
              set((state) => {
                state.selectedCompany = companyWithUsers;
                state.companyUsers = usersResponse.data || [];
                state.isLoading = false;
              });
            } else {
              // Still set the company even if users fetch fails
              set((state) => {
                state.selectedCompany = {
                  ...companyResponse.data,
                  users: []
                };
                state.isLoading = false;
                state.error = usersResponse.error || 'Failed to fetch company users';
              });
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
          }
        },
        
        /**
         * Add a new company
         * @param name - Company name
         * @param website - Optional company website
         * @param country - Optional company country
         * @param initialRole - Optional role to assign to the creator (defaults to EDITOR)
         * @returns Success status
         */
        addCompany: async (name: string, website?: string | null, country?: string | null, initialRole?: CompanyRole) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await createCompany({ name, website, country }, initialRole);
            
            if (response.success && response.data) {
              // Add the new company to the list
              set((state) => {
                state.companies.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create company'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Edit an existing company
         * @param id - Company ID
         * @param name - Updated company name
         * @param website - Optional updated company website
         * @param country - Optional updated company country
         * @returns Success status
         */
        editCompany: async (id: number, name: string, website?: string | null, country?: string | null) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updateCompany(id, { name, website, country });
            
            if (response.success && response.data) {
              // Update the company in the list
              set((state) => {
                const index = state.companies.findIndex(c => c.id === id);
                if (index !== -1) {
                  state.companies[index] = response.data!;
                }
                
                // Also update the selected company if it's the same one
                if (state.selectedCompany && state.selectedCompany.id === id) {
                  state.selectedCompany = {
                    ...response.data!,
                    users: state.selectedCompany.users || []
                  };
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update company'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Remove a company
         * @param id - Company ID
         * @returns Success status
         */
        removeCompany: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await deleteCompany(id);
            
            if (response.success) {
              // Remove the company from the list
              set((state) => {
                state.companies = state.companies.filter(c => c.id !== id);
                
                // Clear selected company if it's the same one
                if (state.selectedCompany && state.selectedCompany.id === id) {
                  state.selectedCompany = null;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete company'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Fetch users for a company
         * @param companyId - Company ID
         */
        fetchCompanyUsers: async (companyId: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getCompanyUsers(companyId);
            
            if (response.success) {
              set((state) => {
                state.companyUsers = response.data || [];
                
                // Update the users in the selected company if it's the same one
                if (state.selectedCompany && state.selectedCompany.id === companyId) {
                  state.selectedCompany.users = response.data || [];
                }
                
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch company users'
              });
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
          }
        },
        
        /**
         * Add a user to a company
         * @param userProfileId - User profile ID
         * @param companyId - Company ID
         * @param role - User role in the company
         * @returns Success status
         */
        addUserToCompany: async (userProfileId: number, companyId: number, role: CompanyRole) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await addCompanyUser({
              userProfileId,
              companyId,
              role
            });
            
            if (response.success && response.data) {
              // Refresh the company users to get the updated list with profile info
              await get().fetchCompanyUsers(companyId);
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to add user to company'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Update a user's role in a company
         * @param userProfileId - User profile ID
         * @param companyId - Company ID
         * @param role - Updated user role
         * @returns Success status
         */
        updateUserRole: async (userProfileId: number, companyId: number, role: CompanyRole) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updateCompanyUser(userProfileId, companyId, { role });
            
            if (response.success && response.data) {
              // Update the user role in the company users list
              set((state) => {
                const index = state.companyUsers.findIndex(
                  u => u.userProfileId === userProfileId && u.companyId === companyId
                );
                
                if (index !== -1) {
                  state.companyUsers[index].role = role;
                  
                  // Also update in the selected company if it's the same one
                  if (state.selectedCompany && state.selectedCompany.id === companyId) {
                    const userIndex = state.selectedCompany.users?.findIndex(
                      u => u.userProfileId === userProfileId
                    );
                    
                    if (userIndex !== undefined && userIndex !== -1 && state.selectedCompany.users) {
                      state.selectedCompany.users[userIndex].role = role;
                    }
                  }
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update user role'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Remove a user from a company
         * @param userProfileId - User profile ID
         * @param companyId - Company ID
         * @returns Success status
         */
        removeUserFromCompany: async (userProfileId: number, companyId: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await removeCompanyUser(userProfileId, companyId);
            
            if (response.success) {
              // Remove the user from the company users list
              set((state) => {
                state.companyUsers = state.companyUsers.filter(
                  u => !(u.userProfileId === userProfileId && u.companyId === companyId)
                );
                
                // Also remove from the selected company if it's the same one
                if (state.selectedCompany && state.selectedCompany.id === companyId) {
                  state.selectedCompany.users = state.selectedCompany.users?.filter(
                    u => u.userProfileId !== userProfileId
                  );
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to remove user from company'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Set the selected company
         * @param company - Company to select, or null to clear selection
         */
        setSelectedCompany: (company: Company | null) => {
          if (company) {
            set((state) => {
              state.selectedCompany = {
                ...company,
                users: []
              };
              
              // If we have a company, also fetch its users
              if (company.id) {
                get().fetchCompanyUsers(company.id);
              }
            });
          } else {
            set({ selectedCompany: null });
          }
        },
        
        /**
         * Clear error message
         */
        clearError: () => {
          set({ error: null });
        },
        
        /**
         * Reset store to initial state
         */
        reset: () => {
          set({
            companies: [],
            selectedCompany: null,
            companyUsers: [],
            isLoading: false,
            error: null
          });
        }
      })),
      {
        name: 'v7capital-companies-storage',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    )
  )
);