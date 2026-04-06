'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useStakeholderPositions } from '@/modules/assetmanager/hooks/captable/use-stakeholder-positions';
import { getEntityTypeLabel } from '@/modules/assetmanager/schemas/captable/stakeholder-position.schemas';
import { getStakeholderTypeLabel } from '@/modules/assetmanager/schemas/entity/stakeholder.schemas';
import { getTransactionTypeLabel } from '@/modules/assetmanager/schemas/captable/security-transaction.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { Eye, Loader2, TrendingUp, DollarSign, Percent, FolderInput } from 'lucide-react';
import Link from 'next/link';

export default function StakeholderPositionDetailPage() {
  const params = useParams();
  const entityId = parseInt(params.entity_id as string);
  const { activeEntity } = useEntities();
  const { activePosition, isLoading, error, fetchPosition, trackAsHolding } = useStakeholderPositions();
  const [trackResult, setTrackResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Fetch position detail when entity or activeEntity changes
  useEffect(() => {
    if (activeEntity && entityId) {
      fetchPosition(entityId, activeEntity.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, activeEntity]);

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

  // Handle track as holding button click
  const handleTrackAsHolding = async () => {
    if (!activeEntity) return;
    setIsTracking(true);
    setTrackResult(null);

    const response = await trackAsHolding(entityId, activeEntity.id);

    if (response.success) {
      setTrackResult({ success: true, message: response.message || 'Holding tracked successfully' });
    } else {
      setTrackResult({ success: false, message: response.error || 'Failed to track as holding' });
    }
    setIsTracking(false);
  };

  if (!activePosition) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Position not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Link href="/stakeholder-positions">
            <Button variant="ghost" size="sm">
              ← Back to Positions
            </Button>
          </Link>
          <Button
            onClick={handleTrackAsHolding}
            disabled={isTracking}
            size="sm"
          >
            {isTracking ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FolderInput className="h-4 w-4 mr-2" />
            )}
            Track as Holding
          </Button>
        </div>

        {/* Track result feedback */}
        {trackResult && (
          <Alert variant={trackResult.success ? 'default' : 'destructive'} className="mb-4">
            <AlertDescription>{trackResult.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-3">
          <Eye className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {activePosition.entity_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">
                {getEntityTypeLabel(activePosition.entity_type)}
              </Badge>
              <Badge variant="outline">
                {getStakeholderTypeLabel(activePosition.stakeholder_type)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePosition.total_units.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">net units held</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ownership</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePosition.ownership_percentage.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">of cap table</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePosition.total_invested.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">capital invested</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            Security transactions for this position
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!activePosition.transactions || activePosition.transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Eye className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions</h3>
              <p className="text-sm text-muted-foreground">
                No security transactions found for this position
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Units Debit</TableHead>
                  <TableHead className="text-right">Units Credit</TableHead>
                  <TableHead className="text-right">Amount Debit</TableHead>
                  <TableHead className="text-right">Amount Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activePosition.transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>
                      {new Date(txn.transaction_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getTransactionTypeLabel(txn.transaction_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {txn.transaction_reference}
                    </TableCell>
                    <TableCell className="text-right">
                      {txn.units_debit > 0 ? txn.units_debit.toLocaleString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {txn.units_credit > 0 ? txn.units_credit.toLocaleString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {txn.amount_debit > 0 ? txn.amount_debit.toLocaleString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {txn.amount_credit > 0 ? txn.amount_credit.toLocaleString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
