'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  MemberDetail, 
  MemberCreate, 
  MemberUpdate 
} from '../schemas/organization-members.schema';
import { 
  listMembers, 
  getMember, 
  addMember as apiAddMember,
  updateMember as apiUpdateMember,
  removeMember as apiRemoveMember
} from '../service/organization-members.service';

/**
 * Organization Members store state interface
 */
export interface OrganizationMembersState {
  // State
  members: MemberDetail[];
  activeOrganizationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: (organizationId: number) => Promise<void>;
  fetchMembers: (organizationId: number) => Promise<boolean>;
  fetchMember: (organizationId: number, memberId: number) => Promise<MemberDetail | null>;
  addMember: (organizationId: number, data: MemberCreate) => Promise<boolean>;
  updateMember: (organizationId: number, memberId: number, data: MemberUpdate) => Promise<boolean>;
  removeMember: (organizationId: number, memberId: number) => Promise<boolean>;
  setActiveOrganization: (organizationId: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create organization members store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useOrganizationMembersStore = create<OrganizationMembersState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      members: [],
      activeOrganizationId: null,
      isLoading: false,
      error: null,
      isInitialized: false,
      
      /**
       * Initialize members state for an organization
       */
      initialize: async (organizationId: number) => {
        set({ 
          isLoading: true, 
          error: null, 
          activeOrganizationId: organizationId 
        });
        
        try {
          const members = await listMembers(organizationId);
          
          set((state) => {
            state.members = members;
            state.isInitialized = true;
            state.isLoading = false;
          });
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize members'
          });
        }
      },
      
      /**
       * Fetch all members for an organization
       * @param organizationId Organization ID
       * @returns Success status
       */
      fetchMembers: async (organizationId: number) => {
        set({ 
          isLoading: true, 
          error: null,
          activeOrganizationId: organizationId 
        });
        
        try {
          const members = await listMembers(organizationId);
          
          set((state) => {
            state.members = members;
            state.isLoading = false;
          });
          return true;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },
      
      /**
       * Fetch a specific member by ID
       * @param organizationId Organization ID
       * @param memberId Member ID
       * @returns Promise with member or null
       */
      fetchMember: async (organizationId: number, memberId: number) => {
        set({ isLoading: true, error: null });
        
        try {
          const member = await getMember(organizationId, memberId);
          set({ isLoading: false });
          return member;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return null;
        }
      },
      
      /**
       * Add a new member to organization
       * @param organizationId Organization ID
       * @param data Member creation data
       * @returns Success status
       */
      addMember: async (organizationId: number, data: MemberCreate) => {
        set({ isLoading: true, error: null });
        
        try {
          const success = await apiAddMember(organizationId, data);
          
          if (success) {
            // After adding, refresh members list
            await get().fetchMembers(organizationId);
            set({ isLoading: false });
            return true;
          } else {
            set({ 
              isLoading: false, 
              error: 'Failed to add member'
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
       * Update an existing member
       * @param organizationId Organization ID
       * @param memberId Member ID
       * @param data Member update data
       * @returns Success status
       */
      updateMember: async (organizationId: number, memberId: number, data: MemberUpdate) => {
        set({ isLoading: true, error: null });
        
        try {
          const success = await apiUpdateMember(organizationId, memberId, data);
          
          if (success) {
            // After updating, refresh members list
            await get().fetchMembers(organizationId);
            set({ isLoading: false });
            return true;
          } else {
            set({ 
              isLoading: false, 
              error: `Failed to update member with ID ${memberId}`
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
       * Remove a member from organization
       * @param organizationId Organization ID
       * @param memberId Member ID
       * @returns Success status
       */
      removeMember: async (organizationId: number, memberId: number) => {
        set({ isLoading: true, error: null });
        
        try {
          const success = await apiRemoveMember(organizationId, memberId);
          
          if (success) {
            // After deleting, refresh members list
            await get().fetchMembers(organizationId);
            set({ isLoading: false });
            return true;
          } else {
            set({ 
              isLoading: false, 
              error: `Failed to remove member with ID ${memberId}`
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
      setActiveOrganization: (organizationId: number | null) => {
        set((state) => {
          state.activeOrganizationId = organizationId;
          // Clear members when switching organizations
          if (organizationId === null) {
            state.members = [];
            state.isInitialized = false;
          }
        });
      },
      
      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },
      
      /**
       * Reset members state to initial values
       */
      reset: () => {
        set({
          members: [],
          activeOrganizationId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
    {
      name: 'nexotype-organization-members-store'
    }
  )
);

/**
 * Get member by ID from current members list
 * @param memberId Member ID to find
 * @returns The member or undefined if not found
 */
export const getMemberById = (memberId: number): MemberDetail | undefined => {
  const { members } = useOrganizationMembersStore.getState();
  return members.find((member) => member.id === memberId);
};