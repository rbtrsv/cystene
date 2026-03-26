'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useSubscriptionStore } from '../store/subscriptions.store';
import { useOrganizationStore } from '../store/organizations.store';
import { SubscriptionContextType } from '../schemas/subscriptions.schema';

// Create the context
export const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

/**
 * Provider component for subscription-related state and actions
 */
export function SubscriptionProvider({ 
  children,
  initialFetch = true
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    plans,
    currentSubscription,
    isLoading,
    error,
    isInitialized,
    initialize,
    fetchPlans,
    fetchCurrentSubscription,
    createCheckoutSession,
    createCustomerPortalSession,
    createCustomer,
    clearError
  } = useSubscriptionStore();
  
  // Get active organization ID from organization store
  const { activeOrganizationId, isInitialized: orgInitialized } = useOrganizationStore();
  
  // Initialize subscriptions on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing subscriptions:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFetch, isInitialized]); // Intentionally omit initialize from deps
  
  // Fetch current subscription when active organization changes
  useEffect(() => {
    let isMounted = true;
    
    if (orgInitialized && activeOrganizationId && isInitialized) {
      fetchCurrentSubscription(activeOrganizationId).catch(error => {
        if (isMounted) {
          console.error('Error fetching current subscription:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganizationId, orgInitialized, isInitialized]); // Intentionally omit fetchCurrentSubscription from deps
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<SubscriptionContextType>(() => ({
    plans,
    currentSubscription,
    isLoading,
    error,
    isInitialized,
    initialize,
    fetchPlans,
    fetchCurrentSubscription,
    createCheckoutSession,
    createCustomerPortalSession,
    createCustomer,
    clearError
  }), [
    plans,
    currentSubscription,
    isLoading,
    error,
    isInitialized,
    initialize,
    fetchPlans,
    fetchCurrentSubscription,
    createCheckoutSession,
    createCustomerPortalSession,
    createCustomer,
    clearError
  ]);
  
  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Default export
 */
export default SubscriptionProvider;