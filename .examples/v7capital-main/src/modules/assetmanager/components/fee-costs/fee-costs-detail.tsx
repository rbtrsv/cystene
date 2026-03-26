'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFeeCosts } from '@/modules/assetmanager/hooks/use-fee-costs';
import { useFunds } from '@/modules/assetmanager/hooks/use-funds';
import { useRounds } from '@/modules/assetmanager/hooks/use-rounds';
import { formatCurrency } from '@/modules/assetmanager/utils/currency.utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
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
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Pencil, Trash2, ArrowLeft, ExternalLink } from 'lucide-react';
import { type FeeCost, type FeeCostType, type Frequency } from '@/modules/assetmanager/schemas/fee-costs.schemas';

interface FeeCostsDetailProps {
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
      <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
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
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
      <p className="text-base">{formatDateField(value)}</p>
    </div>
  );
}

export default function FeeCostsDetail({ id }: FeeCostsDetailProps) {
  const router = useRouter();
  const {
    selectedFeeCost,
    isLoading,
    error,
    fetchFeeCost,
    removeFeeCost,
    clearError,
  } = useFeeCosts();

  // Load entity data for name display
  const { funds, getFundName } = useFunds();
  const { rounds, getRoundName } = useRounds();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchFeeCost(id);
  }, [id, fetchFeeCost]);

  const handleDelete = async () => {
    if (selectedFeeCost?.id) {
      const success = await removeFeeCost(selectedFeeCost.id);
      if (success) {
        router.push('/dashboard/fee-costs');
      }
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/fee-costs/${id}/edit`);
  };

  const handleBack = () => {
    router.push('/dashboard/fee-costs');
  };

  const handleViewFund = (fundId: number) => {
    router.push(`/dashboard/funds/${fundId}`);
  };

  const handleViewRound = (roundId: number) => {
    router.push(`/dashboard/rounds/${roundId}`);
  };

  const formatDateTime = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFeeCostTypeBadge = (type: FeeCostType) => {
    const colorMap: Partial<Record<FeeCostType, string>> = {
      'MANAGEMENT': 'bg-blue-500',
      'PERFORMANCE': 'bg-green-500',
      'SETUP': 'bg-purple-500',
      'ADMINISTRATIVE': 'bg-orange-500',
      'LEGAL': 'bg-indigo-500',
      'AUDIT': 'bg-cyan-500',
      'CUSTODIAN': 'bg-teal-500',
      'OTHER': 'bg-gray-500',
    };
    return colorMap[type] || 'bg-gray-500';
  };

  const getFrequencyBadge = (frequency: Frequency) => {
    const colorMap: Partial<Record<Frequency, string>> = {
      'ONE_TIME': 'bg-gray-500',
      'MONTHLY': 'bg-blue-500',
      'QUARTERLY': 'bg-green-500',
      'ANNUAL': 'bg-purple-500',
    };
    return colorMap[frequency] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>Fee Cost Details</CardTitle>
          <CardDescription>Loading fee cost information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </>
    );
  }

  if (error) {
    return (
      <>
        <CardHeader>
          <CardTitle>Fee Cost Details</CardTitle>
          <CardDescription>Error loading fee cost details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={clearError} variant="outline">
              Try Again
            </Button>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
          </div>
        </CardContent>
      </>
    );
  }

  if (!selectedFeeCost) {
    return (
      <>
        <CardHeader>
          <CardTitle>Fee Cost Details</CardTitle>
          <CardDescription>Fee cost not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">The requested fee cost could not be found.</p>
          <Button onClick={handleBack} className="mt-4" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </CardContent>
      </>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-xl sm:text-2xl">{selectedFeeCost.feeCostName || selectedFeeCost.feeCostType}</CardTitle>
          <CardDescription>
            {selectedFeeCost.date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
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
                  This action cannot be undone. This will permanently delete this fee cost entry.
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
            <h3 className="text-lg font-semibold">Fee/Cost Details</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Amount</h4>
                <p className="text-2xl font-bold">
                  <span className="text-red-600">
                    -{formatCurrency(selectedFeeCost.amount, 'USD')}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fee/Cost Outflow
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Fee/Cost Type</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    className={`${getFeeCostTypeBadge(selectedFeeCost.feeCostType)} text-white border-0`}
                  >
                    {selectedFeeCost.feeCostType}
                  </Badge>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                <p className="text-base">{selectedFeeCost.date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Frequency</h4>
                <Badge 
                  className={`${getFrequencyBadge(selectedFeeCost.frequency)} text-white border-0`}
                >
                  {selectedFeeCost.frequency.replace('_', ' ')}
                </Badge>
              </div>

              {selectedFeeCost.feeCostName && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Fee/Cost Name</h4>
                  <p className="text-base">{selectedFeeCost.feeCostName}</p>
                </div>
              )}

              {selectedFeeCost.transactionReference && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Transaction Reference</h4>
                  <p className="text-sm font-mono">{selectedFeeCost.transactionReference}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Related Entities</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Fund</h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-base">{getFundName(selectedFeeCost.fundId) || 'Unknown Fund'}</p>
                  {selectedFeeCost.fundId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewFund(selectedFeeCost.fundId!)}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              {selectedFeeCost.roundId && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Round</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-base">{getRoundName(selectedFeeCost.roundId) || 'Unknown Round'}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewRound(selectedFeeCost.roundId!)}
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

        {/* Description Section */}
        {selectedFeeCost.description && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Description</h3>
            <div className="bg-muted/50 p-4 rounded-md">
              <p className="whitespace-pre-wrap">{selectedFeeCost.description}</p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Metadata</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {formatDateTime(selectedFeeCost.createdAt)}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {formatDateTime(selectedFeeCost.updatedAt)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}