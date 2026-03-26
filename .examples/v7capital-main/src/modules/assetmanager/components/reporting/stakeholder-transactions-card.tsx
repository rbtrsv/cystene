'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getStakeholderLockupData } from '../../actions/transactions.actions';
import { type StakeholderLockup } from '../../schemas/securities.schemas';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/modules/shadcnui/components/ui/card';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/modules/shadcnui/components/ui/table';
import { Receipt, Lock, CheckCircle } from 'lucide-react';

export default function StakeholderTransactionsCard() {
  // ===== STATE =====
  const [lockupItems, setLockupItems] = useState<StakeholderLockup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===== EFFECTS =====
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const response = await getStakeholderLockupData();
      if (response.success && response.data) {
        setLockupItems(response.data);
      } else {
        setError(response.error || 'Failed to fetch transactions');
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // ===== HELPER FUNCTIONS =====
  // Format currency with EUR
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format units
  const formatUnitsValue = (units: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(units);
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate lockup end date
  const calculateLockupEnd = (transactionDate: Date, lockupMonths: number): Date => {
    const end = new Date(transactionDate);
    end.setMonth(end.getMonth() + lockupMonths);
    return end;
  };

  // Format remaining time until lockup ends
  const formatRemaining = (endDate: Date): string => {
    const now = new Date();
    if (endDate <= now) return 'Available';
    const diffMs = endDate.getTime() - now.getTime();
    const months = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30));
    if (months === 1) return '1 month';
    return `${months} months`;
  };

  // ===== DERIVED STATE =====
  // Filter to only show transactions where stakeholder received units (investments)
  const transactions = useMemo(() => {
    return lockupItems
      .filter(item => item.unitsCredit > 0)
      .map(item => {
        const transactionDate = new Date(item.transactionDate);
        let lockupEndDate: Date | null = null;
        let isLocked = false;
        let lockupStatus = '';

        if (item.lockupMonths && item.lockupMonths > 0) {
          lockupEndDate = calculateLockupEnd(transactionDate, item.lockupMonths);
          const now = new Date();
          isLocked = lockupEndDate > now;
          lockupStatus = formatRemaining(lockupEndDate);
        }

        return {
          ...item,
          transactionDate,
          lockupEndDate,
          isLocked,
          lockupStatus
        };
      });
  }, [lockupItems]);

  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            My Investments
          </CardTitle>
          <CardDescription>Loading investments...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            My Investments
          </CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive py-4">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            My Investments
          </CardTitle>
          <CardDescription>No investments available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No investment history available</p>
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
          My Investments
        </CardTitle>
        <CardDescription>
          Your investment history and lockup status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Security</TableHead>
              <TableHead className="text-right">Units</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Lockup</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.transactionId}>
                <TableCell className="text-muted-foreground">
                  {formatDate(tx.transactionDate)}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{tx.securityCode}</span>
                </TableCell>
                <TableCell className="text-right font-mono text-green-600">
                  +{formatUnitsValue(tx.unitsCredit)}
                </TableCell>
                <TableCell className="text-right font-mono text-red-600">
                  -{formatAmount(tx.amount)}
                </TableCell>
                <TableCell className="text-right">
                  {tx.lockupEndDate ? (
                    tx.isLocked ? (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="h-3 w-3" />
                        {tx.lockupStatus}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Free
                      </Badge>
                    )
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
