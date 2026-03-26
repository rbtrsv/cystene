'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type Stakeholder, 
  type StakeholderUser,
  type StakeholderWithUsers,
  type StakeholderUserWithProfile,
  type StakeholderRole,
  type StakeholderType
} from '../schemas/stakeholders.schemas';
import {
  getUserStakeholders,
  getStakeholder,
  createStakeholder,
  updateStakeholder,
  deleteStakeholder,
  getStakeholderUsers,
  addStakeholderUser,
  updateStakeholderUser,
  removeStakeholderUser
} from '../actions/stakeholders.actions';

/**
 * Stakeholder store state interface
 */
export interface StakeholdersState {
  // State
  stakeholders: Stakeholder[];
  selectedStakeholder: StakeholderWithUsers | null;
  stakeholderUsers: StakeholderUserWithProfile[];
  isLoading: boolean;
  error: string | null;
  
  // Stakeholder actions
  fetchStakeholders: () => Promise<void>;
  fetchStakeholder: (id: number) => Promise<void>;
  addStakeholder: (name: string, type: string, initialRole?: StakeholderRole) => Promise<boolean>;
  editStakeholder: (id: number, name: string, type?: string) => Promise<boolean>;
  removeStakeholder: (id: number) => Promise<boolean>;
  
  // Stakeholder user actions
  fetchStakeholderUsers: (stakeholderId: number) => Promise<void>;
  addUserToStakeholder: (userProfileId: number, stakeholderId: number, role: StakeholderRole) => Promise<boolean>;
  updateUserRole: (userProfileId: number, stakeholderId: number, role: StakeholderRole) => Promise<boolean>;
  removeUserFromStakeholder: (userProfileId: number, stakeholderId: number) => Promise<boolean>;
  
