'use client';

import {
  SubscriptionPlansResponse,
  SubscriptionInfoResponse,
  UrlResponse,
  MessageResponse,
  CreateCheckoutSessionSchema,
  CreateCustomerSchema
} from '../schemas/subscriptions.schema';
import { SUBSCRIPTION_ENDPOINTS } from '../utils/api.endpoints';
import { fetchClient } from '../utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Get all subscription plans from Stripe
 * @returns Promise with subscription plans response
 */
export const getSubscriptionPlans = async (): Promise<SubscriptionPlansResponse> => {
  try {
    const response = await fetchClient<SubscriptionPlansResponse>(SUBSCRIPTION_ENDPOINTS.PLANS, {
      method: 'GET',
      useAuth: false
    });
    
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../utils/token.client.utils');
      clearAuthCookies();
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch subscription plans'
    };
  }
};

/**
 * Get current subscription for an organization
 * @param organizationId Organization ID
 * @returns Promise with subscription info response
 */
export const getCurrentSubscription = async (organizationId: number): Promise<SubscriptionInfoResponse> => {
  try {
    const response = await fetchClient<SubscriptionInfoResponse>(
      SUBSCRIPTION_ENDPOINTS.CURRENT(organizationId), 
      {
        method: 'GET'
      }
    );
    
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../utils/token.client.utils');
      clearAuthCookies();
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch current subscription'
    };
  }
};

/**
 * Create a Stripe checkout session
 * @param priceId Stripe price ID
 * @param organizationId Optional organization ID context
 * @returns Promise with checkout URL or null
 */
export const createCheckoutSession = async (
  priceId: string,
  organizationId?: number
): Promise<string | null> => {
  CreateCheckoutSessionSchema.parse({ price_id: priceId });
  
  try {
    const params = new URLSearchParams({ price_id: priceId });
    if (organizationId !== undefined) {
      params.set('organization_id', String(organizationId));
    }

    const response = await fetchClient<UrlResponse>(
      `${SUBSCRIPTION_ENDPOINTS.CHECKOUT}?${params.toString()}`,
      {
        method: 'POST'
      }
    );
    
    if (response.success && response.url) {
      return response.url;
    }
    
    return null;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return null;
  }
};

/**
 * Create a Stripe customer portal session
 * @returns Promise with portal URL or null
 */
export const createCustomerPortalSession = async (): Promise<string | null> => {
  try {
    const response = await fetchClient<UrlResponse>(SUBSCRIPTION_ENDPOINTS.PORTAL, {
      method: 'POST'
    });
    
    if (response.success && response.url) {
      return response.url;
    }
    
    return null;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return null;
  }
};

/**
 * Create a Stripe customer for the organization
 * @param email Optional customer email
 * @returns Promise with success status
 */
export const createCustomer = async (email?: string): Promise<boolean> => {
  CreateCustomerSchema.parse({ email });
  
  try {
    const response = await fetchClient<MessageResponse>(SUBSCRIPTION_ENDPOINTS.CREATE_CUSTOMER, {
      method: 'POST',
      body: email ? { email } : {}
    });
    
    return response.success;
  } catch (error) {
    console.error('Error creating customer:', error);
    return false;
  }
};
