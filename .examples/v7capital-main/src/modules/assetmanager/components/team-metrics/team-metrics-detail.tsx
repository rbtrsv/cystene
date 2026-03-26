"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTeamMetrics } from "@/modules/assetmanager/hooks/use-team-metrics";
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
import { type FinancialScenario } from "@/modules/assetmanager/schemas/team-metrics.schemas";

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

export default function TeamMetricsDetail({ id }: { id: number }) {
  const router = useRouter();
  const { getCompanyName } = useCompanies();
  const {
    selectedTeamMetric,
    fetchTeamMetric,
    isLoading,
    error,
    clearError,
  } = useTeamMetrics();

  // Fetch the team metric on mount or id change
  useEffect(() => {
    fetchTeamMetric(id);
  }, [fetchTeamMetric, id]);

  // Delete dialog state
  const [showDelete, setShowDelete] = React.useState(false);

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Metrics</CardTitle>
          <CardDescription>Loading team metrics...</CardDescription>
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
          <CardTitle>Team Metrics</CardTitle>
          <CardDescription>Error loading team metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">{error}</div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  // Not found state
  if (!selectedTeamMetric) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Metrics</CardTitle>
          <CardDescription>Not found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No team metrics found for this ID.</div>
        </CardContent>
      </Card>
    );
  }

  // Helper to display period
  const s = selectedTeamMetric;
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
    // await deleteTeamMetric(s.id!);
    setShowDelete(false);
    router.push('/dashboard/team-metrics');
  };

  // Format percentage helper
  const formatPercentage = (value: number | null): string => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Team Metrics</CardTitle>
          <CardDescription>
            {getCompanyName(s.companyId)} | Period: {period} | {getScenarioBadge(s.scenario)}
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => router.push(`/dashboard/team-metrics/${s.id}/edit`)}>
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
                      <AlertDialogTitle>Delete Team Metrics</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this team metrics record? This action cannot be undone.
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

        {/* Headcount Section */}
        <Card>
          <CardHeader>
            <CardTitle>Headcount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Total Employees" 
                value={s.totalEmployees} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="Full-Time Employees" 
                value={s.fullTimeEmployees} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="Part-Time Employees" 
                value={s.partTimeEmployees} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="Contractors" 
                value={s.contractors} 
                formatter={(value) => Number(value).toLocaleString()}
              />
            </div>
          </CardContent>
        </Card>

        {/* Department Breakdown Section */}
        <Card>
          <CardHeader>
            <CardTitle>Department Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Management" 
                value={s.numberOfManagement} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="Sales & Marketing Staff" 
                value={s.numberOfSalesMarketingStaff} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="Research & Development Staff" 
                value={s.numberOfResearchDevelopmentStaff} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="Customer Service & Support Staff" 
                value={s.numberOfCustomerServiceSupportStaff} 
                formatter={(value) => Number(value).toLocaleString()}
              />
              <DynamicField 
                label="General Staff" 
                value={s.numberOfGeneralStaff} 
                formatter={(value) => Number(value).toLocaleString()}
              />
            </div>
          </CardContent>
        </Card>

        {/* Growth and Efficiency Section */}
        <Card>
          <CardHeader>
            <CardTitle>Growth and Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Employee Growth Rate" 
                value={s.employeeGrowthRate} 
                formatter={(value) => formatPercentage(value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Retention and Satisfaction Section */}
        <Card>
          <CardHeader>
            <CardTitle>Retention and Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Employee Turnover Rate" 
                value={s.employeeTurnoverRate} 
                formatter={(value) => formatPercentage(value)}
              />
              <DynamicField 
                label="Average Tenure" 
                value={s.averageTenureMonths} 
                formatter={(value) => `${Number(value).toFixed(1)} months`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Staff Costs Section */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField
                label="Management Costs"
                value={s.managementCosts}
                formatter={(value) => formatCurrency(value, 'EUR')}
              />
              <DynamicField
                label="Sales & Marketing Staff Costs"
                value={s.salesMarketingStaffCosts}
                formatter={(value) => formatCurrency(value, 'EUR')}
              />
              <DynamicField
                label="Research & Development Staff Costs"
                value={s.researchDevelopmentStaffCosts}
                formatter={(value) => formatCurrency(value, 'EUR')}
              />
              <DynamicField
                label="Customer Service & Support Staff Costs"
                value={s.customerServiceSupportStaffCosts}
                formatter={(value) => formatCurrency(value, 'EUR')}
              />
              <DynamicField
                label="General Staff Costs"
                value={s.generalStaffCosts}
                formatter={(value) => formatCurrency(value, 'EUR')}
              />
              <DynamicField
                label="Total Staff Costs"
                value={s.staffCostsTotal}
                formatter={(value) => formatCurrency(value, 'EUR')}
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