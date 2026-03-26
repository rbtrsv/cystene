"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIncomeStatements } from "@/modules/assetmanager/hooks/use-income-statements";
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
import { type FinancialScenario } from "@/modules/assetmanager/schemas/income-statements.schemas";

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

export default function IncomeStatementDetail({ id }: { id: number }) {
  const router = useRouter();
  const { getCompanyName } = useCompanies();
  const {
    selectedIncomeStatement,
    fetchIncomeStatement,
    isLoading,
    error,
    clearError,
  } = useIncomeStatements();

  // Fetch the income statement on mount or id change
  useEffect(() => {
    fetchIncomeStatement(id);
  }, [fetchIncomeStatement, id]);

  // Delete dialog state
  const [showDelete, setShowDelete] = React.useState(false);

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income Statement</CardTitle>
          <CardDescription>Loading income statement...</CardDescription>
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
          <CardTitle>Income Statement</CardTitle>
          <CardDescription>Error loading income statement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">{error}</div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  // Not found state
  if (!selectedIncomeStatement) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income Statement</CardTitle>
          <CardDescription>Not found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No income statement found for this ID.</div>
        </CardContent>
      </Card>
    );
  }

  // Helper to display period
  const s = selectedIncomeStatement;
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
    // await deleteIncomeStatement(s.id!);
    setShowDelete(false);
    router.push('/dashboard/income-statements');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Income Statement</CardTitle>
          <CardDescription>
            {getCompanyName(s.companyId)} | Period: {period} | {getScenarioBadge(s.scenario)}
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => router.push(`/dashboard/income-statements/${s.id}/edit`)}>
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
                      <AlertDialogTitle>Delete Income Statement</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this income statement? This action cannot be undone.
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

        {/* Revenue Section */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Revenue" 
                value={s.revenue} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Cost of Goods" 
                value={s.costOfGoods} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Gross Profit" 
                value={s.grossProfit} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Operating Expenses Section */}
        <Card>
          <CardHeader>
            <CardTitle>Operating Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Research & Development" 
                value={s.researchAndDevelopment} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Selling, General & Administrative" 
                value={s.sellingGeneralAndAdministrative} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Other Operating Expenses" 
                value={s.otherOperatingExpenses} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Operating Income" 
                value={s.operatingIncome} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Non-Operating Items */}
        <Card>
          <CardHeader>
            <CardTitle>Non-Operating Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Non-Operating Interest Income" 
                value={s.nonOperatingInterestIncome} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Non-Operating Interest Expense" 
                value={s.nonOperatingInterestExpense} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Other Income/Expense" 
                value={s.otherIncomeExpense} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Final Results */}
        <Card>
          <CardHeader>
            <CardTitle>Final Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Pretax Income" 
                value={s.pretaxIncome} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Income Tax" 
                value={s.incomeTax} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Net Income" 
                value={s.netIncome} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Net Income (Continuous Operations)" 
                value={s.netIncomeContinuousOperations} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="EBITDA" 
                value={s.ebitda} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Per Share Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Per Share Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="EPS (Basic)" 
                value={s.epsBasic} 
                formatter={(value) => `$${Number(value).toFixed(2)}`}
              />
              <DynamicField 
                label="EPS (Diluted)" 
                value={s.epsDiluted} 
                formatter={(value) => `$${Number(value).toFixed(2)}`}
              />
              <DynamicField 
                label="Basic Shares Outstanding" 
                value={s.basicSharesOutstanding} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="Diluted Shares Outstanding" 
                value={s.dilutedSharesOutstanding} 
                formatter={(value) => Number(value).toLocaleString()}
              />
            </div>
          </CardContent>
        </Card>

        {/* Other Items */}
        <Card>
          <CardHeader>
            <CardTitle>Other Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Minority Interests" 
                value={s.minorityInterests} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Preferred Stock Dividends" 
                value={s.preferredStockDividends} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}