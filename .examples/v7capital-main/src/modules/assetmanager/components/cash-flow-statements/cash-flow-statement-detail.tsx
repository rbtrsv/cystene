"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCashFlowStatements } from "@/modules/assetmanager/hooks/use-cash-flow-statements";
import { useCompanies } from "@/modules/assetmanager/hooks/use-companies";
import { formatCurrency } from "@/modules/assetmanager/utils/currency.utils";
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
import { type FinancialScenario } from "@/modules/assetmanager/schemas/cash-flow-statements.schemas";

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

export default function CashFlowStatementDetail({ id }: { id: number }) {
  const router = useRouter();
  const { getCompanyName } = useCompanies();
  const {
    selectedCashFlowStatement,
    fetchCashFlowStatement,
    isLoading,
    error,
    clearError,
  } = useCashFlowStatements();

  // Fetch the cash flow statement on mount or id change
  useEffect(() => {
    fetchCashFlowStatement(id);
  }, [fetchCashFlowStatement, id]);

  // Delete dialog state
  const [showDelete, setShowDelete] = React.useState(false);

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Statement</CardTitle>
          <CardDescription>Loading cash flow statement...</CardDescription>
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
          <CardTitle>Cash Flow Statement</CardTitle>
          <CardDescription>Error loading cash flow statement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">{error}</div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  // Not found state
  if (!selectedCashFlowStatement) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Statement</CardTitle>
          <CardDescription>Not found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No cash flow statement found for this ID.</div>
        </CardContent>
      </Card>
    );
  }

  // Helper to display period
  const s = selectedCashFlowStatement;
  let period = "";
  if (s.quarter) period = `Q${s.quarter} ${s.year}`;
  else if (s.semester) period = `${s.semester} ${s.year}`;
  else if (s.month) period = `${s.month} ${s.year}`;
  else if (s.periodStart && s.periodEnd) period = `${s.periodStart} - ${s.periodEnd}`;
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
    // await deleteCashFlowStatement(s.id!);
    setShowDelete(false);
    router.push('/dashboard/cash-flow-statements');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Cash Flow Statement</CardTitle>
          <CardDescription>
            {getCompanyName(s.companyId)} | Period: {period} | {getScenarioBadge(s.scenario)}
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => router.push(`/dashboard/cash-flow-statements/${s.id}/edit`)}>
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
                      <AlertDialogTitle>Delete Cash Flow Statement</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this cash flow statement? This action cannot be undone.
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
            <DateField 
              label="Period Start" 
              value={s.periodStart} 
              condition={!!s.periodStart}
            />
            <DateField 
              label="Period End" 
              value={s.periodEnd} 
              condition={!!s.periodEnd}
            />
            </div>
          </CardContent>
        </Card>

        {/* Operating Activities Section */}
        <Card>
          <CardHeader>
            <CardTitle>Operating Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Net Income" 
                value={s.netIncome} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Depreciation" 
                value={s.depreciation} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Stock-Based Compensation" 
                value={s.stockBasedCompensation} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Deferred Taxes" 
                value={s.deferredTaxes} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Other Assets & Liabilities" 
                value={s.otherAssetsLiabilities} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Operating Cash Flow" 
                value={s.operatingCashFlow} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Investing Activities Section */}
        <Card>
          <CardHeader>
            <CardTitle>Investing Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Capital Expenditures" 
                value={s.capitalExpenditures} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Net Acquisitions" 
                value={s.netAcquisitions} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Purchase of Investments" 
                value={s.purchaseOfInvestments} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Sale of Investments" 
                value={s.saleOfInvestments} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Other Investing Activity" 
                value={s.otherInvestingActivity} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Investing Cash Flow" 
                value={s.investingCashFlow} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financing Activities Section */}
        <Card>
          <CardHeader>
            <CardTitle>Financing Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Long-Term Debt Issuance" 
                value={s.longTermDebtIssuance} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Long-Term Debt Payments" 
                value={s.longTermDebtPayments} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Common Stock Issuance" 
                value={s.commonStockIssuance} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Common Stock Repurchase" 
                value={s.commonStockRepurchase} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Common Dividends" 
                value={s.commonDividends} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Other Financing Charges" 
                value={s.otherFinancingCharges} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Financing Cash Flow" 
                value={s.financingCashFlow} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary Section */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="End Cash Position" 
                value={s.endCashPosition} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Income Tax Paid" 
                value={s.incomeTaxPaid} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Interest Paid" 
                value={s.interestPaid} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Free Cash Flow" 
                value={s.freeCashFlow} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Supplemental Information */}
        <Card>
          <CardHeader>
            <CardTitle>Supplemental Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Interest Paid" 
                value={s.interestPaid} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Income Tax Paid" 
                value={s.incomeTaxPaid} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}