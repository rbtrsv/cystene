'use client';

import React, { useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Skeleton } from '@/modules/shadcnui/components/ui/skeleton';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Building2, Users, CreditCard } from 'lucide-react';
// Client auth (comment out to switch back):
// import { useAuth } from '@/modules/accounts/hooks/use-auth-client';

// Server auth (current):
import { useAuth } from '@/modules/accounts/hooks/use-auth-server';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { useSubscriptions } from '@/modules/accounts/hooks/use-subscriptions';

function DashboardContent() {
  // Use hooks following the architecture pattern - hooks provide all data
  const { user, isLoading: userLoading, error: userError, initialize } = useAuth();
  
  // Note: Route protection handled by middleware, no need for redirect here
  const { 
    organizations, 
    activeOrganization, 
    activeOrganizationId,
    isLoading: orgLoading, 
    error: orgError 
  } = useOrganizations();
  
  const { 
    currentSubscription, 
    isLoading: subLoading, 
    error: subError,
    isSubscriptionActive,
    getSubscriptionStatus
  } = useSubscriptions();

  const isLoading = userLoading || orgLoading || subLoading;
  const error = userError || orgError || subError;

  // Handle Stripe success callback
  useEffect(() => {
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get('session_id');
    if (sessionId) {
      // Remove session_id from URL without refresh
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.toString());
      
      // Reinitialize auth to get fresh data after successful payment
      initialize();
    }
  }, [initialize]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="my-4">
        <CardHeader>
          <CardTitle>Error Loading Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error.toString()}</p>
          <p className="mt-2">Unable to load dashboard data. Please try refreshing the page.</p>
        </CardContent>
      </Card>
    );
  }

  // Ensure we have user data and it's a proper user object (not boolean)
  if (!user || typeof user === 'boolean') {
    return (
      <Card className="my-4">
        <CardHeader>
          <CardTitle>Error Loading Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Unable to load user data. Please try refreshing the page.</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user.name || user.email || 'User'}
        </p>
      </div>
      
      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Profile</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.name || 'Not set'}</div>
            <p className="text-xs text-muted-foreground">
              {user.email}
            </p>
            <div className="mt-2">
              <Badge variant="outline">{user.role}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Organization Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organization</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {activeOrganization ? (
              <>
                <div className="text-2xl font-bold">{activeOrganization.name}</div>
                <p className="text-xs text-muted-foreground">
                  {organizations.length} organization{organizations.length !== 1 ? 's' : ''} total
                </p>
                <div className="mt-2">
                  <Badge variant="default">Active</Badge>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">No Organization</div>
                <p className="text-xs text-muted-foreground">
                  No active organization found
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {currentSubscription ? (
              <>
                <div className="text-2xl font-bold">
                  {currentSubscription.plan_name
                    ? currentSubscription.plan_name.charAt(0) + currentSubscription.plan_name.slice(1).toLowerCase()
                    : 'Unknown Plan'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isSubscriptionActive() ? 'Active subscription' : 
                   getSubscriptionStatus() === 'TRIALING' ? 'Trial period' :
                   getSubscriptionStatus() === 'PAST_DUE' ? 'Payment past due' :
                   getSubscriptionStatus() === 'CANCELED' ? 'Subscription canceled' : 'Inactive'}
                </p>
                <div className="mt-2">
                  <Badge variant={isSubscriptionActive() ? "default" : getSubscriptionStatus() === 'TRIALING' ? "outline" : "destructive"}>
                    {isSubscriptionActive() ? 'Active' : 
                     getSubscriptionStatus() === 'TRIALING' ? 'Trial' :
                     getSubscriptionStatus() === 'PAST_DUE' ? 'Past Due' :
                     getSubscriptionStatus() === 'CANCELED' ? 'Canceled' : 'Inactive'}
                  </Badge>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">Free Plan</div>
                <p className="text-xs text-muted-foreground">
                  No active subscription
                </p>
                <div className="mt-2">
                  <Badge variant="secondary">Free</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Details */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <p className="text-sm">{user.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm">{user.name || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <div className="text-sm">
                  <Badge variant="outline">{user.role}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization & Subscription Details */}
        <Card>
          <CardHeader>
            <CardTitle>Organization & Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Active Organization</label>
                <p className="text-sm">{activeOrganization?.name || 'None'}</p>
                {activeOrganizationId && (
                  <p className="text-xs text-muted-foreground">ID: {activeOrganizationId}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">All Organizations</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {organizations.length > 0 ? (
                    organizations.map((org) => (
                      <Badge 
                        key={org.id} 
                        variant={org.id === activeOrganizationId ? "default" : "outline"}
                        className="text-xs"
                      >
                        {org.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No organizations</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Subscription</label>
                {currentSubscription ? (
                  <>
                    <p className="text-sm">
                      {currentSubscription.plan_name
                        ? currentSubscription.plan_name.charAt(0) + currentSubscription.plan_name.slice(1).toLowerCase()
                        : 'Unknown Plan'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status: {currentSubscription.subscription_status}
                      {currentSubscription.start_date && (
                        <> • Started: {new Date(currentSubscription.start_date).toLocaleDateString()}</>
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm">No active subscription</p>
                    <p className="text-xs text-muted-foreground">Using free plan</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="space-y-6"><div className="h-12 w-1/2 bg-gray-200 animate-pulse rounded" /><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"><div className="h-32 w-full bg-gray-200 animate-pulse rounded" /><div className="h-32 w-full bg-gray-200 animate-pulse rounded" /><div className="h-32 w-full bg-gray-200 animate-pulse rounded" /></div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
