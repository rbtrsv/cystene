"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFinancialRatios } from "@/modules/assetmanager/hooks/use-financial-ratios";
import { useCompanies } from "@/modules/assetmanager/hooks/use-companies";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/modules/shadcnui/components/ui/card";
import { Button } from "@/modules/shadcnui/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/modules/shadcnui/components/ui/alert-dialog";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/modules/shadcnui/components/ui/tooltip";
import { Badge } from "@/modules/shadcnui/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { type FinancialScenario } from "@/modules/assetmanager/schemas/financial-ratios.schemas";

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
    });
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <p className="text-base">{formatDateField(value)}</p>
    </div>
  );
}

export default function FinancialRatiosDetail({ id }: { id: number }) {
  const router = useRouter();
  const { getCompanyName } = useCompanies();
  const {
    selectedFinancialRatio,
    fetchFinancialRatio,
    isLoading,
    error,
    clearError,
    formatRatio,
    formatPercentage,
  } = useFinancialRatios();

  // Fetch the financial ratio on mount or id change
  useEffect(() => {
    fetchFinancialRatio(id);
  }, [fetchFinancialRatio, id]);

  // Delete dialog state
  const [showDelete, setShowDelete] = React.useState(false);

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Ratios</CardTitle>
          <CardDescription>Loading financial ratios...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Ratios</CardTitle>
          <CardDescription>Error loading financial ratios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">{error}</div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  // Not found state
  if (!selectedFinancialRatio) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Ratios</CardTitle>
          <CardDescription>Not found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No financial ratios found for this ID.</div>
        </CardContent>
      </Card>
    );
  }

  // Helper to display period
  const s = selectedFinancialRatio;
  let period = "";
  if (s.quarter) period = `Q${s.quarter} ${s.year}`;
  else if (s.semester) period = `${s.semester} ${s.year}`;
  else if (s.month) period = `${s.month} ${s.year}`;
  else if (s.fullYear) period = `${s.year} (Full Year)`;
  else period = s.year?.toString() || "";

  const getScenarioBadge = (scenario: FinancialScenario) => {
    const colorMap: Record<FinancialScenario, string> = {
      'Actual': 'bg-green-500',
      'Forecast': 'bg-blue-500',
      'Budget': 'bg-orange-500',
    };
    
    return (
      <Badge className={`${colorMap[scenario] || 'bg-gray-500'}`}>
        {scenario}
      </Badge>
    );
  };

  // Delete handler
  const handleDelete = async () => {
    // Note: Delete functionality needs to be added to the hook
    // await deleteFinancialRatio(s.id!);
    setShowDelete(false);
    router.push('/dashboard/financial-ratios');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Financial Ratios</CardTitle>
          <CardDescription>
            {getCompanyName(s.companyId)} | Period: {period} | {getScenarioBadge(s.scenario)}
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => router.push(`/dashboard/financial-ratios/${s.id}/edit`)}>
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
                <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Financial Ratios</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this financial ratios record? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
        {/* Period Information */}
        <Card>
          <CardHeader>
            <CardTitle>Period Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DynamicField 
              label="Quarter" 
              value={s.quarter} 
              condition={!!s.quarter}
            />
            <DynamicField 
              label="Semester" 
              value={s.semester} 
              condition={!!s.semester}
            />
            <DynamicField 
              label="Month" 
              value={s.month} 
              condition={!!s.month}
            />
            <DynamicField 
              label="Full Year" 
              value={s.fullYear ? "Yes" : "No"} 
              condition={s.fullYear !== null}
            />
            <DateField 
              label="Date" 
              value={s.date} 
              condition={!!s.date}
            />
            </div>
          </CardContent>
        </Card>

        {/* Liquidity Ratios Section */}
        <Card>
          <CardHeader>
            <CardTitle>Liquidity Ratios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Current Ratio" 
                value={s.currentRatio} 
                formatter={(value) => formatRatio(value)}
              />
              <DynamicField 
                label="Quick Ratio" 
                value={s.quickRatio} 
                formatter={(value) => formatRatio(value)}
              />
              <DynamicField 
                label="Cash Ratio" 
                value={s.cashRatio} 
                formatter={(value) => formatRatio(value)}
              />
              <DynamicField 
                label="Operating Cash Flow Ratio" 
                value={s.operatingCashFlowRatio} 
                formatter={(value) => formatRatio(value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Solvency Ratios Section */}
        <Card>
          <CardHeader>
            <CardTitle>Solvency Ratios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Debt-to-Equity Ratio" 
                value={s.debtToEquityRatio} 
                formatter={(value) => formatRatio(value)}
              />
              <DynamicField 
                label="Debt-to-Assets Ratio" 
                value={s.debtToAssetsRatio} 
                formatter={(value) => formatRatio(value)}
              />
              <DynamicField 
                label="Interest Coverage Ratio" 
                value={s.interestCoverageRatio} 
                formatter={(value) => formatRatio(value)}
              />
              <DynamicField 
                label="Debt Service Coverage Ratio" 
                value={s.debtServiceCoverageRatio} 
                formatter={(value) => formatRatio(value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Profitability Ratios Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profitability Ratios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Gross Profit Margin" 
                value={s.grossProfitMargin} 
                formatter={(value) => formatPercentage(value)}
              />
              <DynamicField 
                label="Operating Profit Margin" 
                value={s.operatingProfitMargin} 
                formatter={(value) => formatPercentage(value)}
              />
              <DynamicField 
                label="Net Profit Margin" 
                value={s.netProfitMargin} 
                formatter={(value) => formatPercentage(value)}
              />
              <DynamicField 
                label="EBITDA Margin" 
                value={s.ebitdaMargin} 
                formatter={(value) => formatPercentage(value)}
              />
              <DynamicField 
                label="Return on Assets (ROA)" 
                value={s.returnOnAssets} 
                formatter={(value) => formatPercentage(value)}
              />
              <DynamicField 
                label="Return on Equity (ROE)" 
                value={s.returnOnEquity} 
                formatter={(value) => formatPercentage(value)}
              />
              <DynamicField 
                label="Return on Invested Capital (ROIC)" 
                value={s.returnOnInvestedCapital} 
                formatter={(value) => formatPercentage(value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Efficiency Ratios Section */}
        <Card>
          <CardHeader>
            <CardTitle>Efficiency Ratios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Asset Turnover Ratio" 
                value={s.assetTurnoverRatio} 
                formatter={(value) => formatRatio(value)}
              />
              <DynamicField 
                label="Inventory Turnover Ratio" 
                value={s.inventoryTurnoverRatio} 
                formatter={(value) => formatRatio(value)}
              />
              <DynamicField 
                label="Receivables Turnover Ratio" 
                value={s.receivablesTurnoverRatio} 
                formatter={(value) => formatRatio(value)}
              />
              <DynamicField 
                label="Days Sales Outstanding" 
                value={s.daysSalesOutstanding} 
                formatter={(value) => `${Number(value).toFixed(1)} days`}
              />
              <DynamicField 
                label="Days Inventory Outstanding" 
                value={s.daysInventoryOutstanding} 
                formatter={(value) => `${Number(value).toFixed(1)} days`}
              />
              <DynamicField 
                label="Days Payables Outstanding" 
                value={s.daysPayablesOutstanding} 
                formatter={(value) => `${Number(value).toFixed(1)} days`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Investment Ratios Section */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Ratios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Earnings Per Share" 
                value={s.earningsPerShare} 
                formatter={(value) => `$${Number(value).toFixed(4)}`}
              />
              <DynamicField 
                label="Price-to-Earnings Ratio" 
                value={s.priceEarningsRatio} 
                formatter={(value) => formatRatio(value)}
              />
              <DynamicField 
                label="Dividend Yield" 
                value={s.dividendYield} 
                formatter={(value) => formatPercentage(value)}
              />
              <DynamicField 
                label="Dividend Payout Ratio" 
                value={s.dividendPayoutRatio} 
                formatter={(value) => formatPercentage(value)}
              />
              <DynamicField 
                label="Book Value Per Share" 
                value={s.bookValuePerShare} 
                formatter={(value) => `$${Number(value).toFixed(2)}`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <DynamicField 
              label="Additional Notes" 
              value={s.notes} 
              condition={!!s.notes}
            />
            {!s.notes && (
              <div className="text-muted-foreground">No notes available</div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}