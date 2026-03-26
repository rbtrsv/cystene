'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTransactions } from '@/modules/assetmanager/hooks/use-transactions';
import { useStakeholders } from '@/modules/assetmanager/hooks/use-stakeholders';
import { useSecurities } from '@/modules/assetmanager/hooks/use-securities';
import { useFunds } from '@/modules/assetmanager/hooks/use-funds';
import { useRounds } from '@/modules/assetmanager/hooks/use-rounds';
import { formatCurrency } from '@/modules/assetmanager/utils/currency.utils';
import { 
  Card,
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/modules/shadcnui/components/ui/alert-dialog';
import { Pencil, Trash2, ArrowLeft, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { type Transaction } from '@/modules/assetmanager/schemas/transactions.schemas';

interface TransactionDetailProps {
  id: number;
}

// Helper component for dynamic field rendering
interface FieldProps {
  label: string;
  value: any;
  condition?: boolean;
  formatter?: (value: any) => React.ReactNode;
}

function DynamicField({ label, value, condition = true, formatter }: FieldProps) {
  // Don't render if condition is false or if value is null/undefined/empty
  if (!condition || value === null || value === undefined || value === '') {
    return null;
  }

  const displayValue = formatter ? formatter(value) : value;

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <div className="text-base">{displayValue}</div>
    </div>
  );
}

// Helper for date fields
function DateField({ label, value, condition = true }: Omit<FieldProps, 'formatter'>) {
  if (!condition || !value) {
    return null;
  }

  const formatDateField = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <p className="text-base">{formatDateField(value)}</p>
    </div>
  );
}

