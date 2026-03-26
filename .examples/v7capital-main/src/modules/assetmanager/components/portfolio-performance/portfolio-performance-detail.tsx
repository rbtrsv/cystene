'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePortfolioPerformance } from '@/modules/assetmanager/hooks/use-portfolio-performance';
import { useFunds } from '@/modules/assetmanager/hooks/use-funds';
import { useRounds } from '@/modules/assetmanager/hooks/use-rounds';
import { 
  Card,
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
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
import { Pencil, Trash2, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { type PortfolioPerformance } from '@/modules/assetmanager/schemas/portfolio-performance.schemas';

interface PortfolioPerformanceDetailProps {
  id: number;
}

export default function PortfolioPerformanceDetail({ id }: PortfolioPerformanceDetailProps) {
  const router = useRouter();
  const { 
    selectedPortfolioPerformance,
    isLoading, 
    error, 
    fetchPortfolioPerformance,
    removePortfolioPerformance,
    clearError,
    formatCurrency,
    formatPercentage,
    formatMultiple,
    formatDate,
    calculateMetricsForPerformance
  } = usePortfolioPerformance();
  
  const { 
    funds, 
    fetchFunds,
    getFundName 
  } = useFunds();
  
  const { 
    rounds, 
    fetchRounds,
    getRoundName 
  } = useRounds();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  useEffect(() => {
    fetchPortfolioPerformance(id);
    fetchFunds();
    fetchRounds();
  }, [id, fetchPortfolioPerformance, fetchFunds, fetchRounds]);
  
  const handleEdit = () => {
    router.push(`/dashboard/portfolio-performance/${id}/edit`);
  };
  
  const handleDelete = async () => {
    const success = await removePortfolioPerformance(id);
    if (success) {
      router.push('/dashboard/portfolio-performance');
    }
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

  const getPerformanceBadge = (irr: number | null) => {
    if (irr === null || irr === undefined) return 'outline';
    if (irr >= 20) return 'default'; // Excellent
    if (irr >= 15) return 'secondary'; // Good
    if (irr >= 10) return 'outline'; // Average
    return 'destructive'; // Poor
  };

  const getPerformanceLabel = (irr: number | null) => {
    if (irr === null || irr === undefined) return 'N/A';
    if (irr >= 20) return 'Excellent';
    if (irr >= 15) return 'Good';
    if (irr >= 10) return 'Average';
    return 'Poor';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance Details</CardTitle>
          <CardDescription>Loading performance information...</CardDescription>
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
          <CardTitle>Portfolio Performance Details</CardTitle>
          <CardDescription>Error loading performance details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={clearError} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedPortfolioPerformance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance Details</CardTitle>
          <CardDescription>Performance record not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">The requested performance record could not be found.</p>
        </CardContent>
      </Card>
    );
  }

  const fund = getFundName(selectedPortfolioPerformance.fundId);
  const round = getRoundName(selectedPortfolioPerformance.roundId);
  const metrics = calculateMetricsForPerformance(selectedPortfolioPerformance.id);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-xl sm:text-2xl">{fund} Performance</CardTitle>
          <CardDescription>
            {round} • {formatDate(selectedPortfolioPerformance.reportDate)}
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
                  This action cannot be undone. This will permanently delete this performance record.
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
        {/* Key Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics?.totalValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Fair Value + Cash Realized
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Return</CardTitle>
              {(metrics?.totalReturn || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(metrics?.totalReturn || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(metrics?.totalReturn || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Overall performance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IRR</CardTitle>
              <Badge variant={getPerformanceBadge(selectedPortfolioPerformance.irr)}>
                {getPerformanceLabel(selectedPortfolioPerformance.irr)}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedPortfolioPerformance.irr ? formatPercentage(selectedPortfolioPerformance.irr) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Internal Rate of Return
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">TVPI</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedPortfolioPerformance.tvpi ? formatMultiple(selectedPortfolioPerformance.tvpi) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Total Value to Paid-In
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Investment Summary</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Total Invested Amount</h4>
                <p className="text-2xl font-bold">
                  {formatCurrency(selectedPortfolioPerformance.totalInvestedAmount)}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Fair Value</h4>
                <p className="text-xl font-semibold text-blue-600">
                  {formatCurrency(selectedPortfolioPerformance.fairValue)}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Cash Realized</h4>
                <p className="text-xl font-semibold text-green-600">
                  {formatCurrency(selectedPortfolioPerformance.cashRealized)}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Unrealized Gain/Loss</h4>
                <p className={`text-xl font-semibold ${(metrics?.unrealizedGain || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics?.unrealizedGain ? formatCurrency(metrics.unrealizedGain) : 'N/A'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Realized Gain/Loss</h4>
                <p className="text-xl font-semibold text-green-600">
                  {formatCurrency(metrics?.realizedGain || 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Performance Metrics</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">TVPI (Total Value to Paid-In)</h4>
                <p className="text-base">
                  {selectedPortfolioPerformance.tvpi ? formatMultiple(selectedPortfolioPerformance.tvpi) : 'N/A'}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">DPI (Distributions to Paid-In)</h4>
                <p className="text-base">
                  {selectedPortfolioPerformance.dpi ? formatMultiple(selectedPortfolioPerformance.dpi) : 'N/A'}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">RVPI (Residual Value to Paid-In)</h4>
                <p className="text-base">
                  {selectedPortfolioPerformance.rvpi ? formatMultiple(selectedPortfolioPerformance.rvpi) : 'N/A'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">NAV (Net Asset Value)</h4>
                <p className="text-base">
                  {selectedPortfolioPerformance.nav ? formatCurrency(selectedPortfolioPerformance.nav) : 'N/A'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Total Fund Units</h4>
                <p className="text-base">
                  {selectedPortfolioPerformance.totalFundUnits ? formatCurrency(selectedPortfolioPerformance.totalFundUnits) : 'N/A'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">NAV per Share</h4>
                <p className="text-base">
                  {selectedPortfolioPerformance.navPerShare ? formatMultiple(selectedPortfolioPerformance.navPerShare) : 'N/A'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Report Date</h4>
                <p className="text-base">{formatDate(selectedPortfolioPerformance.reportDate)}</p>
              </div>
            </div>

            {/* Notes Section */}
            {selectedPortfolioPerformance.notes && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                <p className="text-base whitespace-pre-wrap">{selectedPortfolioPerformance.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Entities */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Related Entities</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Fund</h4>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-base">{fund || 'Unknown Fund'}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewFund(selectedPortfolioPerformance.fundId)}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Round</h4>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-base">{round || 'Unknown Round'}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewRound(selectedPortfolioPerformance.roundId)}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Metadata</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {formatDateTime(selectedPortfolioPerformance.createdAt)}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {formatDateTime(selectedPortfolioPerformance.updatedAt)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
