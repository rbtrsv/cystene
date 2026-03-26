'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  Organization, 
  CreateOrganizationInput, 
  UpdateOrganizationInput 
} from '../schemas/organizations.schema';
import { 
  getOrganizations, 
  getOrganization, 
  createOrganization as apiCreateOrganization,
  updateOrganization as apiUpdateOrganization,
  deleteOrganization as apiDeleteOrganization
} from '../service/organizations.service';

/**
 * Organization store state interface
 */
export interface OrganizationState {
  // State
  organizations: Organization[];
  activeOrganizationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchOrganizations: () => Promise<boolean>;
  fetchOrganization: (id: number) => Promise<Organization | null>;
  createOrganization: (data: CreateOrganizationInput) => Promise<boolean>;
  updateOrganization: (id: number, data: UpdateOrganizationInput) => Promise<boolean>;
  deleteOrganization: (id: number) => Promise<boolean>;
  setActiveOrganization: (organizationId: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create organization store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useOrganizationStore = create<OrganizationState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        organizations: [],
        activeOrganizationId: null,
        isLoading: false,
        error: null,
        isInitialized: false,
        
        /**
         * Initialize organizations state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getOrganizations();
            
            if (response.success && response.data) {
              set((state) => {
                state.organizations = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
                
                // Set active organization if not already set and organizations exist
                if (response.data && response.data.length > 0 && state.activeOrganizationId === null) {
                  state.activeOrganizationId = response.data[0].id;
                }
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize organizations'
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize organizations'
            });
          }
        },
        
        /**
         * Fetch all organizations
         * @returns Success status
         */
        fetchOrganizations: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getOrganizations();
            
            if (response.success && response.data) {
              set((state) => {
                state.organizations = response.data || [];
                state.isLoading = false;
                
                // Set active organization if not already set
                if (response.data && response.data.length > 0 && state.activeOrganizationId === null) {
                  state.activeOrganizationId = response.data[0].id;
                }
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch organizations'
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
         * Fetch a specific organization by ID
         * @param id Organization ID
         * @returns Promise with organization or null
         */
        fetchOrganization: async (id) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getOrganization(id);
            
            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || `Failed to fetch organization with ID ${id}`
              });
              return null;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return null;
          }
        },
        
        /**
         * Create a new organization
         * @param data Organization creation data
         * @returns Success status
         */
        createOrganization: async (data) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiCreateOrganization(data);
            
            if (response.success && response.data) {
              // After creating, refresh organizations list
              await get().fetchOrganizations();
              
              set((state) => {
                state.isLoading = false;
                
                // Set as active organization if it's the first one
                if (state.organizations.length === 1 && response.data) {
                  state.activeOrganizationId = response.data.id;
                }
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create organization'
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
         * Update an existing organization
         * @param id Organization ID
         * @param data Organization update data
         * @returns Success status
         */
        updateOrganization: async (id, data) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiUpdateOrganization(id, data);
            
            if (response.success && response.data) {
              // After updating, refresh organizations list
              await get().fetchOrganizations();
              
              set({ isLoading: false });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || `Failed to update organization with ID ${id}`
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
         * Delete an organization
         * @param id Organization ID
         * @returns Success status
         */
        deleteOrganization: async (id) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiDeleteOrganization(id);
            
            if (response.success) {
              // Clear active organization if it's the one being deleted
              set((state) => {
                if (state.activeOrganizationId === id) {
                  state.activeOrganizationId = null;
                }
              });
              
              // After deleting, refresh organizations list
              await get().fetchOrganizations();
              
              set((state) => {
                // Set new active organization if we don't have one
                if (state.activeOrganizationId === null && state.organizations.length > 0) {
                  state.activeOrganizationId = state.organizations[0].id;
                }
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || `Failed to delete organization with ID ${id}`
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
         * Set active organization
         * @param organizationId ID of the active organization or null
         */
        setActiveOrganization: (organizationId) => {
          set((state) => {
            state.activeOrganizationId = organizationId;
          });
        },
        
        /**
         * Clear error message
         */
        clearError: () => {
          set({ error: null });
        },
        
        /**
         * Reset organization state to initial values
         */
        reset: () => {
          set({
            organizations: [],
            activeOrganizationId: null,
            isLoading: false,
            error: null,
            isInitialized: true
          });
        }
      })),
      {
        name: 'nexotype-organization-storage',
        partialize: (state) => ({
          activeOrganizationId: state.activeOrganizationId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Get active organization from organization store
 * @returns The active organization or undefined if not set
 */
export const getActiveOrganization = (): Organization | undefined => {
  const { organizations, activeOrganizationId } = useOrganizationStore.getState();
  return organizations.find((org) => org.id === activeOrganizationId);
};