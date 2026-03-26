"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCustomerMetrics } from "@/modules/assetmanager/hooks/use-customer-metrics";
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
import { type FinancialScenario } from "@/modules/assetmanager/schemas/customer-metrics.schemas";

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

export default function CustomerMetricsDetail({ id }: { id: number }) {
  const router = useRouter();
  const { getCompanyName } = useCompanies();
  const {
    selectedCustomerMetric,
    fetchCustomerMetric,
    isLoading,
    error,
    clearError,
    formatCurrency,
    formatPercentage,
    formatRatio,
  } = useCustomerMetrics();

  // Fetch the customer metric on mount or id change
  useEffect(() => {
    fetchCustomerMetric(id);
  }, [fetchCustomerMetric, id]);

  // Delete dialog state
  const [showDelete, setShowDelete] = React.useState(false);

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Metrics</CardTitle>
          <CardDescription>Loading customer metrics...</CardDescription>
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
          <CardTitle>Customer Metrics</CardTitle>
          <CardDescription>Error loading customer metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">{error}</div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  // Not found state
  if (!selectedCustomerMetric) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Metrics</CardTitle>
          <CardDescription>Not found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No customer metrics found for this ID.</div>
        </CardContent>
      </Card>
    );
  }

  // Helper to display period
  const s = selectedCustomerMetric;
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
    // await deleteCustomerMetric(s.id!);
    setShowDelete(false);
    router.push('/dashboard/customer-metrics');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Customer Metrics</CardTitle>
          <CardDescription>
            {getCompanyName(s.companyId)} | Period: {period} | {getScenarioBadge(s.scenario)}
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => router.push(`/dashboard/customer-metrics/${s.id}/edit`)}>
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
                      <AlertDialogTitle>Delete Customer Metrics</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this customer metrics record? This action cannot be undone.
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

        {/* Customer Counts Section */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Counts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Total Customers" 
                value={s.totalCustomers} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="New Customers" 
                value={s.newCustomers} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="Churned Customers" 
                value={s.churnedCustomers} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="Customer Growth Rate" 
                value={s.customerGrowthRate} 
                formatter={(value) => formatPercentage(value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* User Metrics Section */}
        <Card>
          <CardHeader>
            <CardTitle>User Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Total Users" 
                value={s.totalUsers} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="Active Users" 
                value={s.activeUsers} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="Total Monthly Active Client Users" 
                value={s.totalMonthlyActiveClientUsers} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="User Growth Rate" 
                value={s.userGrowthRate} 
                formatter={(value) => formatPercentage(value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* User Breakdown Section */}
        <Card>
          <CardHeader>
            <CardTitle>User Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Existing Customer Existing Seats Users" 
                value={s.existingCustomerExistingSeatsUsers} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="Existing Customer Additional Seats Users" 
                value={s.existingCustomerAdditionalSeatsUsers} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="New Customer New Seats Users" 
                value={s.newCustomerNewSeatsUsers} 
                formatter={(value) => Number(value).toLocaleString()}
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer Segments Section */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Existing Customer Count" 
                value={s.existingCustomerCount} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="Existing Customer Expansion Count" 
                value={s.existingCustomerExpansionCount} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="New Customer Count" 
                value={s.newCustomerCount} 
                formatter={(value) => Number(value).toLocaleString()}
              />
            </div>
          </CardContent>
        </Card>

        {/* Addressable Market Section */}
        <Card>
          <CardHeader>
            <CardTitle>Addressable Market</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="New Customer Total Addressable Seats" 
                value={s.newCustomerTotalAddressableSeats} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="New Customer New Seats Percent Signed" 
                value={s.newCustomerNewSeatsPercentSigned} 
                formatter={(value) => formatPercentage(value)}
              />
              <DynamicField 
                label="New Customer Total Addressable Seats Remaining" 
                value={s.newCustomerTotalAddressableSeatsRemaining} 
                formatter={(value) => Number(value).toLocaleString()}
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer Acquisition Section */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Acquisition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Customer Acquisition Cost (CAC)" 
                value={s.cac} 
                formatter={(value) => formatCurrency(value)}
              />
              <DynamicField 
                label="Lifetime Value (LTV)" 
                value={s.ltv} 
                formatter={(value) => formatCurrency(value)}
              />
              <DynamicField 
                label="LTV/CAC Ratio" 
                value={s.ltvCacRatio} 
                formatter={(value) => formatRatio(value)}
              />
              <DynamicField 
                label="Payback Period" 
                value={s.paybackPeriod} 
                formatter={(value) => `${Number(value).toFixed(1)} months`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Retention & Efficiency Section */}
        <Card>
          <CardHeader>
            <CardTitle>Retention & Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Customer Churn Rate" 
                value={s.customerChurnRate} 
                formatter={(value) => formatPercentage(value)}
              />
              <DynamicField 
                label="Customer Acquisition Efficiency" 
                value={s.customerAcquisitionEfficiency} 
                formatter={(value) => formatRatio(value)}
              />
              <DynamicField 
                label="Sales Efficiency" 
                value={s.salesEfficiency} 
                formatter={(value) => formatRatio(value)}
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