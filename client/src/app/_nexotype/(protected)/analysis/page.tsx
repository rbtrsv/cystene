'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { BarChart3 } from 'lucide-react';

/**
 * Analysis Page - Protected by Subscription
 *
 * This page is only accessible to users with an active subscription.
 * The protection is handled by the parent (protected) layout.
 */
export default function AnalysisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analysis</h1>
        <p className="text-muted-foreground">
          Advanced analytics and insights (requires subscription)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Dashboard
          </CardTitle>
          <CardDescription>
            You have access to this page because you have an active subscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your analytics content goes here...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
