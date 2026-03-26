'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  Price,
  Product,
  Subscription
} from '../schemas/subscriptions.schema';
import {
  getSubscriptionPlans,
  getCurrentSubscription,
  createCheckoutSession,
  createCustomerPortalSession,
  createCustomer
} from '../service/subscriptions.service';

/**
 * Subscription store state interface
 */
export interface SubscriptionState {
  // State
  plans: { prices: Price[]; products: Product[] } | null;
  currentSubscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Actions (all async operations in store like V7Capital)
  initialize: () => Promise<void>;
  fetchPlans: () => Promise<boolean>;
  fetchCurrentSubscription: (organizationId: number) => Promise<boolean>;
  createCheckoutSession: (priceId: string, organizationId?: number) => Promise<string | null>;
  createCustomerPortalSession: () => Promise<string | null>;
  createCustomer: (email?: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create subscription store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useSubscriptionStore = create<SubscriptionState>()(
  devtools(
    immer((set) => ({
      // Initial state
      plans: null,
      currentSubscription: null,
      isLoading: false,
      error: null,
      isInitialized: false,
      
      /**
       * Initialize subscription state (like V7Capital fetchCompanies on mount)
       */
      initialize: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Fetch plans first (doesn't require organization)
          const plansResponse = await getSubscriptionPlans();
          
          if (plansResponse.success && plansResponse.data) {
            set((state) => {
              state.plans = plansResponse.data!;
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: plansResponse.error || 'Failed to initialize subscriptions'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize subscriptions'
          });
        }
      },
      
      /**
       * Fetch all subscription plans (like V7Capital fetchCompanies)
       * @returns Success status
       */
      fetchPlans: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await getSubscriptionPlans();
          
          if (response.success && response.data) {
            set((state) => {
              state.plans = response.data!;
              state.isLoading = false;
            });
            return true;
          } else {
            set({ 
              isLoading: false, 
              error: response.error || 'Failed to fetch subscription plans'
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
       * Fetch current subscription for organization (like V7Capital fetchCompany)
       * @param organizationId Organization ID
       * @returns Success status
       */
      fetchCurrentSubscription: async (organizationId: number) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await getCurrentSubscription(organizationId);
          
          if (response.success && response.data) {
            set((state) => {
              state.currentSubscription = response.data!;
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              currentSubscription: null,
              error: response.error || null
            });
            return !response.error;
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
       * Create checkout session (like V7Capital createCompany)
       * @param priceId Stripe price ID
       * @param organizationId Optional organization ID context
       * @returns Checkout URL or null
       */
      createCheckoutSession: async (priceId: string, organizationId?: number) => {
        set({ isLoading: true, error: null });
        
        try {
          const url = await createCheckoutSession(priceId, organizationId);
          
          set({ isLoading: false });
          return url;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to create checkout session'
          });
          return null;
        }
      },
      
      /**
       * Create customer portal session (like V7Capital updateCompany)
       * @returns Portal URL or null
       */
      createCustomerPortalSession: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const url = await createCustomerPortalSession();
          
          set({ isLoading: false });
          return url;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to create customer portal session'
          });
          return null;
        }
      },
      
      /**
       * Create Stripe customer (like V7Capital createCustomer)
       * @param email Optional customer email
       * @returns Success status
       */
      createCustomer: async (email?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const success = await createCustomer(email);
          
          set({ isLoading: false });
          return success;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to create customer'
          });
          return false;
        }
      },
      
      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },
      
      /**
       * Reset subscription state to initial values
       */
      reset: () => {
        set({
          plans: null,
          currentSubscription: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    }))
  )
);
