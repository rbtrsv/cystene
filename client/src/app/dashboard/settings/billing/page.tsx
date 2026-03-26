'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Skeleton } from '@/modules/shadcnui/components/ui/skeleton';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Settings, 
  ExternalLink,
  AlertTriangle 
} from 'lucide-react';
import { useAuth } from '@/modules/accounts/hooks/use-auth-server';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { useSubscriptions } from '@/modules/accounts/hooks/use-subscriptions';

export default function BillingPage() {
  const [isManaging, setIsManaging] = useState(false);
  const { user, isLoading: userLoading, error: userError } = useAuth();
  const { 
    activeOrganization, 
    isLoading: orgLoading, 
    error: orgError 
  } = useOrganizations();
  
  const { 
    currentSubscription, 
    isLoading: subLoading, 
    error: subError,
    isSubscriptionActive,
    getSubscriptionStatus,
    createCustomerPortalSession
  } = useSubscriptions();

  const isLoading = userLoading || orgLoading || subLoading;
  const error = userError || orgError || subError;

  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
      const portalUrl = await createCustomerPortalSession();
      if (portalUrl) {
        window.location.href = portalUrl;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
    } finally {
      setIsManaging(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription and billing information
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription and billing information
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <p>Error loading billing information: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and billing information for {activeOrganization?.name || 'your organization'}
        </p>
      </div>

      {/* Current Subscription Card */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Current Subscription</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {currentSubscription ? (
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">
                    {currentSubscription.plan_name
                      ? currentSubscription.plan_name.charAt(0) + currentSubscription.plan_name.slice(1).toLowerCase()
                      : 'Unknown Plan'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isSubscriptionActive() ? 'Your subscription is active' : 
                     getSubscriptionStatus() === 'TRIALING' ? 'Currently in trial period' :
                     getSubscriptionStatus() === 'PAST_DUE' ? 'Payment is past due' :
                     getSubscriptionStatus() === 'CANCELED' ? 'Subscription has been canceled' : 
                     'Subscription is inactive'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={
                    isSubscriptionActive() ? "default" : 
                    getSubscriptionStatus() === 'TRIALING' ? "outline" : 
                    "destructive"
                  }>
                    {isSubscriptionActive() ? 'Active' : 
                     getSubscriptionStatus() === 'TRIALING' ? 'Trial' :
                     getSubscriptionStatus() === 'PAST_DUE' ? 'Past Due' :
                     getSubscriptionStatus() === 'CANCELED' ? 'Canceled' : 'Inactive'}
                  </Badge>
                </div>

                {currentSubscription.start_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Started: {new Date(currentSubscription.start_date).toLocaleDateString()}</span>
                  </div>
                )}

                {currentSubscription.end_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {getSubscriptionStatus() === 'CANCELED' ? 'Ends' : 'Next billing'}: {' '}
                      {new Date(currentSubscription.end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">Free Plan</div>
                  <p className="text-sm text-muted-foreground">
                    You&apos;re currently on the free plan
                  </p>
                </div>
                <Badge variant="secondary">Free</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organization Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Billing Information</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Organization</label>
                <p className="text-sm">{activeOrganization?.name || 'Unknown Organization'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Billing Contact</label>
                <p className="text-sm">{user?.email}</p>
              </div>

              {currentSubscription?.stripe_customer_id && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer ID</label>
                  <p className="text-xs font-mono text-muted-foreground">
                    {currentSubscription.stripe_customer_id}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Subscription Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentSubscription ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use the Stripe Customer Portal to manage your subscription, update payment methods, 
                view invoices, and cancel your subscription.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleManageSubscription}
                  disabled={isManaging}
                  className="flex items-center gap-2"
                >
                  {isManaging ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Opening Portal...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4" />
                      Manage Subscription
                    </>
                  )}
                </Button>
                
                <Button variant="outline" asChild>
                  <a href="/pricing" className="flex items-center gap-2">
                    View Available Plans
                  </a>
                </Button>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-2">What you can do in the portal:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Update payment methods and billing address</li>
                  <li>• View and download invoices</li>
                  <li>• Cancel or pause your subscription</li>
                  <li>• Update subscription plan</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You&apos;re currently on the free plan. Upgrade to a paid plan to access premium features.
              </p>
              
              <Button asChild>
                <a href="/pricing" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Choose a Plan
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}