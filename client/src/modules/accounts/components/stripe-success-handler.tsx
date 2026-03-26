'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/modules/accounts/hooks/use-auth-server';
import { useSubscriptions } from '@/modules/accounts/hooks/use-subscriptions';
import { useOrganizationStore } from '@/modules/accounts/store/organizations.store';
import { getCurrentSubscription } from '@/modules/accounts/service/subscriptions.service';

/**
 * Handles Stripe checkout success callback.
 * Detects checkout=success in URL after Stripe redirect,
 * polls the backend until the webhook has persisted the subscription
 * (status = ACTIVE), then refreshes auth state and cleans the URL.
 * Must be rendered inside AccountsProviders to access auth/subscription hooks.
 */
export function StripeSuccessHandler() {
  const { initialize } = useAuth();
  const { fetchCurrentSubscription } = useSubscriptions();
  const { activeOrganizationId, isInitialized: orgInitialized } = useOrganizationStore();
  const pollingRef = useRef(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const checkoutParam = url.searchParams.get('checkout');
    if (checkoutParam !== 'success' || pollingRef.current) return;
    if (!orgInitialized || !activeOrganizationId) return;

    // Capture session_id for traceability before cleaning URL
    const sessionId = url.searchParams.get('session_id');

    // Remove checkout and session_id params from URL without refresh
    url.searchParams.delete('checkout');
    url.searchParams.delete('session_id');
    window.history.replaceState({}, '', url.toString());

    pollingRef.current = true;
    console.log(`[StripeSuccessHandler] Checkout success detected (session: ${sessionId}), polling subscription status...`);

    // Poll backend until webhook has persisted subscription as ACTIVE
    let attempts = 0;
    const maxAttempts = 15; // 15 × 2s = 30s max wait

    const poll = async () => {
      attempts++;
      console.log(`[StripeSuccessHandler] Poll attempt ${attempts}/${maxAttempts}`);
      const response = await getCurrentSubscription(activeOrganizationId);

      if (response.success && response.data?.subscription_status === 'ACTIVE') {
        // Webhook has fired — update store + refresh auth state
        console.log('[StripeSuccessHandler] Subscription active, refreshing state');
        await fetchCurrentSubscription(activeOrganizationId);
        await initialize();
        pollingRef.current = false;
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 2000);
      } else {
        // Timeout — refresh auth anyway (webhook may still be in flight)
        console.log('[StripeSuccessHandler] Polling timed out, refreshing state anyway');
        await initialize();
        pollingRef.current = false;
      }
    };

    poll();
  }, [orgInitialized, activeOrganizationId, initialize, fetchCurrentSubscription]);

  return null;
}

export default StripeSuccessHandler;
