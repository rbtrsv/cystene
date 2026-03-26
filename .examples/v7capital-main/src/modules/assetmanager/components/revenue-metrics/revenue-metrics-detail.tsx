"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRevenueMetrics } from "@/modules/assetmanager/hooks/use-revenue-metrics";
import { useCompanies } from "@/modules/assetmanager/hooks/use-companies";
import { formatCurrency } from "@/modules/assetmanager/utils/currency.utils";
import {
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
import { type FinancialScenario } from "@/modules/assetmanager/schemas/revenue-metrics.schemas";

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

export default function RevenueMetricsDetail({ id }: { id: number }) {
  const router = useRouter();
  const { getCompanyName } = useCompanies();
  const {
    selectedRevenueMetric,
    fetchRevenueMetric,
    isLoading,
    error,
    clearError,
  } = useRevenueMetrics();

  // Fetch the revenue metric on mount or id change
  useEffect(() => {
    fetchRevenueMetric(id);
  }, [fetchRevenueMetric, id]);

  // Delete dialog state
  const [showDelete, setShowDelete] = React.useState(false);

  // Loading state
  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>Revenue Metrics</CardTitle>
          <CardDescription>Loading revenue metrics...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <CardHeader>
          <CardTitle>Revenue Metrics</CardTitle>
          <CardDescription>Error loading revenue metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">{error}</div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </>
    );
  }

  // Not found state
  if (!selectedRevenueMetric) {
    return (
      <>
        <CardHeader>
          <CardTitle>Revenue Metrics</CardTitle>
          <CardDescription>Not found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No revenue metrics found for this ID.</div>
        </CardContent>
      </>
    );
  }

  // Helper to display period
  const s = selectedRevenueMetric;
  let period = "";
  if (s.quarter) period = `Q${s.quarter} ${s.year}`;
  else if (s.semester) period = `${s.semester} ${s.year}`;
  else if (s.month) period = `${s.month} ${s.year}`;
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
    // await deleteRevenueMetric(s.id!);
    setShowDelete(false);
    router.push('/dashboard/revenue-metrics');
  };

  return (
    <>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Revenue Metrics</CardTitle>
          <CardDescription>
            {getCompanyName(s.companyId)} | Period: {period} | {getScenarioBadge(s.scenario)}
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => router.push(`/dashboard/revenue-metrics/${s.id}/edit`)}>
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
                      <AlertDialogTitle>Delete Revenue Metrics</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this revenue metrics record? This action cannot be undone.
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
      
      <CardContent>
        <div className="space-y-8">
          {/* Core Revenue */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-primary">Core Revenue</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField
                label="Recurring Revenue"
                value={s.recurringRevenue}
                formatter={(value) => formatCurrency(value, 'EUR')}
              />
              <DynamicField
                label="Non-Recurring Revenue"
                value={s.nonRecurringRevenue}
                formatter={(value) => formatCurrency(value, 'EUR')}
              />
              <DynamicField 
                label="Revenue Growth Rate" 
                value={s.revenueGrowthRate} 
                formatter={(value) => `${value.toFixed(1)}%`}
              />
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-primary">Revenue Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Existing Customer Existing Seats" 
                value={s.existingCustomerExistingSeatsRevenue} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Existing Customer Additional Seats" 
                value={s.existingCustomerAdditionalSeatsRevenue} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="New Customer New Seats" 
                value={s.newCustomerNewSeatsRevenue} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Discounts & Refunds" 
                value={s.discountsAndRefunds} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
          </div>

          {/* SaaS Metrics */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-primary">SaaS Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="ARR (Annual Recurring Revenue)" 
                value={s.arr} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="MRR (Monthly Recurring Revenue)" 
                value={s.mrr} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
          </div>

          {/* Customer Metrics */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-primary">Customer Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Average Revenue per Customer" 
                value={s.averageRevenuePerCustomer} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Average Contract Value" 
                value={s.averageContractValue} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
          </div>

          {/* Retention Metrics */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-primary">Retention Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Revenue Churn Rate" 
                value={s.revenueChurnRate} 
                formatter={(value) => `${value.toFixed(1)}%`}
              />
              <DynamicField 
                label="Net Revenue Retention" 
                value={s.netRevenueRetention} 
                formatter={(value) => `${value.toFixed(1)}%`}
              />
              <DynamicField 
                label="Gross Revenue Retention" 
                value={s.grossRevenueRetention} 
                formatter={(value) => `${value.toFixed(1)}%`}
              />
            </div>
          </div>

          {/* Cohort Growth Rates */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-primary">Cohort Growth Rates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DynamicField 
                label="Cohort 1 Growth Rate" 
                value={s.growthRateCohort1} 
                formatter={(value) => `${value.toFixed(1)}%`}
              />
              <DynamicField 
                label="Cohort 2 Growth Rate" 
                value={s.growthRateCohort2} 
                formatter={(value) => `${value.toFixed(1)}%`}
              />
              <DynamicField 
                label="Cohort 3 Growth Rate" 
                value={s.growthRateCohort3} 
                formatter={(value) => `${value.toFixed(1)}%`}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
}