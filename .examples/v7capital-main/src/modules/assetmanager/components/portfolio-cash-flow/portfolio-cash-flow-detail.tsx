'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePortfolioCashFlow } from '@/modules/assetmanager/hooks/use-portfolio-cash-flow';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
import { useFunds } from '@/modules/assetmanager/hooks/use-funds';
import { useRounds } from '@/modules/assetmanager/hooks/use-rounds';
import { formatCurrency } from '@/modules/assetmanager/utils/currency.utils';
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
import { Pencil, Trash2, ExternalLink } from 'lucide-react';
import { type PortfolioCashFlow, type CashFlowType } from '@/modules/assetmanager/schemas/portfolio-cash-flow.schemas';

// Helper function to calculate net amount (debit - credit from fund perspective)
function getNetAmount(cashFlow: PortfolioCashFlow): number {
  const debit = cashFlow.amountDebit || 0;
  const credit = cashFlow.amountCredit || 0;
  return debit - credit;
}

interface PortfolioCashFlowDetailProps {
  id: number;
}

export default function PortfolioCashFlowDetail({ id }: PortfolioCashFlowDetailProps) {
  const router = useRouter();
  const { 
    selectedCashFlow,
    isLoading, 
    error, 
    fetchCashFlow,
    removeCashFlow,
    clearError 
  } = usePortfolioCashFlow();
  
  const { 
    companies, 
    fetchCompanies,
    getCompanyName 
  } = useCompanies();
  
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
    fetchCashFlow(id);
    fetchCompanies();
    fetchFunds();
    fetchRounds();
  }, [id, fetchCashFlow, fetchCompanies, fetchFunds, fetchRounds]);
  
  const handleEdit = () => {
    router.push(`/dashboard/portfolio/cash-flows/${id}/edit`);
  };
  
  const handleDelete = async () => {
    const success = await removeCashFlow(id);
    if (success) {
      router.push('/dashboard/portfolio/cash-flows');
    }
  };

  const handleViewCompany = (companyId: number) => {
    router.push(`/dashboard/companies/${companyId}`);
  };

  const handleViewFund = (fundId: number) => {
    router.push(`/dashboard/funds/${fundId}`);
  };

  const handleViewRound = (roundId: number) => {
    router.push(`/dashboard/rounds/${roundId}`);
  };
  
  const formatDate = (date: Date | string): string => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  const getCashFlowTypeBadge = (type: CashFlowType) => {
    const colorMap: Partial<Record<CashFlowType, string>> = {
      'Investment': 'bg-blue-500',
      'Follow-on': 'bg-indigo-500',
      'Dividend': 'bg-green-500',
      'Interest': 'bg-emerald-500',
      'Sale Proceeds': 'bg-purple-500',
      'Exit Proceeds': 'bg-violet-500',
      'Distribution': 'bg-cyan-500',
      'Management Fee': 'bg-orange-500',
      'Performance Fee': 'bg-amber-500',
    };
    return colorMap[type] || 'bg-gray-500';
  };
  
  const getCashFlowDirection = (type: CashFlowType) => {
    const outflows = ['Investment', 'Follow-on', 'Management Fee', 'Performance Fee'];
    return outflows.includes(type) ? 'Outflow' : 'Inflow';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Details</CardTitle>
          <CardDescription>Loading cash flow information...</CardDescription>
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
          <CardTitle>Cash Flow Details</CardTitle>
          <CardDescription>Error loading cash flow details</CardDescription>
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

  if (!selectedCashFlow) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Details</CardTitle>
          <CardDescription>Cash flow not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">The requested cash flow could not be found.</p>
        </CardContent>
      </Card>
    );
  }

  const company = getCompanyName(selectedCashFlow.companyId);
  const fund = selectedCashFlow.fundId ? getFundName(selectedCashFlow.fundId) : null;
  const round = selectedCashFlow.roundId ? getRoundName(selectedCashFlow.roundId) : null;

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-xl sm:text-2xl">{company} Cash Flow</CardTitle>
          <CardDescription>
            {formatDate(selectedCashFlow.date)} • {selectedCashFlow.currency || 'USD'}
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
                  This action cannot be undone. This will permanently delete this cash flow entry.
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
            <h3 className="text-lg font-semibold">Financial Details</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Amount</h4>
                <p className="text-2xl font-bold">
                  <span className={getNetAmount(selectedCashFlow) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {getNetAmount(selectedCashFlow) >= 0 ? '+' : '-'}
                    {formatCurrency(Math.abs(getNetAmount(selectedCashFlow)), selectedCashFlow.currency || 'EUR')}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getNetAmount(selectedCashFlow) >= 0 ? 'Inflow (Debit)' : 'Outflow (Credit)'}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Cash Flow Type</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    className={`${getCashFlowTypeBadge(selectedCashFlow.cashFlowType)} text-white border-0`}
                  >
                    {selectedCashFlow.cashFlowType}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({getCashFlowDirection(selectedCashFlow.cashFlowType)})
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                <p className="text-base">{formatDate(selectedCashFlow.date)}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Scenario</h4>
                <Badge variant={selectedCashFlow.scenario === 'Actual' ? 'default' : 'outline'}>
                  {selectedCashFlow.scenario}
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Include in IRR</h4>
                <Badge variant={selectedCashFlow.includeInIrr ? 'default' : 'secondary'}>
                  {selectedCashFlow.includeInIrr ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Related Entities</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Company</h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-base">{company || 'Unknown Company'}</p>
                  {selectedCashFlow.companyId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewCompany(selectedCashFlow.companyId!)}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              {selectedCashFlow.fundId && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Fund</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-base">{fund || 'Unknown Fund'}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewFund(selectedCashFlow.fundId!)}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              {selectedCashFlow.roundId && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Round</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-base">{round || 'Unknown Round'}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewRound(selectedCashFlow.roundId!)}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {selectedCashFlow.transactionReference && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Transaction Reference</h4>
                  <p className="text-sm font-mono">{selectedCashFlow.transactionReference}</p>
                </div>
              )}

              {selectedCashFlow.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                  <p className="text-base">{selectedCashFlow.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Metadata</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {formatDateTime(selectedCashFlow.createdAt)}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {formatDateTime(selectedCashFlow.updatedAt)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
