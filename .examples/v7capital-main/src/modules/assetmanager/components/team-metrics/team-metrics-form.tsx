'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useTeamMetrics } from '@/modules/assetmanager/hooks/use-team-metrics';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
import { CreateTeamMetricsSchema, UpdateTeamMetricsSchema, type TeamMetrics, type FinancialScenario, type Quarter, type Semester, type Month } from '@/modules/assetmanager/schemas/team-metrics.schemas';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter,
  CardHeader, 
  CardTitle 
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/modules/shadcnui/components/ui/select';
import { Save } from 'lucide-react';

interface TeamMetricsFormProps {
  id?: number;
  initialData?: TeamMetrics;
}

// Standard FieldInfo component for displaying validation errors
function FieldInfo({ field }: { field: any }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <p className="text-sm text-destructive mt-1">{field.state.meta.errors.join(', ')}</p>
      ) : null}
      {field.state.meta.isValidating ? <p className="text-sm text-muted-foreground mt-1">Validating...</p> : null}
    </>
  );
}

export default function TeamMetricsForm({ id, initialData }: TeamMetricsFormProps) {
  const router = useRouter();
  const { selectedTeamMetric, addTeamMetric, editTeamMetric, fetchTeamMetric, isLoading, error, clearError } = useTeamMetrics();
  const { companies } = useCompanies();
  
  const isEditMode = !!id;
  const currentYear = new Date().getFullYear();
  
  // TanStack Form setup with schema validation
  const form = useForm({
    defaultValues: {
      companyId: initialData?.companyId || selectedTeamMetric?.companyId || undefined,
      year: initialData?.year?.toString() || currentYear.toString(),
      semester: initialData?.semester || '',
      quarter: initialData?.quarter || '',
      month: initialData?.month || '',
      scenario: initialData?.scenario || 'Actual',
      fullYear: initialData?.fullYear || false,
      date: initialData?.date || '',
      
      // Headcount fields
      totalEmployees: initialData?.totalEmployees?.toString() || '',
      fullTimeEmployees: initialData?.fullTimeEmployees?.toString() || '',
      partTimeEmployees: initialData?.partTimeEmployees?.toString() || '',
      contractors: initialData?.contractors?.toString() || '',
      
      // Department breakdown
      numberOfManagement: initialData?.numberOfManagement?.toString() || '',
      numberOfSalesMarketingStaff: initialData?.numberOfSalesMarketingStaff?.toString() || '',
      numberOfResearchDevelopmentStaff: initialData?.numberOfResearchDevelopmentStaff?.toString() || '',
      numberOfCustomerServiceSupportStaff: initialData?.numberOfCustomerServiceSupportStaff?.toString() || '',
      numberOfGeneralStaff: initialData?.numberOfGeneralStaff?.toString() || '',
      
      // Performance metrics
      employeeGrowthRate: initialData?.employeeGrowthRate?.toString() || '',
      employeeTurnoverRate: initialData?.employeeTurnoverRate?.toString() || '',
      averageTenureMonths: initialData?.averageTenureMonths?.toString() || '',
      
      // Staff costs
      managementCosts: initialData?.managementCosts?.toString() || '',
      salesMarketingStaffCosts: initialData?.salesMarketingStaffCosts?.toString() || '',
      researchDevelopmentStaffCosts: initialData?.researchDevelopmentStaffCosts?.toString() || '',
      customerServiceSupportStaffCosts: initialData?.customerServiceSupportStaffCosts?.toString() || '',
      generalStaffCosts: initialData?.generalStaffCosts?.toString() || '',
      staffCostsTotal: initialData?.staffCostsTotal?.toString() || '',
      
      notes: initialData?.notes || '',
    },
    
    // Form-level validation using full schema
    validators: {
      onChange: ({ value }) => {
        // Transform form strings to match schema expectations
        const transformedValue = {
          companyId: value.companyId,
          year: value.year ? Number(value.year) : undefined,
          semester: value.semester || undefined,
          quarter: value.quarter || undefined,
          month: value.month || undefined,
          scenario: value.scenario,
          fullYear: value.fullYear,
          date: value.date || undefined,
          
          // Headcount fields (integers)
          totalEmployees: value.totalEmployees ? Number(value.totalEmployees) : undefined,
          fullTimeEmployees: value.fullTimeEmployees ? Number(value.fullTimeEmployees) : undefined,
          partTimeEmployees: value.partTimeEmployees ? Number(value.partTimeEmployees) : undefined,
          contractors: value.contractors ? Number(value.contractors) : undefined,
          
          // Department breakdown (integers)
          numberOfManagement: value.numberOfManagement ? Number(value.numberOfManagement) : undefined,
          numberOfSalesMarketingStaff: value.numberOfSalesMarketingStaff ? Number(value.numberOfSalesMarketingStaff) : undefined,
          numberOfResearchDevelopmentStaff: value.numberOfResearchDevelopmentStaff ? Number(value.numberOfResearchDevelopmentStaff) : undefined,
          numberOfCustomerServiceSupportStaff: value.numberOfCustomerServiceSupportStaff ? Number(value.numberOfCustomerServiceSupportStaff) : undefined,
          numberOfGeneralStaff: value.numberOfGeneralStaff ? Number(value.numberOfGeneralStaff) : undefined,
          
          // Performance metrics (decimals)
          employeeGrowthRate: value.employeeGrowthRate ? Number(value.employeeGrowthRate) : undefined,
          employeeTurnoverRate: value.employeeTurnoverRate ? Number(value.employeeTurnoverRate) : undefined,
          averageTenureMonths: value.averageTenureMonths ? Number(value.averageTenureMonths) : undefined,
          
          // Staff costs (decimals)
          managementCosts: value.managementCosts ? Number(value.managementCosts) : undefined,
          salesMarketingStaffCosts: value.salesMarketingStaffCosts ? Number(value.salesMarketingStaffCosts) : undefined,
          researchDevelopmentStaffCosts: value.researchDevelopmentStaffCosts ? Number(value.researchDevelopmentStaffCosts) : undefined,
          customerServiceSupportStaffCosts: value.customerServiceSupportStaffCosts ? Number(value.customerServiceSupportStaffCosts) : undefined,
          generalStaffCosts: value.generalStaffCosts ? Number(value.generalStaffCosts) : undefined,
          staffCostsTotal: value.staffCostsTotal ? Number(value.staffCostsTotal) : undefined,
          
          notes: value.notes || undefined,
        };
        
        const schema = isEditMode ? UpdateTeamMetricsSchema : CreateTeamMetricsSchema;
        const result = schema.safeParse(transformedValue);
        
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path.length > 0) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          return fieldErrors;
        }
        
        return undefined;
      },
    },
    
    onSubmit: async ({ value }) => {
      // Transform form strings to match schema expectations
      const transformedValue = {
        companyId: value.companyId,
        year: value.year ? Number(value.year) : undefined,
        semester: value.semester || undefined,
        quarter: value.quarter || undefined,
        month: value.month || undefined,
        scenario: value.scenario as FinancialScenario,
        fullYear: value.fullYear,
        date: value.date || undefined,
        
        // Headcount fields (integers)
        totalEmployees: value.totalEmployees ? Number(value.totalEmployees) : undefined,
        fullTimeEmployees: value.fullTimeEmployees ? Number(value.fullTimeEmployees) : undefined,
        partTimeEmployees: value.partTimeEmployees ? Number(value.partTimeEmployees) : undefined,
        contractors: value.contractors ? Number(value.contractors) : undefined,
        
        // Department breakdown (integers)
        numberOfManagement: value.numberOfManagement ? Number(value.numberOfManagement) : undefined,
        numberOfSalesMarketingStaff: value.numberOfSalesMarketingStaff ? Number(value.numberOfSalesMarketingStaff) : undefined,
        numberOfResearchDevelopmentStaff: value.numberOfResearchDevelopmentStaff ? Number(value.numberOfResearchDevelopmentStaff) : undefined,
        numberOfCustomerServiceSupportStaff: value.numberOfCustomerServiceSupportStaff ? Number(value.numberOfCustomerServiceSupportStaff) : undefined,
        numberOfGeneralStaff: value.numberOfGeneralStaff ? Number(value.numberOfGeneralStaff) : undefined,
        
        // Performance metrics (decimals)
        employeeGrowthRate: value.employeeGrowthRate ? Number(value.employeeGrowthRate) : undefined,
        employeeTurnoverRate: value.employeeTurnoverRate ? Number(value.employeeTurnoverRate) : undefined,
        averageTenureMonths: value.averageTenureMonths ? Number(value.averageTenureMonths) : undefined,
        
        // Staff costs (decimals)
        managementCosts: value.managementCosts ? Number(value.managementCosts) : undefined,
        salesMarketingStaffCosts: value.salesMarketingStaffCosts ? Number(value.salesMarketingStaffCosts) : undefined,
        researchDevelopmentStaffCosts: value.researchDevelopmentStaffCosts ? Number(value.researchDevelopmentStaffCosts) : undefined,
        customerServiceSupportStaffCosts: value.customerServiceSupportStaffCosts ? Number(value.customerServiceSupportStaffCosts) : undefined,
        generalStaffCosts: value.generalStaffCosts ? Number(value.generalStaffCosts) : undefined,
        staffCostsTotal: value.staffCostsTotal ? Number(value.staffCostsTotal) : undefined,
        
        notes: value.notes || undefined,
      };
      
      const schema = isEditMode ? UpdateTeamMetricsSchema : CreateTeamMetricsSchema;
      const result = schema.parse(transformedValue);
      
      const success = isEditMode 
        ? await editTeamMetric(id!, result)
        : await addTeamMetric(result);
        
      if (success) {
        router.push(isEditMode ? `/dashboard/team-metrics/${id}` : '/dashboard/team-metrics');
      }
    },
  });
  
  useEffect(() => {
    if (isEditMode && id && !initialData) fetchTeamMetric(id);
  }, [isEditMode, id, initialData, fetchTeamMetric]);
  
  useEffect(() => {
    if (selectedTeamMetric && isEditMode) {
      form.reset({
        companyId: selectedTeamMetric.companyId,
        year: selectedTeamMetric.year?.toString() || currentYear.toString(),
        semester: selectedTeamMetric.semester || '',
        quarter: selectedTeamMetric.quarter || '',
        month: selectedTeamMetric.month || '',
        scenario: selectedTeamMetric.scenario || 'Actual',
        fullYear: selectedTeamMetric.fullYear || false,
        date: selectedTeamMetric.date || '',
        
        // Headcount fields
        totalEmployees: selectedTeamMetric.totalEmployees?.toString() || '',
        fullTimeEmployees: selectedTeamMetric.fullTimeEmployees?.toString() || '',
        partTimeEmployees: selectedTeamMetric.partTimeEmployees?.toString() || '',
        contractors: selectedTeamMetric.contractors?.toString() || '',
        
        // Department breakdown
        numberOfManagement: selectedTeamMetric.numberOfManagement?.toString() || '',
        numberOfSalesMarketingStaff: selectedTeamMetric.numberOfSalesMarketingStaff?.toString() || '',
        numberOfResearchDevelopmentStaff: selectedTeamMetric.numberOfResearchDevelopmentStaff?.toString() || '',
        numberOfCustomerServiceSupportStaff: selectedTeamMetric.numberOfCustomerServiceSupportStaff?.toString() || '',
        numberOfGeneralStaff: selectedTeamMetric.numberOfGeneralStaff?.toString() || '',
        
        // Performance metrics
        employeeGrowthRate: selectedTeamMetric.employeeGrowthRate?.toString() || '',
        employeeTurnoverRate: selectedTeamMetric.employeeTurnoverRate?.toString() || '',
        averageTenureMonths: selectedTeamMetric.averageTenureMonths?.toString() || '',
        
        // Staff costs
        managementCosts: selectedTeamMetric.managementCosts?.toString() || '',
        salesMarketingStaffCosts: selectedTeamMetric.salesMarketingStaffCosts?.toString() || '',
        researchDevelopmentStaffCosts: selectedTeamMetric.researchDevelopmentStaffCosts?.toString() || '',
        customerServiceSupportStaffCosts: selectedTeamMetric.customerServiceSupportStaffCosts?.toString() || '',
        generalStaffCosts: selectedTeamMetric.generalStaffCosts?.toString() || '',
        staffCostsTotal: selectedTeamMetric.staffCostsTotal?.toString() || '',
        
        notes: selectedTeamMetric.notes || '',
      });
    }
  }, [selectedTeamMetric, isEditMode, form, currentYear]);

  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Team Metrics' : 'Create Team Metrics'}</CardTitle>
          <CardDescription>Loading team metrics information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Team Metrics' : 'Create Team Metrics'}</CardTitle>
          <CardDescription>Error loading team metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </>
    );
  }
  
  return (
    <Card className="max-w-5xl mx-auto max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {isEditMode ? 'Edit Team Metrics' : 'Create Team Metrics'}
        </CardTitle>
        <CardDescription>
          {isEditMode ? 'Update team metrics details' : 'Add new team metrics'}
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}>
        <CardContent className="space-y-4 p-3 md:p-4">
          
          {/* Basic Information */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field
                    name="companyId"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value || value === 0) return 'Company is required';
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Company</Label>
                        <Select
                          value={field.state.value?.toString() || ''}
                          onValueChange={(value) => field.handleChange(parseInt(value, 10))}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map((company) => (
                              <SelectItem key={company.id} value={company.id!.toString()}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field
                    name="year"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value) return 'Year is required';
                        const numValue = Number(value);
                        if (isNaN(numValue)) return 'Year must be a number';
                        const currentYear = new Date().getFullYear();
                        if (numValue < 1900 || numValue > currentYear + 10) return 'Invalid year';
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Year</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="1"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Enter year"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="scenario">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Scenario</Label>
                        <Select 
                          value={field.state.value || 'Actual'} 
                          onValueChange={(value) => field.handleChange(value as FinancialScenario)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select scenario" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Actual">Actual</SelectItem>
                            <SelectItem value="Forecast">Forecast</SelectItem>
                            <SelectItem value="Budget">Budget</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="semester">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Semester (Optional)</Label>
                        <Select 
                          value={field.state.value || 'none'} 
                          onValueChange={(value) => field.handleChange(value === 'none' ? null : value)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="H1">H1 (First Half)</SelectItem>
                            <SelectItem value="H2">H2 (Second Half)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="quarter">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Quarter (Optional)</Label>
                        <Select 
                          value={field.state.value || 'none'} 
                          onValueChange={(value) => field.handleChange(value === 'none' ? null : value)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select quarter" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="Q1">Q1 (First Quarter)</SelectItem>
                            <SelectItem value="Q2">Q2 (Second Quarter)</SelectItem>
                            <SelectItem value="Q3">Q3 (Third Quarter)</SelectItem>
                            <SelectItem value="Q4">Q4 (Fourth Quarter)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="month">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Month (Optional)</Label>
                        <Select 
                          value={field.state.value || 'none'} 
                          onValueChange={(value) => field.handleChange(value === 'none' ? null : value)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="January">January</SelectItem>
                            <SelectItem value="February">February</SelectItem>
                            <SelectItem value="March">March</SelectItem>
                            <SelectItem value="April">April</SelectItem>
                            <SelectItem value="May">May</SelectItem>
                            <SelectItem value="June">June</SelectItem>
                            <SelectItem value="July">July</SelectItem>
                            <SelectItem value="August">August</SelectItem>
                            <SelectItem value="September">September</SelectItem>
                            <SelectItem value="October">October</SelectItem>
                            <SelectItem value="November">November</SelectItem>
                            <SelectItem value="December">December</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="date">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Date (Optional)</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="date"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="fullYear">
                    {(field) => (
                      <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                          id={field.name}
                          checked={field.state.value || false}
                          onCheckedChange={(checked) => field.handleChange(!!checked)}
                        />
                        <Label htmlFor={field.name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Full Year
                        </Label>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Headcount Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Headcount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="totalEmployees">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Total Employees</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="1"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="fullTimeEmployees">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Full-Time Employees</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="1"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="partTimeEmployees">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Part-Time Employees</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="1"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="contractors">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Contractors</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="1"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department Distribution Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Department Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="numberOfManagement">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Management</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="1"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="numberOfSalesMarketingStaff">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Sales & Marketing</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="1"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="numberOfResearchDevelopmentStaff">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Research & Development</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="1"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="numberOfCustomerServiceSupportStaff">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Customer Service & Support</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="1"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="numberOfGeneralStaff">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>General Staff</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="1"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="employeeGrowthRate">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Employee Growth Rate (%)</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="0.01"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0.00"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="employeeTurnoverRate">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Employee Turnover Rate (%)</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="0.01"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0.00"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="averageTenureMonths">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Average Tenure (months)</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="0.1"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0.0"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Costs Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Staff Costs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="managementCosts">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Management Costs</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="0.01"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0.00"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="salesMarketingStaffCosts">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Sales & Marketing Costs</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="0.01"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0.00"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="researchDevelopmentStaffCosts">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>R&D Costs</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="0.01"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0.00"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="customerServiceSupportStaffCosts">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Customer Service & Support Costs</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="0.01"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0.00"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="generalStaffCosts">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>General Staff Costs</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="0.01"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0.00"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="staffCostsTotal">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Total Staff Costs</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="0.01"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0.00"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="space-y-2">
                <form.Field name="notes">
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Notes (Optional)</Label>
                      <Textarea
                        id={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter any additional notes about these team metrics..."
                        rows={3}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>

        </CardContent>
        
        {/* Submit Button */}
        <CardFooter className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditMode ? 'Update Team Metrics' : 'Create Team Metrics'}
                  </>
                )}
              </Button>
            )}
          </form.Subscribe>
        </CardFooter>
      </form>
    </Card>
  );
}