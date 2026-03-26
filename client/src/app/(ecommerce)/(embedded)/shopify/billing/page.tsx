/**
 * Shopify Embedded App — Billing Page
 *
 * Polaris web component version for viewing Shopify app subscription status.
 * Runs inside the Shopify Admin iframe.
 *
 * Currently uses MANAGED PRICING — Shopify handles plan subscriptions through
 * a hosted pricing page in the Partner Dashboard. This page only displays
 * current plan info and provides a "Manage Plan" button that opens Shopify's
 * pricing page.
 *
 * Displays:
 * - Current plan info from EmbeddedContext (billing data from init)
 * - Plan comparison: FREE / PRO ($12/mo) / ENTERPRISE ($36/mo)
 * - "Manage Plan on Shopify" button → redirects to Shopify's managed pricing page (_top)
 *
 * No subscribe/cancel buttons — Shopify manages all plan changes.
 *
 * No connection selector — connection is auto-resolved from Shopify session token.
 *
 * Backend: /server/apps/ecommerce/subrouters/shopify_embedded_subrouter.py
 * - GET  /shopify/embedded/billing/status — billing status
 * - POST /shopify/embedded/billing/subscribe — (exists, NOT used with Managed Pricing)
 * - POST /shopify/embedded/billing/cancel — (exists, NOT used with Managed Pricing)
 *
 * Managed Pricing URL:
 * https://admin.shopify.com/store/{storeHandle}/charges/{appHandle}/pricing_plans
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * TO REVERT TO MANUAL PRICING (Billing API / appSubscriptionCreate):
 *
 * 1. Partner Dashboard → Distribution → Manage listing → Pricing content →
 *    Settings → switch from "Managed pricing" to "Manual pricing" → Save
 *
 * 2. In this file:
 *    - Add imports: useState, useEffect, Suspense from 'react'; useSearchParams from 'next/navigation'
 *    - Import { subscribeBilling, cancelBilling } from shopify-embedded.service.ts
 *    - Wrap page in <Suspense> boundary (required for useSearchParams in Next.js)
 *    - Add handleSubscribe: calls subscribeBilling(token, planName),
 *      then window.open(response.confirmation_url, '_top') to redirect to Shopify charge approval
 *    - Add handleCancel: calls cancelBilling(token), then refresh() to update billing status
 *    - Add useEffect to check ?shopify_billing= query param on mount for callback results
 *      (success/declined/error banners)
 *    - Add "Subscribe to {planName}" button per plan card (canSubscribe = plan !== FREE && !isCurrent)
 *    - Add "Cancel Subscription" button in Current Plan section (when isActive)
 *    - Remove handleUpgrade and SHOPIFY_APP_HANDLE constant
 *
 * 3. Backend endpoints are already in place — no backend changes needed.
 *    subscribeBilling/cancelBilling service functions are already in place — no service changes needed.
 *
 * 4. Billing callback endpoint: GET /shopify/billing/callback?embedded=true
 *    redirects back to /shopify/billing?shopify_billing=success|declined|error
 * ──────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useEmbedded } from '../layout';

// ==========================================
// Constants
// ==========================================

/**
 * Shopify app handle — used to construct the managed pricing URL.
 * This is the app's slug on the Shopify App Store (lowercase app name).
 * Verified working: https://admin.shopify.com/store/{store}/charges/nudgio/pricing_plans
 */
const SHOPIFY_APP_HANDLE = 'nudgio';

// ==========================================
// Plan Data
// ==========================================

const PLANS = [
  {
    name: 'FREE',
    price: '$0',
    period: '/mo',
    features: [
      'Up to 100 products',
      'Bestseller recommendations',
      'Basic widget styles',
    ],
    description: 'Default plan — no subscription needed',
  },
  {
    name: 'PRO',
    price: '$12',
    period: '/mo',
    features: [
      'Up to 10,000 products',
      'All recommendation types',
      'All widget styles',
      'Custom colors',
      'Priority support',
    ],
    description: null,
  },
  {
    name: 'ENTERPRISE',
    price: '$36',
    period: '/mo',
    features: [
      'Unlimited products',
      'All recommendation types',
      'All widget styles',
      'Custom colors',
      'Advanced analytics',
      'Dedicated support',
    ],
    description: null,
  },
];

// ==========================================
// Billing Page
// ==========================================

export default function ShopifyBillingPage() {
  const { billing, connection, isLoading: contextLoading, error: contextError } = useEmbedded();

  // ==========================================
  // Upgrade handler — opens Shopify's managed pricing page
  // ==========================================

  const handleUpgrade = () => {
    if (!connection?.store_url) return;

    // Derive store handle from store URL (strip .myshopify.com)
    const storeHandle = connection.store_url.replace('.myshopify.com', '');

    // Managed Pricing URL — Shopify hosts the plan selection page
    const pricingUrl = `https://admin.shopify.com/store/${storeHandle}/charges/${SHOPIFY_APP_HANDLE}/pricing_plans`;

    // Must use _top to exit the embedded iframe
    window.open(pricingUrl, '_top');
  };

  // ==========================================
  // Loading / Error — context level
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

  // Current plan from context
  const currentPlan = billing?.plan_name || 'FREE';
  const isActive = billing?.billing_status === 'ACTIVE';

  return (
    <s-page heading="Billing">

      {/* Top spacer — breathing room between page heading and first section */}
      <s-box paddingBlockStart="base" />

      {/* Current Plan Status */}
      <s-section heading="Current Plan">
        <s-box padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="base">
              <s-text type="strong">Plan</s-text>
              <s-badge tone={isActive ? 'success' : 'info'}>
                {currentPlan}
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

      {/* Plan Comparison */}
      <s-section heading="Available Plans">
        <s-stack direction="inline" gap="base">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.name && (plan.name === 'FREE' || isActive);

            return (
              <s-box
                key={plan.name}
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background={isCurrent ? 'subdued' : undefined}
              >
                <s-stack direction="block" gap="base">
                  <s-stack direction="inline" gap="small">
                    <s-heading>{plan.name}</s-heading>
                    {isCurrent && (
                      <s-badge tone="success">Current</s-badge>
                    )}
                  </s-stack>

                  <s-stack direction="inline" gap="small">
                    <s-heading>{plan.price}</s-heading>
                    <s-text>{plan.period}</s-text>
                  </s-stack>

                  {/* Feature list */}
                  <s-stack direction="block" gap="small">
                    {plan.features.map((feature) => (
                      <s-text key={feature}>{feature}</s-text>
                    ))}
                  </s-stack>

                  {/* Current plan indicator */}
                  {isCurrent && (
                    <s-text type="strong" tone="success">Active</s-text>
                  )}

                  {/* Description for FREE plan */}
                  {plan.description && !isCurrent && (
                    <s-text>{plan.description}</s-text>
                  )}
                </s-stack>
              </s-box>
            );
          })}
        </s-stack>
      </s-section>

      {/* Upgrade Button — opens Shopify's managed pricing page */}
      <s-section>
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            <s-banner tone="info">
              <s-paragraph>
                Plan changes are managed through Shopify. Click the button below
                to view and change your subscription plan.
              </s-paragraph>
            </s-banner>
            <s-button
              variant="primary"
              onClick={handleUpgrade}
              disabled={!connection?.store_url || undefined}
            >
              Manage Plan on Shopify
            </s-button>
          </s-stack>
        </s-box>
      </s-section>

      {/* Bottom spacer — breathing room after last section */}
      <s-box paddingBlockEnd="base" />

    </s-page>
  );
}
