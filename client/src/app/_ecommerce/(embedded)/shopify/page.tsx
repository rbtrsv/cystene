/**
 * Shopify Embedded App — Dashboard Page
 *
 * Main dashboard page for the Shopify embedded app.
 * Renders inside the Shopify Admin iframe using Polaris web components.
 *
 * Displays:
 * - Connection status (shop domain, active/inactive, created date)
 * - Product count + order count stats
 * - Current billing plan with upgrade prompt
 *
 * Data comes from EmbeddedContext (populated by layout.tsx via POST /init).
 * All UI uses Polaris web components (s-page, s-section, s-box, etc.).
 *
 * Charge ID redirect:
 * Shopify Managed Pricing sometimes redirects to /shopify?charge_id=X instead of
 * /shopify/billing/callback?charge_id=X. If charge_id is in the URL, this page
 * redirects to the billing callback page to activate the subscription.
 */

'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEmbedded } from './layout';

// ==========================================
// Loading State
// ==========================================

function DashboardSkeleton() {
  return (
    <s-page heading="Nudgio Dashboard">
      <s-section heading="Loading...">
        <s-spinner />
      </s-section>
    </s-page>
  );
}

// ==========================================
// Error State
// ==========================================

function DashboardError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <s-page heading="Nudgio Dashboard">
      <s-section>
        <s-banner tone="critical" heading="Failed to load dashboard">
          <s-paragraph>{error}</s-paragraph>
          <s-button slot="secondary-actions" onClick={onRetry}>
            Retry
          </s-button>
        </s-banner>
      </s-section>
    </s-page>
  );
}

// ==========================================
// Charge ID Redirect Hook
// ==========================================

/** If charge_id is in the URL, redirect to billing callback page to activate it. */
function useChargeIdRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const chargeId = searchParams.get('charge_id');
    if (chargeId) {
      router.replace(`/shopify/billing/callback?charge_id=${encodeURIComponent(chargeId)}`);
    }
  }, [searchParams, router]);
}

// ==========================================
// Dashboard Page (inner — uses useSearchParams)
// ==========================================

function ShopifyDashboardInner() {
  const { connection, stats, billing, isLoading, error, refresh } = useEmbedded();

  // Redirect to billing callback if charge_id is present
  useChargeIdRedirect();

  // Loading state — show spinner while POST /init is in progress
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Error state — show error banner with retry button
  if (error || !connection) {
    return (
      <DashboardError
        error={error || 'No connection found'}
        onRetry={refresh}
      />
    );
  }

  return (
    <s-page heading="Nudgio Dashboard">

      {/* Top spacer — breathing room between page heading and first section */}
      <s-box paddingBlockStart="base" />

      {/* Connection Status Section */}
      <s-section heading="Connection">
        <s-box padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="base">
              <s-text type="strong">Store</s-text>
              <s-text>{connection.store_url}</s-text>
            </s-stack>
            <s-stack direction="inline" gap="base">
              <s-text type="strong">Status</s-text>
              <s-badge tone={connection.is_active ? 'success' : 'critical'}>
                {connection.is_active ? 'Active' : 'Inactive'}
              </s-badge>
            </s-stack>
            <s-stack direction="inline" gap="base">
              <s-text type="strong">Connected</s-text>
              <s-text>
                {connection.created_at
                  ? new Date(connection.created_at).toLocaleDateString()
                  : 'Unknown'}
              </s-text>
            </s-stack>
          </s-stack>
        </s-box>
      </s-section>

      {/* Stats Section */}
      <s-section heading="Store Stats">
        <s-stack direction="inline" gap="base">
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="small">
              <s-text type="strong">Products</s-text>
              <s-heading>
                {stats?.products_count?.toLocaleString() ?? '0'}
              </s-heading>
            </s-stack>
          </s-box>
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="small">
              <s-text type="strong">Orders (12 months)</s-text>
              <s-heading>
                {stats?.orders_count?.toLocaleString() ?? '0'}
              </s-heading>
            </s-stack>
          </s-box>
        </s-stack>
      </s-section>

      {/* Billing Section */}
      <s-section heading="Current Plan">
        <s-box padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="base">
              <s-text type="strong">Plan</s-text>
              <s-badge tone={billing?.has_subscription ? 'success' : 'info'}>
                {billing?.plan_name ?? 'FREE'}
              </s-badge>
              {billing?.test && (
                <s-badge tone="warning">Test</s-badge>
              )}
            </s-stack>
            {billing?.billing_status && (
              <s-stack direction="inline" gap="base">
                <s-text type="strong">Status</s-text>
                <s-text>{billing.billing_status}</s-text>
              </s-stack>
            )}
            {billing?.start_date && (
              <s-stack direction="inline" gap="base">
                <s-text type="strong">Since</s-text>
                <s-text>{new Date(billing.start_date).toLocaleDateString()}</s-text>
              </s-stack>
            )}
          </s-stack>
        </s-box>
      </s-section>

      {/* Bottom spacer — breathing room after last section */}
      <s-box paddingBlockEnd="base" />

    </s-page>
  );
}

// ==========================================
// Dashboard Page (Suspense wrapper for useSearchParams)
// ==========================================

export default function ShopifyDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ShopifyDashboardInner />
    </Suspense>
  );
}
