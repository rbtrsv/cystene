'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSubscriptions } from '@/modules/accounts/hooks/use-subscriptions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Loader2, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Price } from '@/modules/accounts/schemas/subscriptions.schema';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';

export default function SubscriptionPage() {
  const params = useParams();
  const organizationId = parseInt(params.id as string);

  const {
    plans,
    currentSubscription,
    isLoading,
    error,
    fetchPlans,
    fetchCurrentSubscription,
    createCheckoutSession,
    createCustomerPortalSession,
  } = useSubscriptions();

  const { entities, fetchEntities } = useEntities();

  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription(organizationId);
    fetchEntities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  // Entity count and price for billing summary
  // FREE_ENTITY_LIMIT = 1 (first entity free, matching backend subscription_utils.py)
  const entityCount = entities.length;
  const billableEntities = Math.max(0, entityCount - 1);
  const pricePerEntity = plans?.prices?.[0]?.amount ?? 0;
  const monthlyTotal = billableEntities * pricePerEntity;

  // Follow pricing page pattern - handleSubscribe
  const handleSubscribe = async (priceId: string) => {
    setLoadingPriceId(priceId);
    try {
      const checkoutUrl = await createCheckoutSession(priceId, organizationId);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setLoadingPriceId(null);
    }
  };

  // Follow pricing page pattern - handleCustomerPortal
  const handleCustomerPortal = async () => {
    setLoadingPriceId('portal');
    try {
      const portalUrl = await createCustomerPortalSession();
      if (portalUrl) {
        window.location.href = portalUrl;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
    } finally {
      setLoadingPriceId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !plans || !Array.isArray(plans.prices) || plans.prices.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Link href="/organizations">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Organizations
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'No subscription plans found. Please try again later.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <Link href="/organizations">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Organizations
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
        <p className="text-muted-foreground mt-2">
          Choose a plan that fits your needs
        </p>
      </div>

      {currentSubscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>
              {currentSubscription.plan_name
                ? currentSubscription.plan_name.charAt(0) + currentSubscription.plan_name.slice(1).toLowerCase()
                : 'Free'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    currentSubscription.subscription_status === 'ACTIVE' ? 'bg-green-500' :
                    currentSubscription.subscription_status === 'TRIALING' ? 'bg-blue-500' :
                    'bg-red-500'
                  }`}></div>
                  <Badge variant={currentSubscription.subscription_status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {currentSubscription.subscription_status}
                  </Badge>
                </div>
              </div>
              {/* Billing summary — shows entity count × price = monthly total */}
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Monthly billing</p>
                <p className="text-lg font-semibold mt-1">
                  {billableEntities > 0
                    ? `${billableEntities} × ${plans.prices[0]?.currency?.toUpperCase() === 'EUR' ? '€' : '$'}${pricePerEntity.toFixed(2)} = ${plans.prices[0]?.currency?.toUpperCase() === 'EUR' ? '€' : '$'}${monthlyTotal.toFixed(2)}/mo`
                    : 'Free tier'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entityCount} {entityCount === 1 ? 'entity' : 'entities'} (1 free)
                </p>
              </div>
            </div>

            <Button
              onClick={handleCustomerPortal}
              disabled={loadingPriceId === 'portal'}
              variant="outline"
            >
              {loadingPriceId === 'portal' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Billing Portal'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.prices.map((plan: Price) => {
          // Only mark as current if subscription is active - allow re-subscribing if CANCELED
          // Case-insensitive: plan_name may be uppercase from Stripe metadata,
          // plan.name is the Stripe product name (capitalized)
          const isCurrentPlan = currentSubscription?.plan_name?.toUpperCase() === plan.name?.toUpperCase() &&
                                ['ACTIVE', 'TRIALING'].includes(currentSubscription?.subscription_status || '');

          // If org has any active subscription, other plans use Billing Portal to switch
          const hasActiveSubscription = currentSubscription &&
                                        ['ACTIVE', 'TRIALING'].includes(currentSubscription.subscription_status || '');

          return (
            <Card key={plan.id} className={isCurrentPlan ? 'border-primary' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  {isCurrentPlan && <Check className="h-5 w-5 text-primary" />}
                </CardTitle>
                <CardDescription className="min-h-12">
                  {plan.description || `Perfect for ${plan.name.toLowerCase()} teams`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {plan.currency?.toUpperCase() === 'EUR' ? '€' : '$'}{plan.amount.toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{plan.interval || 'month'}
                    </span>
                  </div>
                </div>

                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  className="w-full"
                  variant={isCurrentPlan ? 'outline' : 'default'}
                  disabled={isCurrentPlan || loadingPriceId === plan.id || loadingPriceId === 'portal'}
                  onClick={() => hasActiveSubscription && !isCurrentPlan
                    ? handleCustomerPortal()
                    : handleSubscribe(plan.id)
                  }
                >
                  {(loadingPriceId === plan.id || (!isCurrentPlan && hasActiveSubscription && loadingPriceId === 'portal')) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : hasActiveSubscription ? (
                    'Switch Plan'
                  ) : (
                    'Get Started'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
