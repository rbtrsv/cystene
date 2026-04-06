'use client';

import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Banknote } from 'lucide-react';
import Link from 'next/link';

export default function DistributionsPage() {
  const { activeEntity } = useEntities();

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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Distributions</h1>
        <p className="text-muted-foreground">
          View distribution history for stakeholders on {activeEntity.name}
        </p>
      </div>

      {/* Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Distributions</CardTitle>
          <CardDescription>
            Distribution records for {activeEntity.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <Banknote className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Coming soon</h3>
            <p className="text-sm text-muted-foreground">
              Distributions will be computed from SecurityTransactions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
