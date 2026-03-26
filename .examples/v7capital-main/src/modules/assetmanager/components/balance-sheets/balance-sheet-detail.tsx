'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBalanceSheets } from '@/modules/assetmanager/hooks/use-balance-sheets';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
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
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/modules/shadcnui/components/ui/tooltip';
import { Pencil, Trash2 } from 'lucide-react';

interface BalanceSheetDetailProps {
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

export default function BalanceSheetDetail({ id }: BalanceSheetDetailProps) {
  const router = useRouter();
  const { 
    balanceSheets,
    selectedBalanceSheet, 
    isLoading, 
    error, 
    fetchBalanceSheet, 
    deleteBalanceSheet,
    clearError,
    formatCurrency 
  } = useBalanceSheets();

  const { companies } = useCompanies();

  useEffect(() => {
    if (id) {
      fetchBalanceSheet(id);
    }
  }, [id, fetchBalanceSheet]);

  const balanceSheet = selectedBalanceSheet || balanceSheets.find(s => s.id === id);
  const company = companies.find(c => c.id === balanceSheet?.companyId);

  const handleEdit = () => {
    router.push(`/dashboard/balance-sheets/${id}/edit`);
  };

  const handleDelete = async () => {
    const success = await deleteBalanceSheet(id);
    if (success) {
      router.push('/dashboard/balance-sheets');
    }
  };


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance Sheet Details</CardTitle>
          <CardDescription>Loading balance sheet information...</CardDescription>
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
          <CardTitle>Balance Sheet Details</CardTitle>
          <CardDescription>Error loading balance sheet</CardDescription>
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

  if (!balanceSheet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance Sheet</CardTitle>
          <CardDescription>Not found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No balance sheet found for this ID.</div>
        </CardContent>
      </Card>
    );
  }

  const s = balanceSheet;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            Balance Sheet - {company?.name || 'Unknown Company'}
            <Badge variant="outline">{s.scenario}</Badge>
          </CardTitle>
          <CardDescription>
            Year {s.year} • {s.quarter && `Q${s.quarter}`} {s.semester && s.semester} {s.month && s.month}
            {s.date && ` • ${new Date(s.date).toLocaleDateString()}`}
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Balance Sheet</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this balance sheet? This action cannot be undone.
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
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Assets Section */}
        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Current Assets */}
            <div className="mb-6">
              <h3 className="text-md font-medium mb-3">Current Assets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DynamicField 
                  label="Cash" 
                  value={s.cash} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Cash Equivalents" 
                  value={s.cashEquivalents} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Cash and Cash Equivalents" 
                  value={s.cashAndCashEquivalents} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Other Short-Term Investments" 
                  value={s.otherShortTermInvestments} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Accounts Receivable" 
                  value={s.accountsReceivable} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Other Receivables" 
                  value={s.otherReceivables} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Inventory" 
                  value={s.inventory} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Prepaid Assets" 
                  value={s.prepaidAssets} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Restricted Cash" 
                  value={s.restrictedCash} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Assets Held for Sale" 
                  value={s.assetsHeldForSale} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Hedging Assets" 
                  value={s.hedgingAssets} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Other Current Assets" 
                  value={s.otherCurrentAssets} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
              </div>
              <div className="mt-4 pt-4 border-t">
                <DynamicField 
                  label="Total Current Assets" 
                  value={s.totalCurrentAssets} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
              </div>
            </div>

            {/* Non-Current Assets */}
            <div>
              <h3 className="text-md font-medium mb-3">Non-Current Assets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DynamicField 
                  label="Properties" 
                  value={s.properties} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Land and Improvements" 
                  value={s.landAndImprovements} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Machinery, Furniture & Equipment" 
                  value={s.machineryFurnitureEquipment} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Construction in Progress" 
                  value={s.constructionInProgress} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Leases" 
                  value={s.leases} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Accumulated Depreciation" 
                  value={s.accumulatedDepreciation} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Goodwill" 
                  value={s.goodwill} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Investment Properties" 
                  value={s.investmentProperties} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Financial Assets" 
                  value={s.financialAssets} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Intangible Assets" 
                  value={s.intangibleAssets} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Investments and Advances" 
                  value={s.investmentsAndAdvances} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Other Non-Current Assets" 
                  value={s.otherNonCurrentAssets} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
              </div>
              <div className="mt-4 pt-4 border-t">
                <DynamicField 
                  label="Total Non-Current Assets" 
                  value={s.totalNonCurrentAssets} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-primary/20">
              <DynamicField 
                label="Total Assets" 
                value={s.totalAssets} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Liabilities Section */}
        <Card>
          <CardHeader>
            <CardTitle>Liabilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Current Liabilities */}
            <div className="mb-6">
              <h3 className="text-md font-medium mb-3">Current Liabilities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DynamicField 
                  label="Accounts Payable" 
                  value={s.accountsPayable} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Accrued Expenses" 
                  value={s.accruedExpenses} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Short-Term Debt" 
                  value={s.shortTermDebt} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Deferred Revenue" 
                  value={s.deferredRevenue} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Tax Payable" 
                  value={s.taxPayable} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Pensions" 
                  value={s.pensions} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Other Current Liabilities" 
                  value={s.otherCurrentLiabilities} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
              </div>
              <div className="mt-4 pt-4 border-t">
                <DynamicField 
                  label="Total Current Liabilities" 
                  value={s.totalCurrentLiabilities} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
              </div>
            </div>

            {/* Non-Current Liabilities */}
            <div>
              <h3 className="text-md font-medium mb-3">Non-Current Liabilities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DynamicField 
                  label="Long-Term Provisions" 
                  value={s.longTermProvisions} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Long-Term Debt" 
                  value={s.longTermDebt} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Provision for Risks and Charges" 
                  value={s.provisionForRisksAndCharges} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Deferred Liabilities" 
                  value={s.deferredLiabilities} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Derivative Product Liabilities" 
                  value={s.derivativeProductLiabilities} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
                <DynamicField 
                  label="Other Non-Current Liabilities" 
                  value={s.otherNonCurrentLiabilities} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
              </div>
              <div className="mt-4 pt-4 border-t">
                <DynamicField 
                  label="Total Non-Current Liabilities" 
                  value={s.totalNonCurrentLiabilities} 
                  formatter={(value) => formatCurrency(value, 'USD')}
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-primary/20">
              <DynamicField 
                label="Total Liabilities" 
                value={s.totalLiabilities} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Equity Section */}
        <Card>
          <CardHeader>
            <CardTitle>Shareholders&apos; Equity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Common Stock" 
                value={s.commonStock} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Retained Earnings" 
                value={s.retainedEarnings} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Other Stakeholders Equity" 
                value={s.otherStakeholdersEquity} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Additional Paid-In Capital" 
                value={s.additionalPaidInCapital} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Treasury Stock" 
                value={s.treasuryStock} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Minority Interest" 
                value={s.minorityInterest} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
            <div className="mt-6 pt-4 border-t-2 border-primary/20">
              <DynamicField 
                label="Total Stakeholders Equity" 
                value={s.totalStakeholdersEquity} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}