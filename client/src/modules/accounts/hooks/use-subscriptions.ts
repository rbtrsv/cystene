'use client';

import { useContext } from 'react';
import { SubscriptionContext } from '../providers/subscriptions-provider';
import { useSubscriptionStore } from '../store/subscriptions.store';
import {
  type Price,
  type Product,
  type SubscriptionContextType
} from '../schemas/subscriptions.schema';

export function useSubscriptionContext(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  
  return context;
}

export function useSubscriptions() {
  // Get data from subscription context
  const {
    plans,
    currentSubscription,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    clearError: clearContextError
  } = useSubscriptionContext();

  // Get additional actions from subscription store
  const {
    fetchPlans,
    fetchCurrentSubscription,
    createCheckoutSession,
    createCustomerPortalSession,
    createCustomer,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useSubscriptionStore();

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
    plans,
    currentSubscription,
    isLoading,
    error,
    isInitialized,
    
    // Subscription actions
    fetchPlans,
    fetchCurrentSubscription,
    createCheckoutSession,
    createCustomerPortalSession,
    createCustomer,
    initialize,
    clearError,
    
    // Helper methods
    hasPlans: !!plans && plans.prices.length > 0,
    hasCurrentSubscription: !!currentSubscription,
    getPriceById: (id: string) => {
      return plans?.prices.find((price: Price) => price.id === id) || null;
    },
    getProductById: (id: string) => {
      return plans?.products.find((product: Product) => product.id === id) || null;
    },
    isSubscriptionActive: () => {
      return currentSubscription?.subscription_status === 'ACTIVE';
    },
    getSubscriptionStatus: () => {
      return currentSubscription?.subscription_status || null;
    },
    
    // Convenience wrapper functions to maintain API compatibility
    createCheckoutSessionWithPriceId: async (priceId: string, organizationId?: number) => {
      return await createCheckoutSession(priceId, organizationId);
    },

    createCustomerWithEmail: async (email?: string) => {
      return await createCustomer(email);
    }
  };
}

export default useSubscriptions;
