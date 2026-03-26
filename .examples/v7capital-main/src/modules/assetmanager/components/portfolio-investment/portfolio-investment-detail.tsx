'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInvestmentPortfolio } from '@/modules/assetmanager/hooks/use-portfolio-investment';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
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
import { Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

interface InvestmentPortfolioDetailProps {
  id: number;
}

export default function InvestmentPortfolioDetail({ id }: InvestmentPortfolioDetailProps) {
  // ===== ROUTER, STATE, AND HOOKS =====
  const router = useRouter();
  const { 
    selectedPortfolio, 
    isLoading, 
    error, 
    fetchPortfolio,
    fetchPortfoliosWithRelations,
    removePortfolio,
    clearError,
    getCompanyName,
    getFundName,
    getRoundName,
    hasPositiveReturns,
    getPortfolioReturn
  } = useInvestmentPortfolio();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // ===== EFFECTS =====
  useEffect(() => {
    fetchPortfolio(id);
    // Also fetch portfolios with relations for company/fund/round names
    fetchPortfoliosWithRelations();
  }, [id, fetchPortfolio, fetchPortfoliosWithRelations]);
  
  // ===== EVENT HANDLERS =====
  const handleDelete = async () => {
    if (selectedPortfolio?.id) {
      const success = await removePortfolio(selectedPortfolio.id);
      if (success) {
        router.push('/dashboard/portfolio/investments');
      }
    }
  };
  
  const handleEdit = () => {
    router.push(`/dashboard/portfolio/investments/${id}/edit`);
  };
  
  // ===== HELPER FUNCTIONS =====
  const formatCurrency = (value: number | null) => {
    if (!value || value === 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number | null) => {
    if (!value) return 'N/A';
    return `${value}%`;
  };

  // Calculate MOIC automatically
  const calculateMOIC = () => {
    if (!selectedPortfolio?.investmentAmount || !selectedPortfolio?.currentFairValue) return 'N/A';

    const investment = selectedPortfolio.investmentAmount;
    const currentFairValue = selectedPortfolio.currentFairValue;

    if (investment === 0) return 'N/A';

    const moic = currentFairValue / investment;
    return moic.toFixed(2);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'EXITED':
        return 'secondary';
      case 'WRITTEN_OFF':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // ===== LOADING AND ERROR STATES =====
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Investment Details</CardTitle>
          <CardDescription>Loading investment information...</CardDescription>
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
          <CardTitle>Investment Details</CardTitle>
          <CardDescription>Error loading investment details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!selectedPortfolio) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Investment Not Found</CardTitle>
          <CardDescription>The requested investment could not be found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The investment you are looking for does not exist or you do not have permission to view it.
          </p>
        </CardContent>
      </Card>
    );
  }

  const returnPercentage = getPortfolioReturn(selectedPortfolio.id!);
  const hasPositiveReturn = hasPositiveReturns(selectedPortfolio.id!);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
            {getCompanyName(selectedPortfolio.companyId)} Investment
            <Badge variant={getStatusBadgeVariant(selectedPortfolio.portfolioStatus)}>
              {selectedPortfolio.portfolioStatus}
            </Badge>
          </CardTitle>
          <CardDescription>
            Investment details and performance metrics
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
                <AlertDialogTitle>Delete Investment</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this portfolio investment? 
                  This action cannot be undone.
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
            <h3 className="text-lg font-semibold">Investment Information</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Fund</h4>
                <p className="text-base">{getFundName(selectedPortfolio.fundId)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Round</h4>
                <p className="text-base">{getRoundName(selectedPortfolio.roundId)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Investment Type</h4>
                <p className="text-base">{selectedPortfolio.investmentType}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Sector</h4>
                <p className="text-base">{selectedPortfolio.sector}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Information</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Investment Amount</h4>
                <p className="text-base font-semibold">{formatCurrency(selectedPortfolio.investmentAmount)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Ownership Percentage</h4>
                <p className="text-base">{formatPercentage(selectedPortfolio.ownershipPercentage)}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Company Type</h4>
                <div className="text-base">
                  <Badge variant="outline">{selectedPortfolio.companyType}</Badge>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Number of Shares</h4>
                <p className="text-base">{selectedPortfolio.numberOfShares ? new Intl.NumberFormat('en-US').format(selectedPortfolio.numberOfShares) : 'N/A'}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Share Price</h4>
                <p className="text-base">{formatCurrency(selectedPortfolio.sharePrice)}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Current Fair Value</h4>
                <p className="text-base font-semibold">{formatCurrency(selectedPortfolio.currentFairValue)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Multiple on Invested Capital (MOIC)</h4>
                <p className="text-base">{calculateMOIC() !== 'N/A' ? `${calculateMOIC()}x` : 'N/A'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Internal Rate of Return (IRR)</h4>
                <p className="text-base">{formatPercentage(selectedPortfolio.irr)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Portfolio Return</h4>
                {hasPositiveReturn ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className={`text-2xl font-bold ${hasPositiveReturn ? 'text-green-600' : 'text-red-600'}`}>
                {returnPercentage.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {hasPositiveReturn ? 'Gain' : 'Loss'} on investment
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Unrealized Gain/Loss</h4>
                {hasPositiveReturn ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className={`text-2xl font-bold ${hasPositiveReturn ? 'text-green-600' : 'text-red-600'}`}>
                {selectedPortfolio.investmentAmount && selectedPortfolio.currentFairValue
                  ? formatCurrency(selectedPortfolio.currentFairValue - selectedPortfolio.investmentAmount)
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Unrealized {hasPositiveReturn ? 'gain' : 'loss'}
              </p>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {selectedPortfolio.notes && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Notes</h3>
            <div className="bg-muted/50 p-4 rounded-md">
              <p className="whitespace-pre-wrap">{selectedPortfolio.notes}</p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Metadata</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {selectedPortfolio.createdAt ? new Date(selectedPortfolio.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {selectedPortfolio.updatedAt ? new Date(selectedPortfolio.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'N/A'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
