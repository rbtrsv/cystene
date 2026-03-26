"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOperationalMetrics } from "@/modules/assetmanager/hooks/use-operational-metrics";
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
import { type FinancialScenario } from "@/modules/assetmanager/schemas/operational-metrics.schemas";

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

export default function OperationalMetricsDetail({ id }: { id: number }) {
  const router = useRouter();
  const { getCompanyName } = useCompanies();
  const {
    selectedOperationalMetric,
    fetchOperationalMetric,
    isLoading,
    error,
    clearError,
  } = useOperationalMetrics();

  // Fetch the operational metric on mount or id change
  useEffect(() => {
    fetchOperationalMetric(id);
  }, [fetchOperationalMetric, id]);

  // Delete dialog state
  const [showDelete, setShowDelete] = React.useState(false);

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Operational Metrics</CardTitle>
          <CardDescription>Loading operational metrics...</CardDescription>
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
          <CardTitle>Operational Metrics</CardTitle>
          <CardDescription>Error loading operational metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">{error}</div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  // Not found state
  if (!selectedOperationalMetric) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Operational Metrics</CardTitle>
          <CardDescription>Not found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No operational metrics found for this ID.</div>
        </CardContent>
      </Card>
    );
  }

  // Helper to display period
  const s = selectedOperationalMetric;
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
    // await deleteOperationalMetric(s.id!);
    setShowDelete(false);
    router.push('/dashboard/operational-metrics');
  };

  // Format percentage helper
  const formatPercentage = (value: number | null): string => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(1)}%`;
  };

  // Format ratio helper
  const formatRatio = (value: number | null): string => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(2);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Operational Metrics</CardTitle>
          <CardDescription>
            {getCompanyName(s.companyId)} | Period: {period} | {getScenarioBadge(s.scenario)}
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => router.push(`/dashboard/operational-metrics/${s.id}/edit`)}>
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
                      <AlertDialogTitle>Delete Operational Metrics</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this operational metrics record? This action cannot be undone.
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

        {/* Cash Metrics Section */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Burn Rate" 
                value={s.burnRate} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Runway (Months)" 
                value={s.runwayMonths} 
                formatter={(value) => `${Number(value).toFixed(1)} months`}
              />
              <DynamicField 
                label="Runway Gross" 
                value={s.runwayGross} 
                formatter={(value) => `${Number(value).toFixed(1)} months`}
              />
              <DynamicField 
                label="Runway Net" 
                value={s.runwayNet} 
                formatter={(value) => `${Number(value).toFixed(1)} months`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Efficiency Metrics Section */}
        <Card>
          <CardHeader>
            <CardTitle>Efficiency Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Burn Multiple" 
                value={s.burnMultiple} 
                formatter={(value) => formatRatio(value)}
              />
              <DynamicField 
                label="Rule of 40" 
                value={s.ruleOf40} 
                formatter={(value) => formatPercentage(value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Unit Economics Section */}
        <Card>
          <CardHeader>
            <CardTitle>Unit Economics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Gross Margin" 
                value={s.grossMargin} 
                formatter={(value) => formatPercentage(value)}
              />
              <DynamicField 
                label="Contribution Margin" 
                value={s.contributionMargin} 
                formatter={(value) => formatPercentage(value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Productivity Metrics Section */}
        <Card>
          <CardHeader>
            <CardTitle>Productivity Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Revenue Per Employee" 
                value={s.revenuePerEmployee} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Profit Per Employee" 
                value={s.profitPerEmployee} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Investment Metrics Section */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Capital Efficiency" 
                value={s.capitalEfficiency} 
                formatter={(value) => formatRatio(value)}
              />
              <DynamicField 
                label="Cash Conversion Cycle" 
                value={s.cashConversionCycle} 
                formatter={(value) => `${Number(value).toFixed(1)} days`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Capex / Operating Metrics Section */}
        <Card>
          <CardHeader>
            <CardTitle>Capex / Operating Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Capital Expenditures (Capex)" 
                value={s.capex} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="EBITDA" 
                value={s.ebitda} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField 
                label="Total Costs" 
                value={s.totalCosts} 
                formatter={(value) => formatCurrency(value, 'USD')}
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