export default function TransactionDetail({ id }: TransactionDetailProps) {
  const router = useRouter();
  const {
    selectedTransaction,
    isLoading,
    error,
    fetchTransaction,
    deleteTransaction,
    clearError,
    getTransactionTypeLabel,
    formatUnits,
    formatDate,
    getTransactionDirection,
  } = useTransactions();

  // Load entity data for name display
  const { stakeholders } = useStakeholders();
  const { securities } = useSecurities();
  const { funds } = useFunds();
  const { rounds } = useRounds();

  // Helper functions to get entity names
  const getStakeholderName = (id: number) => {
    const stakeholder = stakeholders.find(s => s.id === id);
    return stakeholder ? stakeholder.stakeholderName : `Stakeholder ${id}`;
  };

  const getSecurityName = (id: number) => {
    const security = securities.find(s => s.id === id);
    return security ? `${security.securityName} (${security.code})` : `Security ${id}`;
  };

  const getFundName = (id: number) => {
    const fund = funds.find(f => f.id === id);
    return fund ? fund.name : `Fund ${id}`;
  };

  const getRoundName = (id: number) => {
    const round = rounds.find(r => r.id === id);
    return round ? round.roundName : `Round ${id}`;
  };

  // Helper function to get transaction's currency
  const getTransactionCurrency = () => {
    if (!selectedTransaction) return 'EUR';
    const security = securities.find(s => s.id === selectedTransaction.securityId);
    return security?.currency || 'EUR';
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchTransaction(id);
  }, [id, fetchTransaction]);

  const handleDelete = async () => {
    if (selectedTransaction?.id) {
      const success = await deleteTransaction(selectedTransaction.id);
      if (success) {
        router.push('/dashboard/transactions');
      }
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/transactions/${id}/edit`);
  };

  const getDirectionIcon = (transaction: Transaction) => {
    const direction = getTransactionDirection(transaction);

    if (direction === 'in') {
      return <ArrowUp className="h-5 w-5 text-green-500" />;
    } else if (direction === 'out') {
      return <ArrowDown className="h-5 w-5 text-red-500" />;
    } else {
      return <ArrowUpDown className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    const colorMap: Record<string, string> = {
      // Entity Perspective: Primary transaction types
      ISSUANCE: 'bg-blue-500',
      DISTRIBUTION: 'bg-teal-500',
      REDEMPTION: 'bg-indigo-500',
      // Transfer transactions
      TRANSFER_IN: 'bg-emerald-500',
      TRANSFER_OUT: 'bg-amber-500',
      // Legacy/Other cash transactions
      CASH_IN: 'bg-green-500',
      CASH_OUT: 'bg-red-500',
      COUPON_IN: 'bg-lime-500',
      COUPON_OUT: 'bg-orange-500',
      // Share related transactions
      CONVERSION_IN: 'bg-purple-500',
      CONVERSION_OUT: 'bg-violet-500',
      SPLIT: 'bg-cyan-500',
      CONSOLIDATION: 'bg-teal-500',
      // Option related transactions
      GRANT: 'bg-pink-500',
      VEST: 'bg-rose-500',
      EXERCISE: 'bg-yellow-500',
      EXPIRE: 'bg-red-600',
      FORFEIT: 'bg-orange-600',
      CANCEL: 'bg-gray-500',
    };

    return (
      <Badge className={`${colorMap[type] || 'bg-gray-500'}`}>
        {getTransactionTypeLabel(type as any)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>Loading transaction information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>Error loading transaction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={clearError} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => router.push('/dashboard/transactions')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedTransaction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>Transaction not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">The requested transaction could not be found.</p>
          <Button onClick={() => router.push('/dashboard/transactions')} className="mt-4" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Get entity names
  const stakeholderName = getStakeholderName(selectedTransaction.stakeholderId);
  const securityName = getSecurityName(selectedTransaction.securityId);
  const fundName = selectedTransaction.fundId ? getFundName(selectedTransaction.fundId) : null;
  const roundName = selectedTransaction.roundId ? getRoundName(selectedTransaction.roundId) : null;
  const currency = getTransactionCurrency();

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-xl sm:text-2xl">
            Transaction {selectedTransaction.transactionReference}
          </CardTitle>
          <CardDescription>
            {formatDate(selectedTransaction.transactionDate)} • {selectedTransaction.transactionType}
          </CardDescription>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleEdit} className="justify-start sm:justify-center">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="justify-start sm:justify-center">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this transaction.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Key Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Transaction Details</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Net Amount</h4>
                <p className="text-2xl font-bold">
                  <span className={selectedTransaction.amountDebit - selectedTransaction.amountCredit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {selectedTransaction.amountDebit - selectedTransaction.amountCredit >= 0 ? '+' : '-'}
                    {formatCurrency(Math.abs(selectedTransaction.amountDebit - selectedTransaction.amountCredit), currency)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedTransaction.amountDebit - selectedTransaction.amountCredit >= 0 ? 'Net Inflow' : 'Net Outflow'}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Transaction Type</h4>
                <div className="flex items-center gap-2 mt-1">
                  {getTransactionTypeBadge(selectedTransaction.transactionType)}
                  <div className="flex items-center gap-1">
                    {getDirectionIcon(selectedTransaction)}
                    <span className="text-sm text-muted-foreground">
                      ({getTransactionDirection(selectedTransaction) === 'in'
                        ? 'Incoming'
                        : getTransactionDirection(selectedTransaction) === 'out'
                        ? 'Outgoing'
                        : 'Neutral'})
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Transaction Date</h4>
                <p className="text-base">{formatDate(selectedTransaction.transactionDate)}</p>
              </div>

              {selectedTransaction.notes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                  <p className="text-base">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Related Entities</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Stakeholder</h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-base">{stakeholderName}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/stakeholders/${selectedTransaction.stakeholderId}`)}
                    className="h-6 w-6 p-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Security</h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-base">{securityName}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/securities/${selectedTransaction.securityId}`)}
                    className="h-6 w-6 p-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {selectedTransaction.fundId && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Fund</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-base">{fundName}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/funds/${selectedTransaction.fundId}`)}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              {selectedTransaction.roundId && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Round</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-base">{roundName}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/rounds/${selectedTransaction.roundId}`)}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {selectedTransaction.relatedTransactionId && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Related Transaction</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-mono">#{selectedTransaction.relatedTransactionId}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/transactions/${selectedTransaction.relatedTransactionId}`)}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Financial Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cash Amounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Debit:</span>
                    <span className="font-medium">{formatCurrency(selectedTransaction.amountDebit, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Credit:</span>
                    <span className="font-medium">{formatCurrency(selectedTransaction.amountCredit, currency)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium">Net Amount:</span>
                    <span className={`font-bold ${selectedTransaction.amountDebit - selectedTransaction.amountCredit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(selectedTransaction.amountDebit - selectedTransaction.amountCredit, currency)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Units</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Debit:</span>
                    <span className="font-medium">{formatUnits(selectedTransaction.unitsDebit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Credit:</span>
                    <span className="font-medium">{formatUnits(selectedTransaction.unitsCredit)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium">Net Units:</span>
                    {/* Entity Perspective: stakeholder balance = unitsCredit - unitsDebit */}
                    <span className={`font-bold ${selectedTransaction.unitsCredit - selectedTransaction.unitsDebit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatUnits(selectedTransaction.unitsCredit - selectedTransaction.unitsDebit)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Metadata */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Metadata</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {new Date(selectedTransaction.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {new Date(selectedTransaction.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}