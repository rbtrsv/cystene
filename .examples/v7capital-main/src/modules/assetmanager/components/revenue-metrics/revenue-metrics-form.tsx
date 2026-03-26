'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useRevenueMetrics } from '@/modules/assetmanager/hooks/use-revenue-metrics';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
import { CreateRevenueMetricsSchema, UpdateRevenueMetricsSchema, type RevenueMetrics, type FinancialScenario, type Quarter, type Semester, type Month } from '@/modules/assetmanager/schemas/revenue-metrics.schemas';
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
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/modules/shadcnui/components/ui/select';
import { Save } from 'lucide-react';

interface RevenueMetricsFormProps {
  id?: number;
  initialData?: RevenueMetrics;
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

export default function RevenueMetricsForm({ id, initialData }: RevenueMetricsFormProps) {
  const router = useRouter();
  const { selectedRevenueMetric, addRevenueMetric, editRevenueMetric, fetchRevenueMetric, isLoading, error, clearError } = useRevenueMetrics();
  const { companies } = useCompanies();
  
  const isEditMode = !!id;
  const currentYear = new Date().getFullYear();
  
  // TanStack Form setup with schema validation
  const form = useForm({
    defaultValues: {
      companyId: initialData?.companyId || selectedRevenueMetric?.companyId || undefined,
      year: initialData?.year?.toString() || selectedRevenueMetric?.year?.toString() || currentYear.toString(),
      semester: initialData?.semester || selectedRevenueMetric?.semester || '',
      quarter: initialData?.quarter || selectedRevenueMetric?.quarter || '',
      month: initialData?.month || selectedRevenueMetric?.month || '',
      scenario: initialData?.scenario || selectedRevenueMetric?.scenario || 'Actual',
      fullYear: initialData?.fullYear || selectedRevenueMetric?.fullYear || false,
      date: initialData?.date || selectedRevenueMetric?.date || '',

      // Core revenue metrics
      recurringRevenue: initialData?.recurringRevenue?.toString() || selectedRevenueMetric?.recurringRevenue?.toString() || '',
      nonRecurringRevenue: initialData?.nonRecurringRevenue?.toString() || selectedRevenueMetric?.nonRecurringRevenue?.toString() || '',
      revenueGrowthRate: initialData?.revenueGrowthRate?.toString() || selectedRevenueMetric?.revenueGrowthRate?.toString() || '',

      // Revenue breakdown
      existingCustomerExistingSeatsRevenue: initialData?.existingCustomerExistingSeatsRevenue?.toString() || selectedRevenueMetric?.existingCustomerExistingSeatsRevenue?.toString() || '',
      existingCustomerAdditionalSeatsRevenue: initialData?.existingCustomerAdditionalSeatsRevenue?.toString() || selectedRevenueMetric?.existingCustomerAdditionalSeatsRevenue?.toString() || '',
      newCustomerNewSeatsRevenue: initialData?.newCustomerNewSeatsRevenue?.toString() || selectedRevenueMetric?.newCustomerNewSeatsRevenue?.toString() || '',
      discountsAndRefunds: initialData?.discountsAndRefunds?.toString() || selectedRevenueMetric?.discountsAndRefunds?.toString() || '',

      // SaaS metrics
      arr: initialData?.arr?.toString() || selectedRevenueMetric?.arr?.toString() || '',
      mrr: initialData?.mrr?.toString() || selectedRevenueMetric?.mrr?.toString() || '',

      // Per customer metrics
      averageRevenuePerCustomer: initialData?.averageRevenuePerCustomer?.toString() || selectedRevenueMetric?.averageRevenuePerCustomer?.toString() || '',
      averageContractValue: initialData?.averageContractValue?.toString() || selectedRevenueMetric?.averageContractValue?.toString() || '',

      // Retention metrics
      revenueChurnRate: initialData?.revenueChurnRate?.toString() || selectedRevenueMetric?.revenueChurnRate?.toString() || '',
      netRevenueRetention: initialData?.netRevenueRetention?.toString() || selectedRevenueMetric?.netRevenueRetention?.toString() || '',
      grossRevenueRetention: initialData?.grossRevenueRetention?.toString() || selectedRevenueMetric?.grossRevenueRetention?.toString() || '',

      // Cohort growth rates
      growthRateCohort1: initialData?.growthRateCohort1?.toString() || selectedRevenueMetric?.growthRateCohort1?.toString() || '',
      growthRateCohort2: initialData?.growthRateCohort2?.toString() || selectedRevenueMetric?.growthRateCohort2?.toString() || '',
      growthRateCohort3: initialData?.growthRateCohort3?.toString() || selectedRevenueMetric?.growthRateCohort3?.toString() || '',

      // Additional
      notes: initialData?.notes || selectedRevenueMetric?.notes || '',
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
          
          // Core revenue metrics
          recurringRevenue: value.recurringRevenue ? Number(value.recurringRevenue) : undefined,
          nonRecurringRevenue: value.nonRecurringRevenue ? Number(value.nonRecurringRevenue) : undefined,
          revenueGrowthRate: value.revenueGrowthRate ? Number(value.revenueGrowthRate) : undefined,
          
          // Revenue breakdown
          existingCustomerExistingSeatsRevenue: value.existingCustomerExistingSeatsRevenue ? Number(value.existingCustomerExistingSeatsRevenue) : undefined,
          existingCustomerAdditionalSeatsRevenue: value.existingCustomerAdditionalSeatsRevenue ? Number(value.existingCustomerAdditionalSeatsRevenue) : undefined,
          newCustomerNewSeatsRevenue: value.newCustomerNewSeatsRevenue ? Number(value.newCustomerNewSeatsRevenue) : undefined,
          discountsAndRefunds: value.discountsAndRefunds ? Number(value.discountsAndRefunds) : undefined,
          
          // SaaS metrics
          arr: value.arr ? Number(value.arr) : undefined,
          mrr: value.mrr ? Number(value.mrr) : undefined,
          
          // Per customer metrics
          averageRevenuePerCustomer: value.averageRevenuePerCustomer ? Number(value.averageRevenuePerCustomer) : undefined,
          averageContractValue: value.averageContractValue ? Number(value.averageContractValue) : undefined,
          
          // Retention metrics
          revenueChurnRate: value.revenueChurnRate ? Number(value.revenueChurnRate) : undefined,
          netRevenueRetention: value.netRevenueRetention ? Number(value.netRevenueRetention) : undefined,
          grossRevenueRetention: value.grossRevenueRetention ? Number(value.grossRevenueRetention) : undefined,
          
          // Cohort growth rates
          growthRateCohort1: value.growthRateCohort1 ? Number(value.growthRateCohort1) : undefined,
          growthRateCohort2: value.growthRateCohort2 ? Number(value.growthRateCohort2) : undefined,
          growthRateCohort3: value.growthRateCohort3 ? Number(value.growthRateCohort3) : undefined,
          
          // Additional
          notes: value.notes || undefined,
        };
        
        const schema = isEditMode ? UpdateRevenueMetricsSchema : CreateRevenueMetricsSchema;
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
        
        // Core revenue metrics
        recurringRevenue: value.recurringRevenue ? Number(value.recurringRevenue) : undefined,
        nonRecurringRevenue: value.nonRecurringRevenue ? Number(value.nonRecurringRevenue) : undefined,
        revenueGrowthRate: value.revenueGrowthRate ? Number(value.revenueGrowthRate) : undefined,
        
        // Revenue breakdown
        existingCustomerExistingSeatsRevenue: value.existingCustomerExistingSeatsRevenue ? Number(value.existingCustomerExistingSeatsRevenue) : undefined,
        existingCustomerAdditionalSeatsRevenue: value.existingCustomerAdditionalSeatsRevenue ? Number(value.existingCustomerAdditionalSeatsRevenue) : undefined,
        newCustomerNewSeatsRevenue: value.newCustomerNewSeatsRevenue ? Number(value.newCustomerNewSeatsRevenue) : undefined,
        discountsAndRefunds: value.discountsAndRefunds ? Number(value.discountsAndRefunds) : undefined,
        
        // SaaS metrics
        arr: value.arr ? Number(value.arr) : undefined,
        mrr: value.mrr ? Number(value.mrr) : undefined,
        
        // Per customer metrics
        averageRevenuePerCustomer: value.averageRevenuePerCustomer ? Number(value.averageRevenuePerCustomer) : undefined,
        averageContractValue: value.averageContractValue ? Number(value.averageContractValue) : undefined,
        
        // Retention metrics
        revenueChurnRate: value.revenueChurnRate ? Number(value.revenueChurnRate) : undefined,
        netRevenueRetention: value.netRevenueRetention ? Number(value.netRevenueRetention) : undefined,
        grossRevenueRetention: value.grossRevenueRetention ? Number(value.grossRevenueRetention) : undefined,
        
        // Cohort growth rates
        growthRateCohort1: value.growthRateCohort1 ? Number(value.growthRateCohort1) : undefined,
        growthRateCohort2: value.growthRateCohort2 ? Number(value.growthRateCohort2) : undefined,
        growthRateCohort3: value.growthRateCohort3 ? Number(value.growthRateCohort3) : undefined,
        
        // Additional
        notes: value.notes || undefined,
      };
      
      const schema = isEditMode ? UpdateRevenueMetricsSchema : CreateRevenueMetricsSchema;
      const result = schema.parse(transformedValue);
      
      const success = isEditMode 
        ? await editRevenueMetric(id!, result)
        : await addRevenueMetric(result);
        
      if (success) {
        router.push(isEditMode ? `/dashboard/revenue-metrics/${id}` : '/dashboard/revenue-metrics');
      }
    },
  });
  
  useEffect(() => {
    if (isEditMode && id && !initialData) fetchRevenueMetric(id);
  }, [isEditMode, id, initialData, fetchRevenueMetric]);
  
  useEffect(() => {
    if (selectedRevenueMetric && isEditMode) {
      form.reset({
        companyId: selectedRevenueMetric.companyId,
        year: selectedRevenueMetric.year?.toString() || currentYear.toString(),
        semester: selectedRevenueMetric.semester || '',
        quarter: selectedRevenueMetric.quarter || '',
        month: selectedRevenueMetric.month || '',
        scenario: selectedRevenueMetric.scenario || 'Actual',
        fullYear: selectedRevenueMetric.fullYear || false,
        date: selectedRevenueMetric.date || '',
        
        // Core revenue metrics
        recurringRevenue: selectedRevenueMetric.recurringRevenue?.toString() || '',
        nonRecurringRevenue: selectedRevenueMetric.nonRecurringRevenue?.toString() || '',
        revenueGrowthRate: selectedRevenueMetric.revenueGrowthRate?.toString() || '',
        
        // Revenue breakdown
        existingCustomerExistingSeatsRevenue: selectedRevenueMetric.existingCustomerExistingSeatsRevenue?.toString() || '',
        existingCustomerAdditionalSeatsRevenue: selectedRevenueMetric.existingCustomerAdditionalSeatsRevenue?.toString() || '',
        newCustomerNewSeatsRevenue: selectedRevenueMetric.newCustomerNewSeatsRevenue?.toString() || '',
        discountsAndRefunds: selectedRevenueMetric.discountsAndRefunds?.toString() || '',
        
        // SaaS metrics
        arr: selectedRevenueMetric.arr?.toString() || '',
        mrr: selectedRevenueMetric.mrr?.toString() || '',
        
        // Per customer metrics
        averageRevenuePerCustomer: selectedRevenueMetric.averageRevenuePerCustomer?.toString() || '',
        averageContractValue: selectedRevenueMetric.averageContractValue?.toString() || '',
        
        // Retention metrics
        revenueChurnRate: selectedRevenueMetric.revenueChurnRate?.toString() || '',
        netRevenueRetention: selectedRevenueMetric.netRevenueRetention?.toString() || '',
        grossRevenueRetention: selectedRevenueMetric.grossRevenueRetention?.toString() || '',
        
        // Cohort growth rates
        growthRateCohort1: selectedRevenueMetric.growthRateCohort1?.toString() || '',
        growthRateCohort2: selectedRevenueMetric.growthRateCohort2?.toString() || '',
        growthRateCohort3: selectedRevenueMetric.growthRateCohort3?.toString() || '',
        
        // Additional
        notes: selectedRevenueMetric.notes || '',
      });
    }
  }, [selectedRevenueMetric, isEditMode, form, currentYear]);

  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Revenue Metrics' : 'Create Revenue Metrics'}</CardTitle>
          <CardDescription>Loading revenue metrics information...</CardDescription>
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
          <CardTitle>{isEditMode ? 'Edit Revenue Metrics' : 'Create Revenue Metrics'}</CardTitle>
          <CardDescription>Error loading revenue metrics</CardDescription>
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
          {isEditMode ? 'Edit Revenue Metrics' : 'Create Revenue Metrics'}
        </CardTitle>
        <CardDescription>
          {isEditMode ? 'Update revenue metrics details' : 'Add new revenue metrics'}
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

          {/* Core Revenue Metrics Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Core Revenue Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="recurringRevenue">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Recurring Revenue</Label>
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
                  <form.Field name="nonRecurringRevenue">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Non-Recurring Revenue</Label>
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
                  <form.Field name="revenueGrowthRate">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Revenue Growth Rate (%)</Label>
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

          {/* Revenue Breakdown Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="existingCustomerExistingSeatsRevenue">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Existing Customer Existing Seats Revenue</Label>
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
                  <form.Field name="existingCustomerAdditionalSeatsRevenue">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Existing Customer Additional Seats Revenue</Label>
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
                  <form.Field name="newCustomerNewSeatsRevenue">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>New Customer New Seats Revenue</Label>
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
                  <form.Field name="discountsAndRefunds">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Discounts and Refunds</Label>
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

          {/* SaaS Metrics Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">SaaS Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="arr">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Annual Recurring Revenue (ARR)</Label>
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
                  <form.Field name="mrr">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Monthly Recurring Revenue (MRR)</Label>
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

          {/* Per Customer Metrics Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Per Customer Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="averageRevenuePerCustomer">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Average Revenue Per Customer</Label>
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
                  <form.Field name="averageContractValue">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Average Contract Value</Label>
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

          {/* Retention Metrics Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Retention Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="revenueChurnRate">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Revenue Churn Rate (%)</Label>
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
                  <form.Field name="netRevenueRetention">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Net Revenue Retention (%)</Label>
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
                  <form.Field name="grossRevenueRetention">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Gross Revenue Retention (%)</Label>
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

          {/* Cohort Growth Rates Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Cohort Growth Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="growthRateCohort1">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Growth Rate Cohort 1 (%)</Label>
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
                  <form.Field name="growthRateCohort2">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Growth Rate Cohort 2 (%)</Label>
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
                  <form.Field name="growthRateCohort3">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Growth Rate Cohort 3 (%)</Label>
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
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter any additional notes"
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
                    {isEditMode ? 'Update Revenue Metrics' : 'Create Revenue Metrics'}
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