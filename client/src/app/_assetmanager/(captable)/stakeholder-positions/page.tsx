'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useStakeholderPositions } from '@/modules/assetmanager/hooks/captable/use-stakeholder-positions';
import { getEntityTypeLabel } from '@/modules/assetmanager/schemas/captable/stakeholder-position.schemas';
import { getStakeholderTypeLabel } from '@/modules/assetmanager/schemas/entity/stakeholder.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Eye, Loader2, TrendingUp, DollarSign, Percent } from 'lucide-react';
import Link from 'next/link';

export default function StakeholderPositionsPage() {
  const router = useRouter();
  const { activeEntity } = useEntities();
  const { positions, isLoading, error, fetchPositions } = useStakeholderPositions();

  // Fetch positions when active entity changes
  useEffect(() => {
    if (activeEntity) {
      fetchPositions(activeEntity.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!activeEntity) {
    return (
      <Alert>
        <AlertDescription>
          Please select an entity first.{' '}
          <Link href="/entities" className="underline">
            Go to Entities
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header — no create button (read-only) */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stakeholder Positions</h1>
        <p className="text-muted-foreground">
          Your positions on other cap tables as {activeEntity.name}
        </p>
      </div>

      {positions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Eye className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No positions found</h3>
            <p className="text-sm text-muted-foreground">
              This entity does not have stakeholder positions on any cap tables
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {positions.map((position) => (
            <Card
              key={position.stakeholder_id}
              className="relative cursor-pointer transition-colors hover:border-primary"
              onClick={() => {
                router.push(`/stakeholder-positions/${position.entity_id}/details`);
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {position.entity_name}
                </CardTitle>
                <CardDescription>
                  {getEntityTypeLabel(position.entity_type)} — {getStakeholderTypeLabel(position.stakeholder_type)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Units:</span>
                    <span className="font-medium">
                      {position.total_units.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Ownership:</span>
                    <span className="font-medium">
                      {position.ownership_percentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Invested:</span>
                    <span className="font-medium">
                      {position.total_invested.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
