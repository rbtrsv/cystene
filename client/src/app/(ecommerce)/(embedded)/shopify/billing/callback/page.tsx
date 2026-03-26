/**
 * Shopify Embedded App — Billing Callback Page
 *
 * Handles Shopify's redirect after a merchant approves (or declines) a subscription.
 * When Shopify redirects back to the app inside the admin iframe, it lands here:
 *   /shopify/billing/callback?charge_id=29120561340
 *
 * This page:
 * 1. Extracts charge_id from the URL query params
 * 2. Gets a fresh session token via App Bridge
 * 3. Calls POST /shopify/embedded/billing/verify-charge with the charge_id
 * 4. Server queries Shopify API to verify the charge status
 * 5. On success → refreshes context → shows toast → redirects to /shopify/billing
 * 6. On error → shows error banner with link to billing page
 *
 * Works with both Managed Pricing (no prior PENDING record) and
 * Manual Pricing (existing PENDING record from appSubscriptionCreate).
 *
 * No connection selector — connection is auto-resolved from Shopify session token.
 *
 * Backend: /server/apps/ecommerce/subrouters/shopify_embedded_subrouter.py
 * - POST /shopify/embedded/billing/verify-charge — verify + activate a Shopify charge
 */

'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEmbedded } from '../../layout';
import { verifyBillingCharge } from '@/modules/ecommerce/service/shopify-embedded.service';

// ==========================================
// Inner Component (needs useSearchParams inside Suspense)
// ==========================================

function BillingCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getSessionToken, refresh, isLoading: contextLoading, error: contextError } = useEmbedded();

  const [error, setError] = useState<string | null>(null);
  // Prevent double-execution in React StrictMode
  const verifyingRef = useRef(false);

  useEffect(() => {
    // Wait for context to be ready
    if (contextLoading || contextError) return;
    // Prevent duplicate calls
    if (verifyingRef.current) return;
    verifyingRef.current = true;

    const verifyCharge = async () => {
      try {
        // Extract charge_id from URL query params
        const chargeId = searchParams.get('charge_id');
        if (!chargeId) {
          setError('No charge_id found in URL. Cannot verify billing.');
          return;
        }

        // Get fresh session token from App Bridge
        const token = await getSessionToken();
        if (!token) {
          setError('Could not get session token. Please reload the app.');
          return;
        }

        // Call server to verify the charge with Shopify API
        const result = await verifyBillingCharge(token, chargeId);

        if (result.success && result.billing_status === 'ACTIVE') {
          // Refresh context so billing data is up to date
          await refresh();

          // Show success toast via App Bridge
          window.shopify?.toast.show('Subscription activated');

          // Redirect to billing page
          router.push('/shopify/billing');
        } else {
          // Charge exists but not ACTIVE (declined, expired, etc.)
          setError(
            `Charge status: ${result.billing_status}. ` +
            'The subscription was not activated. Please try again from the Billing page.',
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to verify billing charge');
      }
    };

    verifyCharge();
  }, [contextLoading, contextError, searchParams, getSessionToken, refresh, router]);

  // ==========================================
  // Loading — context level
  // ==========================================

  if (contextLoading) {
    return (
      <s-page heading="Billing">
        <s-section heading="Loading...">
          <s-spinner />
        </s-section>
      </s-page>
    );
  }

  // ==========================================
  // Error — context level
  // ==========================================

  if (contextError) {
    return (
      <s-page heading="Billing">
        <s-section>
          <s-banner tone="critical" heading="Error">
            <s-paragraph>{contextError}</s-paragraph>
          </s-banner>
        </s-section>
      </s-page>
    );
  }

  // ==========================================
  // Error — verification failed
  // ==========================================

  if (error) {
    return (
      <s-page heading="Billing">
        <s-box paddingBlockStart="base" />
        <s-section>
          <s-banner tone="critical" heading="Billing Verification Failed">
            <s-paragraph>{error}</s-paragraph>
          </s-banner>
        </s-section>
        <s-section>
          <s-button onClick={() => router.push('/shopify/billing')}>
            Go to Billing
          </s-button>
        </s-section>
        <s-box paddingBlockEnd="base" />
      </s-page>
    );
  }

  // ==========================================
  // Processing — verifying charge with Shopify
  // ==========================================

  return (
    <s-page heading="Billing">
      <s-box paddingBlockStart="base" />
      <s-section heading="Verifying your subscription...">
        <s-spinner />
      </s-section>
      <s-box paddingBlockEnd="base" />
    </s-page>
  );
}

// ==========================================
// Billing Callback Page (Suspense wrapper for useSearchParams)
// ==========================================

export default function ShopifyBillingCallbackPage() {
  return (
    <Suspense
      fallback={
        <s-page heading="Billing">
          <s-section heading="Loading...">
            <s-spinner />
          </s-section>
        </s-page>
      }
    >
      <BillingCallbackInner />
    </Suspense>
  );
}
