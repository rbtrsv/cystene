'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSubscriptions } from '@/modules/accounts/hooks/use-subscriptions';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Loader2, Lock, CreditCard } from 'lucide-react';

/**
 * Protected Layout - Requires Active Subscription
 *
 * This layout wraps routes that require an active subscription.
 * If user doesn't have an active subscription, they see a message
 * with a button to go to organizations page.
 *
 * Usage: Place pages that require subscription inside app/(assetmanager)/(protected)/
 * Example: app/(assetmanager)/(protected)/analysis/page.tsx
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeOrganization, isLoading: orgsLoading } = useOrganizations();
  const { currentSubscription, isLoading: subLoading, fetchCurrentSubscription } = useSubscriptions();
  const [hasChecked, setHasChecked] = useState(false);

  // Fetch subscription when active organization changes
  useEffect(() => {
    if (activeOrganization?.id) {
      fetchCurrentSubscription(activeOrganization.id).then(() => {
        setHasChecked(true);
      });
    } else if (!orgsLoading) {
      setHasChecked(true);
    }
  }, [activeOrganization?.id, orgsLoading, fetchCurrentSubscription]);

  // Show loading state while checking
  if (!hasChecked || orgsLoading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Checking subscription...</p>
        </div>
      </div>
    );
  }

  // Check subscription status
  const hasActiveSubscription =
    currentSubscription?.subscription_status === 'ACTIVE' ||
    currentSubscription?.subscription_status === 'TRIALING';

  // No active subscription - show upgrade prompt
  if (!hasActiveSubscription) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle>Subscription Required</CardTitle>
            <CardDescription>
              This feature requires an active subscription. Upgrade your plan to unlock access.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/organizations">
              <Button>
                <CreditCard className="mr-2 h-4 w-4" />
                View Subscription Plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Subscription is valid, render children
  return <>{children}</>;
}
