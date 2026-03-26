'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Lock, CreditCard } from 'lucide-react';

// ==========================================
// Display Constants (presentation only — not authorization)
// ==========================================

// Why: human-readable tier names for the upgrade card
const TIER_DISPLAY_NAMES: Record<string, string> = {
  FREE: 'Free',
  PERSONAL: 'Personal',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
};

// Why: brief description of what each tier includes, shown on upgrade card
const TIER_DESCRIPTIONS: Record<string, string> = {
  PERSONAL: 'Genetic profile analysis, biomarker tracking, and personalized recommendations.',
  PRO: 'Full access to omics, clinical, engineering, LIMS, and knowledge graph modules.',
  ENTERPRISE: 'Complete platform with commercial intelligence, patents, M&A, and licensing.',
};

// ==========================================
// UpgradeRequired Component
// ==========================================

interface UpgradeRequiredProps {
  requiredTier: string;
  currentTier: string;
  featureName: string;
}

/**
 * Displayed in place of page content when the user's subscription tier
 * is insufficient for the requested route. Visual pattern matches
 * (protected)/layout.tsx (Card + Lock icon in amber circle + CTA button).
 */
export function UpgradeRequired({ requiredTier, currentTier, featureName }: UpgradeRequiredProps) {
  const requiredDisplayName = TIER_DISPLAY_NAMES[requiredTier] ?? requiredTier;
  const currentDisplayName = TIER_DISPLAY_NAMES[currentTier] ?? currentTier;
  const tierDescription = TIER_DESCRIPTIONS[requiredTier] ?? '';

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle>Upgrade Required</CardTitle>
          <CardDescription>
            {featureName} requires the <span className="font-semibold">{requiredDisplayName}</span> plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div>
            <span className="text-sm text-muted-foreground">Your current plan: </span>
            <Badge variant="secondary">{currentDisplayName}</Badge>
          </div>
          {tierDescription && (
            <p className="text-sm text-muted-foreground">
              The {requiredDisplayName} plan includes: {tierDescription}
            </p>
          )}
          <Link href="/organizations">
            <Button className="mt-2">
              <CreditCard className="mr-2 h-4 w-4" />
              View Subscription Plans
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default UpgradeRequired;
