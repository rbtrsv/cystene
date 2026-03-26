'use client';

/**
 * Stakeholder Transactions Card
 *
 * Displays security transactions for the selected entity.
 * Shows transaction date, type, stakeholder, units, and amounts.
 * Data from: existing SecurityTransaction CRUD store filtered by entity_id.
 *
 * Adapted from v7capital's stakeholder-transactions-card.tsx
 */

import React, { useMemo } from 'react';
import type { SecurityTransaction } from '../../schemas/captable/security-transaction.schemas';
import { getTransactionTypeLabel } from '../../schemas/captable/security-transaction.schemas';
import type { Stakeholder } from '../../schemas/entity/stakeholder.schemas';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/modules/shadcnui/components/ui/card';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { Receipt } from 'lucide-react';

// ==========================================
// Props
// ==========================================

interface StakeholderTransactionsCardProps {
  transactions: SecurityTransaction[];
  stakeholders: Stakeholder[];
  isLoading: boolean;
}

// ==========================================
// Helper Functions
// ==========================================

/** Format number as currency */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/** Format units */
const formatUnits = (units: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(units);
};

/** Format date */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// ==========================================
// Component
// ==========================================

export default function StakeholderTransactionsCard({
  transactions,
  stakeholders,
  isLoading,
}: StakeholderTransactionsCardProps) {
  // ===== DERIVED STATE =====
  // Build stakeholder lookup map
  const stakeholderMap = useMemo(() => {
    const map = new Map<number, string>();
    stakeholders.forEach((s) => {
      map.set(s.id, s.name);
    });
    return map;
  }, [stakeholders]);

  // Sort transactions by date descending
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort(
      (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    );
  }, [transactions]);

  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Stakeholder Transactions
          </CardTitle>
          <CardDescription>Loading transactions...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (sortedTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Stakeholder Transactions
          </CardTitle>
          <CardDescription>No transactions available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No security transactions found for this entity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ===== MAIN COMPONENT RENDER =====
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Stakeholder Transactions
        </CardTitle>
        <CardDescription>
          Security transactions for this entity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Stakeholder</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Units (Credit)</TableHead>
              <TableHead className="text-right">Units (Debit)</TableHead>
              <TableHead className="text-right">Amount (Credit)</TableHead>
              <TableHead className="text-right">Amount (Debit)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="text-muted-foreground">
                  {formatDate(tx.transaction_date)}
                </TableCell>
                <TableCell className="font-medium">
                  {stakeholderMap.get(tx.stakeholder_id) || `Stakeholder #${tx.stakeholder_id}`}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getTransactionTypeLabel(tx.transaction_type)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {tx.transaction_reference}
                </TableCell>
                <TableCell className="text-right font-mono text-green-600">
                  {tx.units_credit > 0 ? `+${formatUnits(tx.units_credit)}` : '—'}
                </TableCell>
                <TableCell className="text-right font-mono text-red-600">
                  {tx.units_debit > 0 ? `-${formatUnits(tx.units_debit)}` : '—'}
                </TableCell>
                <TableCell className="text-right font-mono text-green-600">
                  {tx.amount_credit > 0 ? `+${formatCurrency(tx.amount_credit)}` : '—'}
                </TableCell>
                <TableCell className="text-right font-mono text-red-600">
                  {tx.amount_debit > 0 ? `-${formatCurrency(tx.amount_debit)}` : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