  // Utility actions
  setSelectedStakeholder: (stakeholder: Stakeholder | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create stakeholders store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useStakeholdersStore = create<StakeholdersState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        stakeholders: [],
        selectedStakeholder: null,
        stakeholderUsers: [],
        isLoading: false,
        error: null,
        
        /**
         * Fetch all stakeholders (for list page - denies stakeholders)
         */
        fetchStakeholders: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getUserStakeholders();

            if (response.success && response.data) {
              set((state) => {
                state.stakeholders = response.data || [];
                state.isLoading = false;
              });
            } else {
              set({
                isLoading: false,
                error: response.error || 'Failed to fetch stakeholders'
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
         * Fetch a single stakeholder by ID
         */
        fetchStakeholder: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            // Fetch stakeholder details
            const stakeholderResponse = await getStakeholder(id);
            
            if (!stakeholderResponse.success || !stakeholderResponse.data) {
              set({ 
                isLoading: false, 
                error: stakeholderResponse.error || 'Failed to fetch stakeholder'
              });
              return;
            }
            
            // Fetch stakeholder users
            const usersResponse = await getStakeholderUsers(id);
            
            if (usersResponse.success) {
              // Combine stakeholder with its users
              const stakeholderWithUsers: StakeholderWithUsers = {
                ...stakeholderResponse.data,
                users: usersResponse.data || []
              };
              
              set((state) => {
                state.selectedStakeholder = stakeholderWithUsers;
                state.stakeholderUsers = usersResponse.data || [];
                state.isLoading = false;
              });
            } else {
              // Still set the stakeholder even if users fetch fails
              set((state) => {
                state.selectedStakeholder = {
                  ...stakeholderResponse.data,
                  users: []
                };
                state.isLoading = false;
                state.error = usersResponse.error || 'Failed to fetch stakeholder users';
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
         * Add a new stakeholder
         * @param name - Stakeholder name
         * @param type - Stakeholder type
         * @param initialRole - Optional role to assign to the creator (defaults to EDITOR)
         * @returns Success status
         */
        addStakeholder: async (name: string, type: string, initialRole?: StakeholderRole) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await createStakeholder({ stakeholderName: name, type }, initialRole);
            
            if (response.success && response.data) {
              // Add the new stakeholder to the list
              set((state) => {
                state.stakeholders.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create stakeholder'
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
         * Edit an existing stakeholder
         * @param id - Stakeholder ID
         * @param name - Updated stakeholder name
         * @param type - Optional updated stakeholder type
         * @returns Success status
         */
        editStakeholder: async (id: number, name: string, type?: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const updateData = type 
              ? { stakeholderName: name, type } 
              : { stakeholderName: name };
              
            const response = await updateStakeholder(id, updateData);
            
            if (response.success && response.data) {
              // Update the stakeholder in the list
              set((state) => {
                const index = state.stakeholders.findIndex(s => s.id === id);
                if (index !== -1) {
                  state.stakeholders[index] = response.data!;
                }
                
                // Also update the selected stakeholder if it's the same one
                if (state.selectedStakeholder && state.selectedStakeholder.id === id) {
                  state.selectedStakeholder = {
                    ...response.data!,
                    users: state.selectedStakeholder.users || []
                  };
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update stakeholder'
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
         * Remove a stakeholder
         * @param id - Stakeholder ID
         * @returns Success status
         */
        removeStakeholder: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await deleteStakeholder(id);
            
            if (response.success) {
              // Remove the stakeholder from the list
              set((state) => {
                state.stakeholders = state.stakeholders.filter(s => s.id !== id);
                
                // Clear selected stakeholder if it's the same one
                if (state.selectedStakeholder && state.selectedStakeholder.id === id) {
                  state.selectedStakeholder = null;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete stakeholder'
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
         * Fetch users for a stakeholder
         * @param stakeholderId - Stakeholder ID
         */
        fetchStakeholderUsers: async (stakeholderId: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getStakeholderUsers(stakeholderId);
            
            if (response.success) {
              set((state) => {
                state.stakeholderUsers = response.data || [];
                
                // Update the users in the selected stakeholder if it's the same one
                if (state.selectedStakeholder && state.selectedStakeholder.id === stakeholderId) {
                  state.selectedStakeholder.users = response.data || [];
                }
                
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch stakeholder users'
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
         * Add a user to a stakeholder
         * @param userProfileId - User profile ID
         * @param stakeholderId - Stakeholder ID
         * @param role - User role in the stakeholder
         * @returns Success status
         */
        addUserToStakeholder: async (userProfileId: number, stakeholderId: number, role: StakeholderRole) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await addStakeholderUser({
              userProfileId,
              stakeholderId,
              role
            });
            
            if (response.success && response.data) {
              // Refresh the stakeholder users to get the updated list with profile info
              await get().fetchStakeholderUsers(stakeholderId);
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to add user to stakeholder'
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
         * Update a user's role in a stakeholder
         * @param userProfileId - User profile ID
         * @param stakeholderId - Stakeholder ID
         * @param role - Updated user role
         * @returns Success status
         */
        updateUserRole: async (userProfileId: number, stakeholderId: number, role: StakeholderRole) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updateStakeholderUser(userProfileId, stakeholderId, { role });
            
            if (response.success && response.data) {
              // Update the user role in the stakeholder users list
              set((state) => {
                const index = state.stakeholderUsers.findIndex(
                  u => u.userProfileId === userProfileId && u.stakeholderId === stakeholderId
                );
                
                if (index !== -1) {
                  state.stakeholderUsers[index].role = role;
                  
                  // Also update in the selected stakeholder if it's the same one
                  if (state.selectedStakeholder && state.selectedStakeholder.id === stakeholderId) {
                    const userIndex = state.selectedStakeholder.users?.findIndex(
                      u => u.userProfileId === userProfileId
                    );
                    
                    if (userIndex !== undefined && userIndex !== -1 && state.selectedStakeholder.users) {
                      state.selectedStakeholder.users[userIndex].role = role;
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
         * Remove a user from a stakeholder
         * @param userProfileId - User profile ID
         * @param stakeholderId - Stakeholder ID
         * @returns Success status
         */
        removeUserFromStakeholder: async (userProfileId: number, stakeholderId: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await removeStakeholderUser(userProfileId, stakeholderId);
            
            if (response.success) {
              // Remove the user from the stakeholder users list
              set((state) => {
                state.stakeholderUsers = state.stakeholderUsers.filter(
                  u => !(u.userProfileId === userProfileId && u.stakeholderId === stakeholderId)
                );
                
                // Also remove from the selected stakeholder if it's the same one
                if (state.selectedStakeholder && state.selectedStakeholder.id === stakeholderId) {
                  state.selectedStakeholder.users = state.selectedStakeholder.users?.filter(
                    u => u.userProfileId !== userProfileId
                  );
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to remove user from stakeholder'
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
         * Set the selected stakeholder
         * @param stakeholder - Stakeholder to select, or null to clear selection
         */
        setSelectedStakeholder: (stakeholder: Stakeholder | null) => {
          if (stakeholder) {
            set((state) => {
              state.selectedStakeholder = {
                ...stakeholder,
                users: []
              };
              
              // If we have a stakeholder, also fetch its users
              if (stakeholder.id) {
                get().fetchStakeholderUsers(stakeholder.id);
              }
            });
          } else {
            set({ selectedStakeholder: null });
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
            stakeholders: [],
            selectedStakeholder: null,
            stakeholderUsers: [],
            isLoading: false,
            error: null
          });
        }
      })),
      {
        name: 'v7capital-stakeholders-storage',
        // Persist nothing to prevent stale data when stakeholders are added via scripts
        partialize: () => ({})
      }
    )
  )
);