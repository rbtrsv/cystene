'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useCustomerMetrics } from '@/modules/assetmanager/hooks/use-customer-metrics';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
import { CreateCustomerMetricsSchema, UpdateCustomerMetricsSchema, type CustomerMetrics, type FinancialScenario, type Quarter, type Semester, type Month } from '@/modules/assetmanager/schemas/customer-metrics.schemas';
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
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/modules/shadcnui/components/ui/select';
import { Save } from 'lucide-react';

interface CustomerMetricsFormProps {
  id?: number;
  initialData?: CustomerMetrics;
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

export default function CustomerMetricsForm({ id, initialData }: CustomerMetricsFormProps) {
  const router = useRouter();
  const { selectedCustomerMetric, addCustomerMetric, editCustomerMetric, fetchCustomerMetric, isLoading, error, clearError } = useCustomerMetrics();
  const { companies, fetchCompanies } = useCompanies();
  
  const isEditMode = !!id;
  const currentYear = new Date().getFullYear();
  
  // TanStack Form setup with schema validation
  const form = useForm({
    defaultValues: {
      companyId: initialData?.companyId || selectedCustomerMetric?.companyId || undefined,
      year: initialData?.year?.toString() || selectedCustomerMetric?.year?.toString() || currentYear.toString(),
      semester: initialData?.semester || selectedCustomerMetric?.semester || '',
      quarter: initialData?.quarter || selectedCustomerMetric?.quarter || '',
      month: initialData?.month || selectedCustomerMetric?.month || '',
      scenario: initialData?.scenario || selectedCustomerMetric?.scenario || 'Actual',
      fullYear: initialData?.fullYear || selectedCustomerMetric?.fullYear || false,
      date: initialData?.date || selectedCustomerMetric?.date || '',

      // Customer counts
      totalCustomers: initialData?.totalCustomers?.toString() || selectedCustomerMetric?.totalCustomers?.toString() || '',
      newCustomers: initialData?.newCustomers?.toString() || selectedCustomerMetric?.newCustomers?.toString() || '',
      churnedCustomers: initialData?.churnedCustomers?.toString() || selectedCustomerMetric?.churnedCustomers?.toString() || '',

      // User metrics
      totalUsers: initialData?.totalUsers?.toString() || selectedCustomerMetric?.totalUsers?.toString() || '',
      activeUsers: initialData?.activeUsers?.toString() || selectedCustomerMetric?.activeUsers?.toString() || '',
      totalMonthlyActiveClientUsers: initialData?.totalMonthlyActiveClientUsers?.toString() || selectedCustomerMetric?.totalMonthlyActiveClientUsers?.toString() || '',

      // User breakdown
      existingCustomerExistingSeatsUsers: initialData?.existingCustomerExistingSeatsUsers?.toString() || selectedCustomerMetric?.existingCustomerExistingSeatsUsers?.toString() || '',
      existingCustomerAdditionalSeatsUsers: initialData?.existingCustomerAdditionalSeatsUsers?.toString() || selectedCustomerMetric?.existingCustomerAdditionalSeatsUsers?.toString() || '',
      newCustomerNewSeatsUsers: initialData?.newCustomerNewSeatsUsers?.toString() || selectedCustomerMetric?.newCustomerNewSeatsUsers?.toString() || '',
      userGrowthRate: initialData?.userGrowthRate?.toString() || selectedCustomerMetric?.userGrowthRate?.toString() || '',

      // Addressable market
      newCustomerTotalAddressableSeats: initialData?.newCustomerTotalAddressableSeats?.toString() || selectedCustomerMetric?.newCustomerTotalAddressableSeats?.toString() || '',
      newCustomerNewSeatsPercentSigned: initialData?.newCustomerNewSeatsPercentSigned?.toString() || selectedCustomerMetric?.newCustomerNewSeatsPercentSigned?.toString() || '',
      newCustomerTotalAddressableSeatsRemaining: initialData?.newCustomerTotalAddressableSeatsRemaining?.toString() || selectedCustomerMetric?.newCustomerTotalAddressableSeatsRemaining?.toString() || '',

      // Customer segments
      existingCustomerCount: initialData?.existingCustomerCount?.toString() || selectedCustomerMetric?.existingCustomerCount?.toString() || '',
      existingCustomerExpansionCount: initialData?.existingCustomerExpansionCount?.toString() || selectedCustomerMetric?.existingCustomerExpansionCount?.toString() || '',
      newCustomerCount: initialData?.newCustomerCount?.toString() || selectedCustomerMetric?.newCustomerCount?.toString() || '',
      customerGrowthRate: initialData?.customerGrowthRate?.toString() || selectedCustomerMetric?.customerGrowthRate?.toString() || '',

      // Customer acquisition
      cac: initialData?.cac?.toString() || selectedCustomerMetric?.cac?.toString() || '',
      ltv: initialData?.ltv?.toString() || selectedCustomerMetric?.ltv?.toString() || '',
      ltvCacRatio: initialData?.ltvCacRatio?.toString() || selectedCustomerMetric?.ltvCacRatio?.toString() || '',
      paybackPeriod: initialData?.paybackPeriod?.toString() || selectedCustomerMetric?.paybackPeriod?.toString() || '',
      customerChurnRate: initialData?.customerChurnRate?.toString() || selectedCustomerMetric?.customerChurnRate?.toString() || '',

      // Efficiency metrics
      customerAcquisitionEfficiency: initialData?.customerAcquisitionEfficiency?.toString() || selectedCustomerMetric?.customerAcquisitionEfficiency?.toString() || '',
      salesEfficiency: initialData?.salesEfficiency?.toString() || selectedCustomerMetric?.salesEfficiency?.toString() || '',

      notes: initialData?.notes || selectedCustomerMetric?.notes || '',
    },
    
    // Form-level validation using full schema
    validators: {
      onChange: ({ value }) => {
        // Transform strings to proper types for schema validation
        const transformedValue = {
          companyId: value.companyId,
          year: value.year ? Number(value.year) : undefined,
          semester: value.semester || undefined,
          quarter: value.quarter || undefined,
          month: value.month || undefined,
          scenario: value.scenario as FinancialScenario,
          fullYear: value.fullYear || false,
          date: value.date || undefined,
          
          // Transform all number fields
          totalCustomers: value.totalCustomers ? Number(value.totalCustomers) : undefined,
          newCustomers: value.newCustomers ? Number(value.newCustomers) : undefined,
          churnedCustomers: value.churnedCustomers ? Number(value.churnedCustomers) : undefined,
          
          totalUsers: value.totalUsers ? Number(value.totalUsers) : undefined,
          activeUsers: value.activeUsers ? Number(value.activeUsers) : undefined,
          totalMonthlyActiveClientUsers: value.totalMonthlyActiveClientUsers ? Number(value.totalMonthlyActiveClientUsers) : undefined,
          
          existingCustomerExistingSeatsUsers: value.existingCustomerExistingSeatsUsers ? Number(value.existingCustomerExistingSeatsUsers) : undefined,
          existingCustomerAdditionalSeatsUsers: value.existingCustomerAdditionalSeatsUsers ? Number(value.existingCustomerAdditionalSeatsUsers) : undefined,
          newCustomerNewSeatsUsers: value.newCustomerNewSeatsUsers ? Number(value.newCustomerNewSeatsUsers) : undefined,
          userGrowthRate: value.userGrowthRate ? Number(value.userGrowthRate) : undefined,
          
          newCustomerTotalAddressableSeats: value.newCustomerTotalAddressableSeats ? Number(value.newCustomerTotalAddressableSeats) : undefined,
          newCustomerNewSeatsPercentSigned: value.newCustomerNewSeatsPercentSigned ? Number(value.newCustomerNewSeatsPercentSigned) : undefined,
          newCustomerTotalAddressableSeatsRemaining: value.newCustomerTotalAddressableSeatsRemaining ? Number(value.newCustomerTotalAddressableSeatsRemaining) : undefined,
          
          existingCustomerCount: value.existingCustomerCount ? Number(value.existingCustomerCount) : undefined,
          existingCustomerExpansionCount: value.existingCustomerExpansionCount ? Number(value.existingCustomerExpansionCount) : undefined,
          newCustomerCount: value.newCustomerCount ? Number(value.newCustomerCount) : undefined,
          customerGrowthRate: value.customerGrowthRate ? Number(value.customerGrowthRate) : undefined,
          
          cac: value.cac ? Number(value.cac) : undefined,
          ltv: value.ltv ? Number(value.ltv) : undefined,
          ltvCacRatio: value.ltvCacRatio ? Number(value.ltvCacRatio) : undefined,
          paybackPeriod: value.paybackPeriod ? Number(value.paybackPeriod) : undefined,
          customerChurnRate: value.customerChurnRate ? Number(value.customerChurnRate) : undefined,
          
          customerAcquisitionEfficiency: value.customerAcquisitionEfficiency ? Number(value.customerAcquisitionEfficiency) : undefined,
          salesEfficiency: value.salesEfficiency ? Number(value.salesEfficiency) : undefined,
          
          notes: value.notes || undefined,
        };
        
        const schema = isEditMode ? UpdateCustomerMetricsSchema : CreateCustomerMetricsSchema;
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
      // Transform and validate at submission
      const transformedValue = {
        companyId: value.companyId!,
        year: Number(value.year),
        semester: value.semester || undefined,
        quarter: value.quarter || undefined,
        month: value.month || undefined,
        scenario: value.scenario as FinancialScenario,
        fullYear: value.fullYear || false,
        date: value.date || undefined,
        
        totalCustomers: value.totalCustomers ? Number(value.totalCustomers) : undefined,
        newCustomers: value.newCustomers ? Number(value.newCustomers) : undefined,
        churnedCustomers: value.churnedCustomers ? Number(value.churnedCustomers) : undefined,
        
        totalUsers: value.totalUsers ? Number(value.totalUsers) : undefined,
        activeUsers: value.activeUsers ? Number(value.activeUsers) : undefined,
        totalMonthlyActiveClientUsers: value.totalMonthlyActiveClientUsers ? Number(value.totalMonthlyActiveClientUsers) : undefined,
        
        existingCustomerExistingSeatsUsers: value.existingCustomerExistingSeatsUsers ? Number(value.existingCustomerExistingSeatsUsers) : undefined,
        existingCustomerAdditionalSeatsUsers: value.existingCustomerAdditionalSeatsUsers ? Number(value.existingCustomerAdditionalSeatsUsers) : undefined,
        newCustomerNewSeatsUsers: value.newCustomerNewSeatsUsers ? Number(value.newCustomerNewSeatsUsers) : undefined,
        userGrowthRate: value.userGrowthRate ? Number(value.userGrowthRate) : undefined,
        
        newCustomerTotalAddressableSeats: value.newCustomerTotalAddressableSeats ? Number(value.newCustomerTotalAddressableSeats) : undefined,
        newCustomerNewSeatsPercentSigned: value.newCustomerNewSeatsPercentSigned ? Number(value.newCustomerNewSeatsPercentSigned) : undefined,
        newCustomerTotalAddressableSeatsRemaining: value.newCustomerTotalAddressableSeatsRemaining ? Number(value.newCustomerTotalAddressableSeatsRemaining) : undefined,
        
        existingCustomerCount: value.existingCustomerCount ? Number(value.existingCustomerCount) : undefined,
        existingCustomerExpansionCount: value.existingCustomerExpansionCount ? Number(value.existingCustomerExpansionCount) : undefined,
        newCustomerCount: value.newCustomerCount ? Number(value.newCustomerCount) : undefined,
        customerGrowthRate: value.customerGrowthRate ? Number(value.customerGrowthRate) : undefined,
        
        cac: value.cac ? Number(value.cac) : undefined,
        ltv: value.ltv ? Number(value.ltv) : undefined,
        ltvCacRatio: value.ltvCacRatio ? Number(value.ltvCacRatio) : undefined,
        paybackPeriod: value.paybackPeriod ? Number(value.paybackPeriod) : undefined,
        customerChurnRate: value.customerChurnRate ? Number(value.customerChurnRate) : undefined,
        
        customerAcquisitionEfficiency: value.customerAcquisitionEfficiency ? Number(value.customerAcquisitionEfficiency) : undefined,
        salesEfficiency: value.salesEfficiency ? Number(value.salesEfficiency) : undefined,
        
        notes: value.notes || undefined,
      };
      
      const schema = isEditMode ? UpdateCustomerMetricsSchema : CreateCustomerMetricsSchema;
      const result = schema.parse(transformedValue);
      
      const success = isEditMode 
        ? await editCustomerMetric(id!, result)
        : await addCustomerMetric(result);
        
      if (success) {
        router.push(isEditMode ? `/dashboard/customer-metrics/${id}` : '/dashboard/customer-metrics');
      }
    },
  });
  
  useEffect(() => {
    fetchCompanies();
    if (isEditMode && id && !initialData) {
      fetchCustomerMetric(id);
    }
  }, [isEditMode, id, initialData, fetchCustomerMetric, fetchCompanies]);
  
  useEffect(() => {
    if (selectedCustomerMetric && isEditMode) {
      form.reset({
        companyId: selectedCustomerMetric.companyId || undefined,
        year: selectedCustomerMetric.year?.toString() || currentYear.toString(),
        semester: selectedCustomerMetric.semester || '',
        quarter: selectedCustomerMetric.quarter || '',
        month: selectedCustomerMetric.month || '',
        scenario: selectedCustomerMetric.scenario || 'Actual',
        fullYear: selectedCustomerMetric.fullYear || false,
        date: selectedCustomerMetric.date || '',
        
        totalCustomers: selectedCustomerMetric.totalCustomers?.toString() || '',
        newCustomers: selectedCustomerMetric.newCustomers?.toString() || '',
        churnedCustomers: selectedCustomerMetric.churnedCustomers?.toString() || '',
        
        totalUsers: selectedCustomerMetric.totalUsers?.toString() || '',
        activeUsers: selectedCustomerMetric.activeUsers?.toString() || '',
        totalMonthlyActiveClientUsers: selectedCustomerMetric.totalMonthlyActiveClientUsers?.toString() || '',
        
        existingCustomerExistingSeatsUsers: selectedCustomerMetric.existingCustomerExistingSeatsUsers?.toString() || '',
        existingCustomerAdditionalSeatsUsers: selectedCustomerMetric.existingCustomerAdditionalSeatsUsers?.toString() || '',
        newCustomerNewSeatsUsers: selectedCustomerMetric.newCustomerNewSeatsUsers?.toString() || '',
        userGrowthRate: selectedCustomerMetric.userGrowthRate?.toString() || '',
        
        newCustomerTotalAddressableSeats: selectedCustomerMetric.newCustomerTotalAddressableSeats?.toString() || '',
        newCustomerNewSeatsPercentSigned: selectedCustomerMetric.newCustomerNewSeatsPercentSigned?.toString() || '',
        newCustomerTotalAddressableSeatsRemaining: selectedCustomerMetric.newCustomerTotalAddressableSeatsRemaining?.toString() || '',
        
        existingCustomerCount: selectedCustomerMetric.existingCustomerCount?.toString() || '',
        existingCustomerExpansionCount: selectedCustomerMetric.existingCustomerExpansionCount?.toString() || '',
        newCustomerCount: selectedCustomerMetric.newCustomerCount?.toString() || '',
        customerGrowthRate: selectedCustomerMetric.customerGrowthRate?.toString() || '',
        
        cac: selectedCustomerMetric.cac?.toString() || '',
        ltv: selectedCustomerMetric.ltv?.toString() || '',
        ltvCacRatio: selectedCustomerMetric.ltvCacRatio?.toString() || '',
        paybackPeriod: selectedCustomerMetric.paybackPeriod?.toString() || '',
        customerChurnRate: selectedCustomerMetric.customerChurnRate?.toString() || '',
        
        customerAcquisitionEfficiency: selectedCustomerMetric.customerAcquisitionEfficiency?.toString() || '',
        salesEfficiency: selectedCustomerMetric.salesEfficiency?.toString() || '',
        
        notes: selectedCustomerMetric.notes || '',
      });
    }
  }, [selectedCustomerMetric, isEditMode, form, currentYear]);

  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Customer Metrics' : 'Create Customer Metrics'}</CardTitle>
          <CardDescription>Loading customer metrics information...</CardDescription>
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
          <CardTitle>{isEditMode ? 'Edit Customer Metrics' : 'Create Customer Metrics'}</CardTitle>
          <CardDescription>Error loading form</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">{error}</div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </>
    );
  }

