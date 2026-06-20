'use client';

/**
 * Subscription Page
 *
 * Direct, top-level subscription (Factor Markets model — adapted for cystene's tiers).
 * The personal workspace is auto-created at registration and hidden, so this page shows
 * NO "organization" concept for a solo user: they just pick a plan and subscribe.
 *
 * cystene has multiple tiers (FREE / PRO / ENTERPRISE) — unlike Factor Markets' single
 * product — so we render one card per plan, data-driven from Stripe (price.tier / amount /
 * features). FREE has no Stripe product, so it's shown for context only.
 *
 * Stripe Customer Portal handles cancel / payment method / invoices — we don't reinvent it.
 *
 * Mirrors: finpy/client/.../factormarkets/subscription/page.tsx
 */

import { useEffect, useState } from 'react';
import { useSubscriptions } from '@/modules/accounts/hooks/use-subscriptions';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { type Price } from '@/modules/accounts/schemas/subscriptions.schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, Check, CreditCard, AlertTriangle } from 'lucide-react';

// Currency symbols for the prices Stripe returns (extend as new currencies are added).
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', CHF: 'CHF', RON: 'lei',
};
const currencySymbol = (code: string): string =>
  CURRENCY_SYMBOLS[(code ?? '').toUpperCase()] ?? (code ?? '').toUpperCase();

/** Title-case a tier slug ("PRO" → "Pro"). */
const tierLabel = (tier?: string) =>
  tier ? tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase() : 'Plan';

export default function SubscriptionPage() {
  const {
    plans,
    currentSubscription,
    isLoading,
    error,
    fetchPlans,
    fetchCurrentSubscription,
    createCheckoutSession,
    createCustomerPortalSession,
    isSubscriptionActive,
  } = useSubscriptions();
  const { activeOrganizationId } = useOrganizations();

  // Tracks which action is in flight: a price.id (subscribing) or 'manage' (portal).
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    if (activeOrganizationId) fetchCurrentSubscription(activeOrganizationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganizationId]);

  // Paid plans from Stripe, ordered cheapest → most expensive.
  const paidPrices = (plans?.prices ?? [])
    .slice()
    .sort((a, b) => (a.tier_order ?? 0) - (b.tier_order ?? 0));

  const hasActiveSub = isSubscriptionActive();
  const activeProductId = currentSubscription?.stripe_product_id ?? null;

  // Send the user to Stripe Checkout for the chosen plan. orgId is optional — the backend
  // auto-resolves (or auto-creates) the personal workspace, so a solo user never sees it.
  const handleSubscribe = async (price: Price) => {
    setProcessing(price.id);
    try {
      const url = await createCheckoutSession(price.id, activeOrganizationId ?? undefined);
      if (url) {
        window.location.href = url; // navigating away — keep the spinner
        return;
      }
      setProcessing(null);
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setProcessing(null);
    }
  };

  // Open the Stripe Customer Portal (cancel / payment method / invoices).
  const handleManage = async () => {
    setProcessing('manage');
    try {
      const url = await createCustomerPortalSession();
      if (url) {
        window.location.href = url;
        return;
      }
      setProcessing(null);
    } catch (err) {
      console.error('Error opening customer portal:', err);
      setProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Unlock internal scanners, scheduling, and audit-ready compliance reports.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {/* FREE — no Stripe product (so no feature list to read); just the default-plan marker */}
        <Card className={!hasActiveSub ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Free</span>
              {!hasActiveSub && <Badge variant="default">Current</Badge>}
            </CardTitle>
            <CardDescription>$0/month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The default plan — external scanners, no card required. Upgrade for internal scanners,
              scheduling, and compliance reports.
            </p>
          </CardContent>
        </Card>

        {/* Paid plans — one card per Stripe price (PRO, ENTERPRISE) */}
        {paidPrices.map((price) => {
          const isCurrent = hasActiveSub && activeProductId === price.product_id;
          const features = price.features ?? [];
          return (
            <Card key={price.id} className={isCurrent ? 'border-primary' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{tierLabel(price.tier)}</span>
                  {isCurrent && <Badge variant="default">Current</Badge>}
                </CardTitle>
                <CardDescription>
                  {currencySymbol(price.currency)}{price.amount.toFixed(2)}/month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {features.length > 0 && (
                  <ul className="space-y-2">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {isCurrent ? (
                  <Button onClick={handleManage} disabled={!!processing} variant="outline" className="w-full">
                    {processing === 'manage' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Opening Stripe Portal...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Manage Billing
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={() => handleSubscribe(price)} disabled={!!processing} className="w-full" size="lg">
                    {processing === price.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirecting to Stripe...
                      </>
                    ) : (
                      'Subscribe'
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Cancel anytime via the Stripe portal. Payment, invoices, and plan changes are handled by Stripe.
      </p>
    </div>
  );
}