  return (
    <Card className="max-w-5xl mx-auto max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {isEditMode ? 'Edit Customer Metrics' : 'Create Customer Metrics'}
        </CardTitle>
        <CardDescription>
          {isEditMode ? 'Update customer metrics details' : 'Add new customer metrics'}
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
              </div>
            </CardContent>
          </Card>

          {/* Customer Counts */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Customer Counts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                
                <div className="space-y-2">
                  <form.Field name="totalCustomers">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Total Customers</Label>
                        <Input
                          id={field.name}
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
                  <form.Field name="newCustomers">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>New Customers</Label>
                        <Input
                          id={field.name}
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
                  <form.Field name="churnedCustomers">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Churned Customers</Label>
                        <Input
                          id={field.name}
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

          {/* User Metrics */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">User Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                
                <div className="space-y-2">
                  <form.Field name="totalUsers">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Total Users</Label>
                        <Input
                          id={field.name}
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
                  <form.Field name="activeUsers">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Active Users</Label>
                        <Input
                          id={field.name}
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
                  <form.Field name="totalMonthlyActiveClientUsers">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Monthly Active Users</Label>
                        <Input
                          id={field.name}
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

          {/* User Breakdown */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">User Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                
                <div className="space-y-2">
                  <form.Field name="existingCustomerExistingSeatsUsers">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Existing Customer Existing Seats</Label>
                        <Input
                          id={field.name}
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
                  <form.Field name="existingCustomerAdditionalSeatsUsers">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Existing Customer Additional Seats</Label>
                        <Input
                          id={field.name}
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
                  <form.Field name="newCustomerNewSeatsUsers">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>New Customer New Seats</Label>
                        <Input
                          id={field.name}
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
                  <form.Field name="userGrowthRate">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>User Growth Rate (%)</Label>
                        <Input
                          id={field.name}
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

          {/* Addressable Market */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Addressable Market</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                
                <div className="space-y-2">
                  <form.Field name="newCustomerTotalAddressableSeats">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Total Addressable Seats</Label>
                        <Input
                          id={field.name}
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
                  <form.Field name="newCustomerNewSeatsPercentSigned">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>New Seats Percent Signed (%)</Label>
                        <Input
                          id={field.name}
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
                  <form.Field name="newCustomerTotalAddressableSeatsRemaining">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Addressable Seats Remaining</Label>
                        <Input
                          id={field.name}
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

          {/* Customer Segments */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Customer Segments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                
                <div className="space-y-2">
                  <form.Field name="existingCustomerCount">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Existing Customer Count</Label>
                        <Input
                          id={field.name}
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
                  <form.Field name="existingCustomerExpansionCount">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Existing Customer Expansion Count</Label>
                        <Input
                          id={field.name}
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
                  <form.Field name="newCustomerCount">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>New Customer Count</Label>
                        <Input
                          id={field.name}
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
                  <form.Field name="customerGrowthRate">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Customer Growth Rate (%)</Label>
                        <Input
                          id={field.name}
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

          {/* Customer Acquisition */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Customer Acquisition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                
                <div className="space-y-2">
                  <form.Field name="cac">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Customer Acquisition Cost (CAC)</Label>
                        <Input
                          id={field.name}
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
                  <form.Field name="ltv">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Lifetime Value (LTV)</Label>
                        <Input
                          id={field.name}
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
                  <form.Field name="ltvCacRatio">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>LTV/CAC Ratio</Label>
                        <Input
                          id={field.name}
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
                  <form.Field name="paybackPeriod">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Payback Period (months)</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="customerChurnRate">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Customer Churn Rate (%)</Label>
                        <Input
                          id={field.name}
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

          {/* Retention & Efficiency */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Retention & Efficiency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                
                <div className="space-y-2">
                  <form.Field name="customerAcquisitionEfficiency">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Customer Acquisition Efficiency</Label>
                        <Input
                          id={field.name}
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
                  <form.Field name="salesEfficiency">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Sales Efficiency</Label>
                        <Input
                          id={field.name}
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

          {/* Notes */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="space-y-2">
                <form.Field name="notes">
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Additional Notes (Optional)</Label>
                      <Textarea
                        id={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter any additional notes about these customer metrics..."
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
                    {isEditMode ? 'Update Customer Metrics' : 'Create Customer Metrics'}
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